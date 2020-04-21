/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';
import { Alert, LoadingSpinner } from '../..';

import { InjectedLineage, withLineage, WithLineageOptions } from './withLineage';
import { NodeInteractionProvider, WithNodeInteraction } from './actions';
import { LINEAGE_DIRECTIONS, LineageOptions } from './types';
import { LineageNode } from './models';
import {
    isBasicNode,
    isClusterNode,
    isCombinedNode,
    VisGraphClusterNode,
    VisGraphCombinedNode,
    VisGraphNode,
    VisGraphNodeType,
} from './vis/VisGraphGenerator';
import { VisGraph } from './vis/VisGraph';
import { ClusterNodeDetail, LineageNodeDetail, SummaryOptions } from './node/LineageNodeDetail';

interface LinageGraphOwnProps {
    members?: LINEAGE_DIRECTIONS
    navigate?: (node: VisGraphNode) => any
}

interface LineageGraphDisplayState {
    hoverNode: VisGraphNodeType
    nodeInteractions: WithNodeInteraction
    selectedNodes: VisGraphNodeType[]
}

class LineageGraphDisplay extends PureComponent<InjectedLineage & WithLineageOptions & LinageGraphOwnProps & LineageOptions & SummaryOptions, Partial<LineageGraphDisplayState>> {

    private readonly visGraphRef = undefined;

    constructor(props: InjectedLineage & WithLineageOptions & LinageGraphOwnProps & LineageOptions & SummaryOptions) {
        super(props);

        this.visGraphRef = React.createRef();

        this.state = {
            nodeInteractions: {
                isNodeInGraph: this.isNodeInGraph,
                onNodeMouseOver: this.onSummaryNodeMouseOver,
                onNodeMouseOut: this.onSummaryNodeMouseOut,
                onNodeClick: this.onSummaryNodeClick,
            }
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

    renderNodeDetails(): ReactNode {
        const { lineage, lsid } = this.props;

        if (!lineage || lineage.error) {
            return null;
        } else if (!lineage.isLoaded()) {
            // Render selected node if seed has been pre-fetched
            if (lineage.isSeedLoaded()) {
                return this.renderSelectedNode(lineage.seedResult.nodes.get(lsid));
            }
            return <LoadingSpinner msg="Loading details..."/>;
        }

        const { selectedNodes, hoverNode } = this.state;

        if (!selectedNodes || selectedNodes.length == 0) {
            return <em>Select a node from the graph to view the details.</em>;
        } else if (selectedNodes.length === 1) {
            const hoverNodeLsid = isBasicNode(hoverNode) && hoverNode.lineageNode && hoverNode.lineageNode.lsid;
            const selectedNode = selectedNodes[0];

            if (isBasicNode(selectedNode)) {
                return this.renderSelectedNode(selectedNode.lineageNode, hoverNodeLsid);
            } else if (isCombinedNode(selectedNode)) {
                return this.renderSelectedCombinedNode(selectedNode, hoverNodeLsid)
            } else if (isClusterNode(selectedNode)) {
                return this.renderSelectedClusterNode(selectedNode, hoverNodeLsid);
            }

            throw new Error('unknown node kind');
        } else {
            return <div>multiple selected nodes</div>;
        }
    }

    renderSelectedNode(node: LineageNode, hoverNodeLsid?: string): ReactNode {
        const { lsid, summaryOptions } = this.props;

        // Apply "LineageOptions" when summaryOptions not explicitly given
        const options = summaryOptions ? summaryOptions : {...this.props};

        return (
            <LineageNodeDetail
                seed={lsid}
                node={node}
                highlightNode={hoverNodeLsid}
                summaryOptions={options}
            />
        );
    }

    renderSelectedClusterNode(node: VisGraphClusterNode, hoverNodeLsid: string): ReactNode {
        // LineageNodes in the cluster
        const nodes = node.nodesInCluster.map(n => n.kind === 'node' && n.lineageNode);

        return (
            <ClusterNodeDetail
                highlightNode={hoverNodeLsid}
                nodes={nodes}
                options={this.props}
            />
        );
    }

    renderSelectedCombinedNode(node: VisGraphCombinedNode, hoverNodeLsid?: string): ReactNode {
        const { lineage } = this.props;
        if (!lineage && !lineage.result)
            return null;

        return (
            <ClusterNodeDetail
                highlightNode={hoverNodeLsid}
                nodes={node.containedNodes}
                nodesByType={node.containedNodesByType}
                options={this.props}
            />
        );
    }

    render() {
        const { lineage, lsid, visGraphOptions } = this.props;

        if (lineage?.error) {
            return <Alert>{lineage.error}</Alert>
        }

        return (
            <NodeInteractionProvider value={this.state.nodeInteractions}>
                <div className="row">
                    <div className="col-md-8">
                        {lineage?.isLoaded() ? (
                            <VisGraph
                                ref={this.visGraphRef}
                                onNodeDoubleClick={this.onVisGraphNodeDoubleClick}
                                onNodeSelect={this.onVisGraphNodeSelect}
                                onNodeDeselect={this.onVisGraphNodeDeselect}
                                onNodeHover={this.updateHover}
                                onNodeBlur={this.onVisGraphNodeBlur}
                                options={visGraphOptions}
                                seed={lsid}
                            />
                        ) : <LoadingSpinner msg="Loading lineage..."/>}
                    </div>
                    <div className="col-md-4 lineage-node-detail-container">
                        {this.renderNodeDetails()}
                    </div>
                </div>
            </NodeInteractionProvider>
        );
    }
}

export const LineageGraph = withLineage<LinageGraphOwnProps & SummaryOptions>(LineageGraphDisplay);
