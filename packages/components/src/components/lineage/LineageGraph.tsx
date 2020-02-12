/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as OrigReact from 'react';
import React from 'reactn';
import { List } from 'immutable';
import { ActionURL } from '@labkey/api';

import { getStateQueryGridModel } from '../../models';
import { gridInit } from '../../actions';
import { getQueryGridModel } from '../../global';
import { Detail } from '../forms/detail/Detail';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { AppURL } from '../../url/AppURL';
import { Alert } from '../base/Alert';
import { QueryGridModel, SchemaQuery } from '../base/models/model';
import { SVGIcon, Theme } from '../base/SVGIcon';

import { loadLineageIfNeeded } from './actions';
import { VisGraph } from './vis/VisGraph';
import { DEFAULT_LINEAGE_DISTANCE, LINEAGE_DIRECTIONS } from './constants';
import {
    createLineageNodeCollections,
    LineageNodeCollection,
    VisGraphClusterNode,
    VisGraphCombinedNode,
    VisGraphNode,
    VisGraphOptions,
} from './vis/VisGraphGenerator';
import {
    ILineageGroupingOptions,
    Lineage,
    LineageFilter,
    LineageGroupingOptions,
    LineageNode,
    LineageOptions,
} from './models';
import { LineageNodeList, LineageSummary } from './LineageSummary';

const omittedColumns = List(['Alias', 'Description', 'Name', 'SampleSet', 'DataClass']);
const requiredColumns = List(['Run']);

interface LinageGraphProps {
    lsid: string;
    navigate: (node: VisGraphNode) => any;
    members?: LINEAGE_DIRECTIONS;
    distance?: number;
    filters?: List<LineageFilter>;
    filterIn?: boolean;
    grouping?: ILineageGroupingOptions;
    hideLegacyLinks?: boolean;
}

export class LineageGraph extends React.Component<LinageGraphProps, any> {
    componentWillMount() {
        loadLineageIfNeeded(this.props.lsid, this.props.distance);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.lsid !== nextProps.lsid || this.props.distance !== nextProps.distance) {
            loadLineageIfNeeded(nextProps.lsid, nextProps.distance);
        }
    }

    getLineage(): Lineage {
        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid_lineageResults.get(this.props.lsid);
    }

    render() {
        return <LineageGraphDisplay {...this.props} lineage={this.getLineage()} />;
    }
}

interface LineageGraphDisplayProps extends LinageGraphProps {
    lineage: Lineage;
}

interface LineageGraphDisplayState {
    hoverNode?: VisGraphNode | VisGraphCombinedNode;
    hoverNodeCoords?: { top: number; left: number; bottom: number; right: number };
    selectedNodes?: Array<VisGraphNode | VisGraphCombinedNode | VisGraphClusterNode>;
}

class LineageGraphDisplay extends React.Component<LineageGraphDisplayProps, LineageGraphDisplayState> {
    static defaultProps = {
        filterIn: true,
        distance: DEFAULT_LINEAGE_DISTANCE,
    };

    private readonly visGraphRef = undefined;

    constructor(props: LineageGraphDisplayProps) {
        // @ts-ignore // see https://github.com/CharlesStover/reactn/issues/126
        super(props);

        this.onVisGraphNodeDoubleClick = this.onVisGraphNodeDoubleClick.bind(this);

        this.onVisGraphNodeSelect = this.onVisGraphNodeSelect.bind(this);
        this.onVisGraphNodeDeselect = this.onVisGraphNodeDeselect.bind(this);

        this.onVisGraphNodeHover = this.onVisGraphNodeHover.bind(this);
        this.onVisGraphNodeBlur = this.onVisGraphNodeBlur.bind(this);

        this.isNodeInGraph = this.isNodeInGraph.bind(this);
        this.onSummaryNodeMouseOver = this.onSummaryNodeMouseOver.bind(this);
        this.onSummaryNodeMouseOut = this.onSummaryNodeMouseOut.bind(this);
        this.onSummaryNodeClick = this.onSummaryNodeClick.bind(this);

        this.visGraphRef = OrigReact.createRef();

        this.state = {};
    }

    onVisGraphNodeDoubleClick(visNode: VisGraphNode) {
        this.props.navigate(visNode);
    }

    onVisGraphNodeSelect(selectedVisNodes) {
        this.setState({ selectedNodes: selectedVisNodes });
    }

    onVisGraphNodeDeselect(selectedVisNodes, previousSelectedVisNodes) {
        this.setState({ selectedNodes: selectedVisNodes });
    }

    onVisGraphNodeHover(visNode: VisGraphNode, coords) {
        const hoverNode = visNode;
        this.setState({
            hoverNode,
            hoverNodeCoords: coords,
        });
    }

    onVisGraphNodeBlur() {
        this.setState({ hoverNode: undefined, hoverNodeCoords: undefined });
    }

    // if the node is in the graph, it is clickable in the summary panel
    isNodeInGraph(node: LineageNode) {
        const lsid = node.get('lsid');

        const visGraph = this.visGraphRef.current;
        if (visGraph) {
            const network = visGraph.getNetwork();
            const clusterIds = network.findNode(lsid);
            return clusterIds.length > 0;
        }
    }

    onSummaryNodeMouseOver(node: LineageNode) {
        // clear the hoverNode so the popover will hide
        this.setState({
            hoverNode: undefined,
            hoverNodeCoords: undefined,
        });

        const visGraph = this.visGraphRef.current;
        if (visGraph) {
            visGraph.highlightNode(node, true);
        }
    }

    onSummaryNodeMouseOut(node: LineageNode) {
        this.setState({ hoverNode: undefined, hoverNodeCoords: undefined });

        const visGraph = this.visGraphRef.current;
        if (visGraph) {
            visGraph.highlightNode(node, false);
        }
    }

    onSummaryNodeClick(node: LineageNode) {
        this.onSummaryNodeMouseOut(node);
        const visGraph = this.visGraphRef.current;
        if (visGraph) {
            // select the node
            const lsid = node.get('lsid');
            visGraph.selectNodes([lsid]);
        }
    }

    renderSelectedNodes(seed: string, visGraphOptions: VisGraphOptions) {
        const { selectedNodes, hoverNode } = this.state;

        if (!selectedNodes || selectedNodes.length == 0) {
            return <em>Select a node from the graph to view the details.</em>;
        } else if (selectedNodes.length === 1) {
            const hoverNodeLsid =
                hoverNode && hoverNode.kind === 'node' && hoverNode.lineageNode && hoverNode.lineageNode.lsid;
            const selectedNode = selectedNodes[0];
            switch (selectedNode.kind) {
                case 'node':
                    return this.renderSelectedGraphNode(seed, hoverNodeLsid, selectedNode);
                case 'combined':
                    return this.renderSelectedCombinedNode(seed, hoverNodeLsid, selectedNode);
                case 'cluster':
                    return this.renderSelectedClusterNode(seed, hoverNodeLsid, selectedNode);
                default:
                    throw new Error('unknown node kind');
            }
        } else {
            return <div>multiple selected nodes</div>;
        }
    }

    renderSelectedGraphNode(seed: string, hoverNodeLsid: string, node: VisGraphNode) {
        const lineageNode = node.lineageNode;
        const model = this.getNodeGridDataModel(lineageNode);

        return (
            <SelectedNodeDetail
                seed={seed}
                node={lineageNode}
                entityModel={model}
                highlightNode={hoverNodeLsid}
                isNodeInGraph={this.isNodeInGraph}
                onNodeMouseOver={this.onSummaryNodeMouseOver}
                onNodeMouseOut={this.onSummaryNodeMouseOut}
                onNodeClick={this.onSummaryNodeClick}
                hideLegacyLinks={this.props.hideLegacyLinks}
            />
        );
    }

    renderSelectedClusterNode(seed: string, hoverNodeLsid: string, node: VisGraphClusterNode) {
        // LineageNodes in the cluster
        const nodes = node.nodesInCluster.map(n => n.kind === 'node' && n.lineageNode);

        return (
            <ClusterNodeDetail
                nodes={nodes}
                nodesByType={undefined}
                highlightNode={hoverNodeLsid}
                onNodeMouseOver={this.onSummaryNodeMouseOver}
                onNodeMouseOut={this.onSummaryNodeMouseOut}
                onNodeClick={this.onSummaryNodeClick}
            />
        );
    }

    renderSelectedCombinedNode(seed: string, hoverNodeLsid: string, node: VisGraphCombinedNode) {
        const { lineage } = this.props;
        if (!lineage && !lineage.result) return;

        return (
            <ClusterNodeDetail
                nodes={node.containedNodes}
                nodesByType={node.containedNodesByType}
                highlightNode={hoverNodeLsid}
                onNodeMouseOver={this.onSummaryNodeMouseOver}
                onNodeMouseOut={this.onSummaryNodeMouseOut}
                onNodeClick={this.onSummaryNodeClick}
            />
        );
    }

    getNodeGridDataModel(node: LineageNode): QueryGridModel | undefined {
        if (node.schemaName && node.queryName && node.rowId) {
            return getStateQueryGridModel(
                'lineage-selected',
                SchemaQuery.create(node.schemaName, node.queryName),
                {
                    allowSelection: false,
                    omittedColumns,
                    requiredColumns,
                },
                node.rowId
            );
        }
    }

    render() {
        const { lineage, filters, filterIn, grouping } = this.props;

        if (lineage) {
            if (lineage.error) {
                return <Alert>{lineage.error}</Alert>;
            }

            const options = new LineageOptions({
                filters,
                filterIn,
                grouping: grouping ? new LineageGroupingOptions(grouping) : undefined,
            });
            const graph = lineage.generateGraph(options);

            const lineageGridHref = AppURL.create('lineage')
                .addParams({
                    seeds: lineage.getSeed(),
                    distance: this.props.distance,
                })
                .toHref();

            return (
                <div className="row">
                    <div className="col-md-8">
                        <VisGraph
                            ref={this.visGraphRef}
                            lineageGridHref={lineageGridHref}
                            onNodeDoubleClick={this.onVisGraphNodeDoubleClick}
                            onNodeSelect={this.onVisGraphNodeSelect}
                            onNodeDeselect={this.onVisGraphNodeDeselect}
                            onNodeHover={this.onVisGraphNodeHover}
                            onNodeBlur={this.onVisGraphNodeBlur}
                            options={graph}
                            seed={lineage.getSeed()}
                        />
                    </div>
                    <div className="col-md-4" style={{ borderLeft: '1px solid #ddd' }}>
                        {this.renderSelectedNodes(lineage.getSeed(), graph)}
                    </div>
                </div>
            );
        }

        return <LoadingSpinner msg="Loading lineage..." />;
    }
}

interface SelectedNodeProps {
    seed: string;
    node: LineageNode;
    highlightNode?: string;
    entityModel?: QueryGridModel;
    isNodeInGraph?: (node: LineageNode) => boolean;
    onNodeMouseOver?: (node: LineageNode) => void;
    onNodeMouseOut?: (node: LineageNode) => void;
    onNodeClick?: (node: LineageNode) => void;
    hideLegacyLinks?: boolean;
}

// TODO: Refactor and share with ComponentDetailHOCImpl?
class SelectedNodeDetail extends React.Component<SelectedNodeProps, any> {
    constructor(props) {
        // @ts-ignore // see https://github.com/CharlesStover/reactn/issues/126
        super(props);

        this.isNodeInGraph = this.isNodeInGraph.bind(this);
        this.handleLinkClick = this.handleLinkClick.bind(this);
        this.onNodeMouseOver = this.onNodeMouseOver.bind(this);
        this.onNodeMouseOut = this.onNodeMouseOut.bind(this);
        this.onNodeClick = this.onNodeClick.bind(this);
    }

    componentWillMount() {
        this.loadEntity(this.props);
    }

    componentWillReceiveProps(nextProps: any) {
        this.loadEntity(nextProps);
    }

    loadEntity(props: any) {
        const { entityModel } = props;
        if (entityModel) {
            gridInit(entityModel, true, this);
        }
    }

    getQueryGridModel(): QueryGridModel {
        const { entityModel } = this.props;
        if (entityModel) {
            return getQueryGridModel(entityModel.getId());
        }
    }

    handleLinkClick(evt) {
        evt.stopPropagation();
        return false;
    }

    onNodeMouseOver(node: LineageNode) {
        if (this.props.onNodeMouseOver) {
            this.props.onNodeMouseOver(node);
        }
    }

    onNodeMouseOut(node: LineageNode) {
        if (this.props.onNodeMouseOut) {
            this.props.onNodeMouseOut(node);
        }
    }

    isNodeInGraph(node: LineageNode): boolean {
        if (this.props.isNodeInGraph) {
            return this.props.isNodeInGraph(node);
        }
        return false;
    }

    onNodeClick(node: LineageNode) {
        if (this.props.onNodeClick) {
            this.props.onNodeClick(node);
        }
    }

    render() {
        const { seed, node, highlightNode, hideLegacyLinks } = this.props;
        const url = node.url;
        const lineageUrl = url + '/lineage';
        const name = node.name;
        const isSeed = seed === node.lsid;

        let description;
        let aliases;
        let displayType;
        if (node.meta) {
            description = node.meta.description;
            aliases = node.meta.aliases;
            displayType = node.meta.displayType;
        }

        const model = this.getQueryGridModel();
        if (!model || !model.isLoaded) {
            return <LoadingSpinner msg="Loading details..." />;
        }

        const queryInfo = model.queryInfo;
        let legacyRunLineageUrl;
        let legacyDetailsLineageUrl;
        const row = model.getRow();
        if (row && row.get('Run')) {
            const runId = row.get('Run').get('value');

            legacyRunLineageUrl = ActionURL.buildURL('experiment', 'showRunGraph.view', LABKEY.container.path, {
                rowId: runId,
            });

            // see DotGraph.TYPECODE_* constants
            const typePrefix = node.type === 'Sample' ? 'M' : node.type === 'Data' ? 'D' : 'A';
            legacyDetailsLineageUrl = ActionURL.buildURL(
                'experiment',
                'showRunGraphDetail.view',
                LABKEY.container.path,
                {
                    rowId: runId,
                    detail: true,
                    focus: typePrefix + node.rowId,
                }
            );
        }

        return (
            <>
                <div className="margin-bottom" style={{ display: 'inline-block', width: '100%' }}>
                    <i className="component-detail--child--img">
                        <SVGIcon
                            iconDir="_images"
                            theme={Theme.ORANGE}
                            iconSrc={queryInfo.getIconURL()}
                            height="50px"
                            width="50px"
                        />
                    </i>
                    <div className="text__truncate">
                        <div className="lineage-name">
                            <h4 className="no-margin-top" style={{ display: 'inline' }}>
                                {(lineageUrl && !isSeed && (
                                    <a href={lineageUrl} onClick={this.handleLinkClick}>
                                        {name}
                                    </a>
                                )) ||
                                    name}
                                <div className="pull-right">
                                    <a
                                        href={url}
                                        style={{ paddingLeft: '1px', paddingRight: '1px' }}
                                        onClick={this.handleLinkClick}>
                                        <small style={{ lineHeight: 1, color: '#777', fontSize: '75%' }}>
                                            Overview
                                        </small>
                                    </a>
                                    <a
                                        href={lineageUrl}
                                        style={{ paddingLeft: '5px', paddingRight: '5px' }}
                                        onClick={this.handleLinkClick}>
                                        <small style={{ lineHeight: 1, color: '#777', fontSize: '75%' }}>Lineage</small>
                                    </a>
                                </div>
                            </h4>
                        </div>
                        {displayType && <small>{displayType}</small>}
                        {aliases && (
                            <div>
                                <small>{aliases.join(', ')}</small>
                            </div>
                        )}
                        {description && <small title={description}>{description}</small>}
                    </div>
                </div>

                {!hideLegacyLinks && LABKEY.user && LABKEY.user.isAdmin && legacyRunLineageUrl && (
                    <div className="pull-right">
                        <small title="(admin only) old school lineage graphs, opens in new window">
                            <em>
                                Legacy:&nbsp;
                                <a target="_blank" href={legacyRunLineageUrl} onClick={this.handleLinkClick}>
                                    run
                                </a>
                                &nbsp;|&nbsp;
                                <a target="_blank" href={legacyDetailsLineageUrl} onClick={this.handleLinkClick}>
                                    details
                                </a>
                            </em>
                        </small>
                    </div>
                )}

                <Detail queryModel={model} />

                <LineageSummary
                    seed={node.lsid}
                    showRuns={false}
                    highlightNode={highlightNode}
                    isNodeInGraph={this.isNodeInGraph}
                    onNodeMouseOver={this.onNodeMouseOver}
                    onNodeMouseOut={this.onNodeMouseOut}
                    onNodeClick={this.onNodeClick}
                />
            </>
        );
    }
}

interface ClusterNodeDetailProps {
    nodes: LineageNode[];
    nodesByType: { [key: string]: LineageNodeCollection };
    highlightNode?: string;
    isNodeInGraph?: (node: LineageNode) => boolean;
    onNodeMouseOver?: (node: LineageNode) => void;
    onNodeMouseOut?: (node: LineageNode) => void;
    onNodeClick?: (node: LineageNode) => void;
}

class ClusterNodeDetail extends React.Component<ClusterNodeDetailProps> {
    constructor(props) {
        // @ts-ignore // see https://github.com/CharlesStover/reactn/issues/126
        super(props);

        this.isNodeInGraph = this.isNodeInGraph.bind(this);
        this.onNodeMouseOver = this.onNodeMouseOver.bind(this);
        this.onNodeMouseOut = this.onNodeMouseOut.bind(this);
        this.onNodeClick = this.onNodeClick.bind(this);
    }

    onNodeMouseOver(node: LineageNode) {
        if (this.props.onNodeMouseOver) {
            this.props.onNodeMouseOver(node);
        }
    }

    onNodeMouseOut(node: LineageNode) {
        if (this.props.onNodeMouseOut) {
            this.props.onNodeMouseOut(node);
        }
    }

    isNodeInGraph(node: LineageNode): boolean {
        if (this.props.isNodeInGraph) {
            return this.props.isNodeInGraph(node);
        }
        return false;
    }

    onNodeClick(node: LineageNode) {
        if (this.props.onNodeClick) {
            this.props.onNodeClick(node);
        }
    }

    render() {
        const { nodes, highlightNode } = this.props;

        let nodesByType: { [key: string]: LineageNodeCollection };
        if (this.props.nodesByType) {
            nodesByType = this.props.nodesByType;
        } else {
            nodesByType = createLineageNodeCollections(nodes);
        }

        const groups = Object.keys(nodesByType).sort();

        let iconURL;
        let title;
        if (groups.length === 1) {
            title = nodes.length + ' ' + groups[0];
            iconURL = nodes[0].meta.iconURL;
        } else {
            title = nodes.length + ' items of different types';
            iconURL = 'default';
        }

        return (
            <>
                <div className="margin-bottom" style={{ display: 'inline-block', width: '100%' }}>
                    <i className="component-detail--child--img">
                        <SVGIcon iconDir="_images" theme={Theme.ORANGE} iconSrc={iconURL} height="50px" width="50px" />
                    </i>
                    <div className="text__truncate">
                        <div className="lineage-name">
                            <h4 className="no-margin-top" style={{ display: 'inline' }}>
                                {title}
                            </h4>
                        </div>
                    </div>
                </div>

                {groups.map(groupName => (
                    <div key={groupName}>
                        <LineageNodeList
                            title={groupName}
                            nodes={nodesByType[groupName]}
                            onNodeClick={this.onNodeClick}
                            onNodeMouseOut={this.onNodeMouseOut}
                            onNodeMouseOver={this.onNodeMouseOver}
                            isNodeInGraph={this.isNodeInGraph}
                            highlightNode={highlightNode}
                        />
                    </div>
                ))}
            </>
        );
    }
}
