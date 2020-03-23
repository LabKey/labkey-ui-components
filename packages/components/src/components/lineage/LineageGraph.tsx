/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import ReactN from 'reactn';
import { List } from 'immutable';
import { Alert, AppURL, getStateQueryGridModel, LoadingSpinner, QueryGridModel, SchemaQuery } from '../..';

import { loadLineageIfNeeded } from './actions';
import { DEFAULT_LINEAGE_DISTANCE, LINEAGE_DIRECTIONS } from './constants';
import {
    ILineageGroupingOptions,
    Lineage,
    LineageFilter,
    LineageGroupingOptions,
    LineageNode,
    LineageNodeMetadata,
    LineageOptions,
} from './models';
import {
    VisGraphClusterNode,
    VisGraphCombinedNode,
    VisGraphNode,
    VisGraphNodeType,
} from './vis/VisGraphGenerator';
import { VisGraph } from './vis/VisGraph';
import { ClusterNodeDetail, SelectedNodeDetail } from './LineageNodeDetail';

const omittedColumns = List(['Alias', 'Description', 'Name', 'SampleSet', 'DataClass']);
const requiredColumns = List(['Run']);

interface LinageGraphProps {
    lsid: string
    navigate: (node: VisGraphNode) => any
    members?: LINEAGE_DIRECTIONS
    distance?: number
    filters?: List<LineageFilter>
    filterIn?: boolean
    grouping?: ILineageGroupingOptions
    hideLegacyLinks?: boolean
    initialModel?: QueryGridModel
}

export class LineageGraph extends ReactN.Component<LinageGraphProps, any> {

    componentDidMount() {
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
        return <LineageGraphDisplay {...this.props} lineage={this.getLineage()}/>
    }
}

interface LineageGraphDisplayProps extends LinageGraphProps {
    lineage: Lineage
}

interface LineageGraphDisplayState {
    hoverNode?: VisGraphNodeType
    selectedNodes?: Array<VisGraphNodeType>
}

class LineageGraphDisplay extends React.PureComponent<LineageGraphDisplayProps, LineageGraphDisplayState> {

    static defaultProps = {
        filterIn: true,
        distance: DEFAULT_LINEAGE_DISTANCE
    };

    private readonly visGraphRef = undefined;

    constructor(props: LineageGraphDisplayProps) {
        super(props);

        this.visGraphRef = React.createRef();

        this.state = {};
    }

    clearHover = (): void => {
        this.updateHover(undefined);
    };

    // if the node is in the graph, it is clickable in the summary panel
    isNodeInGraph = (node: LineageNode): boolean => {
        let lsid = node.get('lsid');

        const visGraph = this.visGraphRef.current;
        if (visGraph) {
            let network = visGraph.getNetwork();
            let clusterIds = network.findNode(lsid);
            return clusterIds.length > 0;
        }

        return false;
    };

    onSummaryNodeClick = (node: LineageNode): void => {
        this.onSummaryNodeMouseOut(node);
        const visGraph = this.visGraphRef.current;
        if (visGraph) {
            // select the node
            let lsid = node.get('lsid');
            visGraph.selectNodes([lsid]);
        }
    };

    onSummaryNodeMouseEvent = (node: LineageNode, hover: boolean) => {
        // clear the hoverNode so the popover will hide
        this.clearHover();

        const visGraph = this.visGraphRef.current;
        if (visGraph) {
            visGraph.highlightNode(node, hover);
        }
    };

    onSummaryNodeMouseOut = (node: LineageNode): void => {
        this.onSummaryNodeMouseEvent(node, false);
    };

    onSummaryNodeMouseOver = (node: LineageNode): void => {
        this.onSummaryNodeMouseEvent(node, true);
    };

    onVisGraphNodeDoubleClick = (visNode: VisGraphNode): void => {
        this.props.navigate(visNode);
    };

    onVisGraphNodeSelect = (selectedNodes: Array<VisGraphNodeType>): void => {
        this.setState({
            selectedNodes
        });
    };

    onVisGraphNodeDeselect = (selectedNodes: Array<VisGraphNodeType>): void => {
        this.setState({
            selectedNodes
        });
    };

    onVisGraphNodeBlur = (): void => {
        this.clearHover();
    };

    updateHover = (hoverNode: VisGraphNodeType): void => {
        this.setState({
            hoverNode,
        });
    };

    renderSelectedNodes(seed: string) {
        const { selectedNodes, hoverNode } = this.state;

        if (!selectedNodes || selectedNodes.length == 0) {
            return <em>Select a node from the graph to view the details.</em>;
        }
        else if (selectedNodes.length === 1) {
            const hoverNodeLsid = hoverNode && hoverNode.kind === 'node' && hoverNode.lineageNode && hoverNode.lineageNode.lsid;
            const selectedNode = selectedNodes[0];
            switch (selectedNode.kind) {
                case 'node':     return this.renderSelectedGraphNode(seed, hoverNodeLsid, selectedNode);
                case 'combined': return this.renderSelectedCombinedNode(seed, hoverNodeLsid, selectedNode);
                case 'cluster':  return this.renderSelectedClusterNode(seed, hoverNodeLsid, selectedNode);
                default:
                    throw new Error('unknown node kind');
            }
        }
        else {
            return <div>multiple selected nodes</div>;
        }
    }

    renderSelectedGraphNode(seed: string, hoverNodeLsid: string, node: VisGraphNode, showLineageSummary: boolean = true) {
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
                showLineageSummary={showLineageSummary}
            />
        );
    }

    renderSelectedClusterNode(seed: string, hoverNodeLsid: string, node: VisGraphClusterNode) {
        // LineageNodes in the cluster
        const nodes = node.nodesInCluster.map(n => n.kind === 'node' && n.lineageNode);

        return <ClusterNodeDetail
            highlightNode={hoverNodeLsid}
            nodes={nodes}
            nodesByType={undefined}
            onNodeMouseOver={this.onSummaryNodeMouseOver}
            onNodeMouseOut={this.onSummaryNodeMouseOut}
            onNodeClick={this.onSummaryNodeClick}
        />;
    }

    renderSelectedCombinedNode(seed: string, hoverNodeLsid: string, node: VisGraphCombinedNode) {
        const { lineage } = this.props;
        if (!lineage && !lineage.result)
            return null;

        return <ClusterNodeDetail
            highlightNode={hoverNodeLsid}
            nodes={node.containedNodes}
            nodesByType={node.containedNodesByType}
            onNodeMouseOver={this.onSummaryNodeMouseOver}
            onNodeMouseOut={this.onSummaryNodeMouseOut}
            onNodeClick={this.onSummaryNodeClick}
        />;
    }

    getNodeGridDataModel(node: LineageNode): QueryGridModel|undefined {
        if (node.schemaName && node.queryName && node.rowId) {
            return getStateQueryGridModel('lineage-selected', SchemaQuery.create(node.schemaName, node.queryName), {
                allowSelection: false,
                omittedColumns,
                requiredColumns
            }, node.rowId);
        }
    }

    createInitialLineageNode(): LineageNode {
        const { initialModel } = this.props;
        const row = initialModel.getRow();
        const lsid = row.getIn(['LSID', 'value']);

        return LineageNode.create(lsid, {
            name: row.getIn(['Name', 'value']),
            schemaName: initialModel.schema,
            queryName: initialModel.query,
            rowId: row.getIn(['RowId', 'value']),
            url: row.getIn(['RowId', 'url']),
            meta: new LineageNodeMetadata({
                displayType: initialModel.queryInfo.title,
                description: row.getIn(['Description', 'value'])
            }),
            lsid
        })
    }

    render() {
        const { lineage, filters, filterIn, grouping } = this.props;

        if (lineage) {
            if (lineage.error) {
                return <Alert>{lineage.error}</Alert>
            }

            const graphOptions = lineage.generateGraph(new LineageOptions({
                filters,
                filterIn,
                grouping: grouping ? new LineageGroupingOptions(grouping): undefined,
            }));

            const lineageGridHref = AppURL.create('lineage')
                .addParams({
                    seeds: lineage.getSeed(),
                    distance: this.props.distance
                })
                .toHref();

            return (
                <div className='row'>
                    <div className='col-md-8'>
                        <VisGraph
                            ref={this.visGraphRef}
                            lineageGridHref={lineageGridHref}
                            onNodeDoubleClick={this.onVisGraphNodeDoubleClick}
                            onNodeSelect={this.onVisGraphNodeSelect}
                            onNodeDeselect={this.onVisGraphNodeDeselect}
                            onNodeHover={this.updateHover}
                            onNodeBlur={this.onVisGraphNodeBlur}
                            options={graphOptions}
                            seed={lineage.getSeed()}
                        />
                    </div>
                    <div className='col-md-4 lineage-node-detail-container'>
                        {this.renderSelectedNodes(lineage.getSeed())}
                    </div>
                </div>
            )
        }
        else {
            return (
                <div className='row'>
                    <div className='col-md-8'>
                        <div className='top-spacing'>
                            <LoadingSpinner  msg="Loading lineage..."/>
                        </div>
                    </div>
                    <div className='col-md-4 lineage-node-detail-container'>
                        {this.props.initialModel ? this.renderSelectedGraphNode(this.props.lsid, undefined, {
                            id: this.props.lsid,
                            cid: 0,
                            kind: 'node',
                            lineageNode: this.createInitialLineageNode()
                        }, false) : <LoadingSpinner msg={"Loading details..."}/>}
                    </div>
                </div>
            )
        }
    }
}

