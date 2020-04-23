/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent } from 'react';
import ReactN from 'reactn';
import { List } from 'immutable';

import { Alert, getStateQueryGridModel, LoadingSpinner, QueryGridModel, SchemaQuery } from '../..';

import { loadLineageIfNeeded, NodeInteractionProvider, WithNodeInteraction } from './actions';
import { DEFAULT_LINEAGE_DISTANCE } from './constants';
import { LINEAGE_DIRECTIONS, LineageOptions } from './types';
import { Lineage, LineageNode, LineageNodeMetadata } from './models';
import {
    VisGraphClusterNode,
    VisGraphCombinedNode,
    VisGraphNode,
    VisGraphNodeType,
    VisGraphOptions,
} from './vis/VisGraphGenerator';
import { VisGraph } from './vis/VisGraph';
import { ClusterNodeDetail, SelectedNodeDetail, SummaryOptions } from './LineageNodeDetail';

const omittedColumns = List(['Alias', 'Description', 'Name', 'SampleSet', 'DataClass']);
const requiredColumns = List(['Run']);

interface LinageGraphOwnProps {
    distance?: number;
    hideLegacyLinks?: boolean;
    initialModel?: QueryGridModel;
    lsid: string;
    members?: LINEAGE_DIRECTIONS;
    navigate?: (node: VisGraphNode) => any;
}

export class LineageGraph extends ReactN.PureComponent<LinageGraphOwnProps & LineageOptions & SummaryOptions> {
    componentDidMount() {
        loadLineageIfNeeded(this.props.lsid, this.props.distance, this.props);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.lsid !== nextProps.lsid || this.props.distance !== nextProps.distance) {
            loadLineageIfNeeded(nextProps.lsid, nextProps.distance, nextProps);
        }
    }

    getLineage(): Lineage {
        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid_lineageResults.get(this.props.lsid);
    }

    render() {
        const lineage = this.getLineage();

        return (
            <LineageGraphDisplay
                {...this.props}
                lineage={lineage}
                visGraphOptions={lineage?.generateGraph(this.props)}
            />
        );
    }
}

interface LineageGraphDisplayProps {
    lineage: Lineage;
    visGraphOptions: VisGraphOptions;
}

interface LineageGraphDisplayState {
    hoverNode: VisGraphNodeType;
    nodeInteractions: WithNodeInteraction;
    selectedNodes: VisGraphNodeType[];
}

class LineageGraphDisplay extends PureComponent<
    LineageGraphDisplayProps & LinageGraphOwnProps & LineageOptions & SummaryOptions,
    Partial<LineageGraphDisplayState>
> {
    static defaultProps = {
        distance: DEFAULT_LINEAGE_DISTANCE,
    };

    private readonly visGraphRef = undefined;

    constructor(props: LineageGraphDisplayProps & LinageGraphOwnProps & LineageOptions & SummaryOptions) {
        super(props);

        this.visGraphRef = React.createRef();

        this.state = {
            nodeInteractions: {
                isNodeInGraph: this.isNodeInGraph,
                onNodeMouseOver: this.onSummaryNodeMouseOver,
                onNodeMouseOut: this.onSummaryNodeMouseOut,
                onNodeClick: this.onSummaryNodeClick,
            },
        };
    }

    clearHover = (): void => {
        this.updateHover(undefined);
    };

    // if the node is in the graph, it is clickable in the summary panel
    isNodeInGraph = (node: LineageNode): boolean => {
        return this.visGraphRef.current?.getNetwork().findNode(node.lsid).length > 0;
    };

    onSummaryNodeClick = (node: LineageNode): void => {
        this.onSummaryNodeMouseOut(node);

        this.visGraphRef.current?.selectNodes([node.lsid]);
    };

    onSummaryNodeMouseEvent = (node: LineageNode, hover: boolean): void => {
        // clear the hoverNode so the popover will hide
        this.clearHover();

        this.visGraphRef.current?.highlightNode(node, hover);
    };

    onSummaryNodeMouseOut = (node: LineageNode): void => {
        this.onSummaryNodeMouseEvent(node, false);
    };

    onSummaryNodeMouseOver = (node: LineageNode): void => {
        this.onSummaryNodeMouseEvent(node, true);
    };

    onVisGraphNodeDoubleClick = (visNode: VisGraphNode): void => {
        if (this.props.navigate) {
            this.props.navigate(visNode);
        }
    };

    onVisGraphNodeSelect = (selectedNodes: VisGraphNodeType[]): void => {
        this.setState({
            selectedNodes,
        });
    };

    onVisGraphNodeDeselect = (selectedNodes: VisGraphNodeType[]): void => {
        this.setState({
            selectedNodes,
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

    renderSelectedGraphNode(seed: string, hoverNodeLsid: string, node: VisGraphNode, showSummaryOverride?: boolean) {
        const { showSummary, summaryOptions } = this.props;
        const { lineageNode } = node;

        // Apply "LineageOptions" when summaryOptions not explicitly given
        const options = summaryOptions ? summaryOptions : { ...this.props };

        return (
            <SelectedNodeDetail
                seed={seed}
                node={lineageNode}
                entityModel={this.getNodeGridDataModel(lineageNode)}
                highlightNode={hoverNodeLsid}
                showSummary={showSummaryOverride ?? showSummary}
                summaryOptions={options}
            />
        );
    }

    renderSelectedClusterNode(seed: string, hoverNodeLsid: string, node: VisGraphClusterNode) {
        // LineageNodes in the cluster
        const nodes = node.nodesInCluster.map(n => n.kind === 'node' && n.lineageNode);

        return (
            <ClusterNodeDetail
                highlightNode={hoverNodeLsid}
                nodes={nodes}
                nodesByType={undefined}
                options={this.props}
            />
        );
    }

    renderSelectedCombinedNode(seed: string, hoverNodeLsid: string, node: VisGraphCombinedNode) {
        const { lineage } = this.props;
        if (!lineage && !lineage.result) return null;

        return (
            <ClusterNodeDetail
                highlightNode={hoverNodeLsid}
                nodes={node.containedNodes}
                nodesByType={node.containedNodesByType}
                options={this.props}
            />
        );
    }

    getNodeGridDataModel(node: LineageNode): QueryGridModel {
        if (node.schemaName && node.queryName && node.id) {
            return getStateQueryGridModel(
                'lineage-selected',
                SchemaQuery.create(node.schemaName, node.queryName),
                {
                    allowSelection: false,
                    omittedColumns,
                    requiredColumns,
                },
                node.id
            );
        }
    }

    createInitialLineageNode(): LineageNode {
        const { initialModel } = this.props;
        const row = initialModel.getRow();
        const lsid = row.getIn(['LSID', 'value']);

        return LineageNode.create(lsid, {
            id: row.getIn(['RowId', 'value']),
            name: row.getIn(['Name', 'value']),
            schemaName: initialModel.schema,
            queryName: initialModel.query,
            url: row.getIn(['RowId', 'url']),
            meta: new LineageNodeMetadata({
                displayType: initialModel.queryInfo.title,
                description: row.getIn(['Description', 'value']),
            }),
        });
    }

    render() {
        const { initialModel, lineage, lsid, visGraphOptions } = this.props;

        if (lineage) {
            if (lineage.error) {
                return <Alert>{lineage.error}</Alert>;
            }

            return (
                <NodeInteractionProvider value={this.state.nodeInteractions}>
                    <div className="row">
                        <div className="col-md-8">
                            <VisGraph
                                ref={this.visGraphRef}
                                onNodeDoubleClick={this.onVisGraphNodeDoubleClick}
                                onNodeSelect={this.onVisGraphNodeSelect}
                                onNodeDeselect={this.onVisGraphNodeDeselect}
                                onNodeHover={this.updateHover}
                                onNodeBlur={this.onVisGraphNodeBlur}
                                options={visGraphOptions}
                                seed={lineage.getSeed()}
                            />
                        </div>
                        <div className="col-md-4 lineage-node-detail-container">
                            {this.renderSelectedNodes(lineage.getSeed())}
                        </div>
                    </div>
                </NodeInteractionProvider>
            );
        } else {
            return (
                <NodeInteractionProvider value={this.state.nodeInteractions}>
                    <div className="row">
                        <div className="col-md-8">
                            <div className="top-spacing">
                                <LoadingSpinner msg="Loading lineage..." />
                            </div>
                        </div>
                        <div className="col-md-4 lineage-node-detail-container">
                            {initialModel ? (
                                this.renderSelectedGraphNode(
                                    lsid,
                                    undefined,
                                    {
                                        id: lsid,
                                        kind: 'node',
                                        lineageNode: this.createInitialLineageNode(),
                                    },
                                    false
                                )
                            ) : (
                                <LoadingSpinner msg="Loading details..." />
                            )}
                        </div>
                    </div>
                </NodeInteractionProvider>
            );
        }
    }
}
