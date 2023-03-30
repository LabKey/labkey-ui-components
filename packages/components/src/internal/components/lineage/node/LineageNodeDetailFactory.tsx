import React, { PureComponent, ReactNode } from 'react';

import { LineageOptions } from '../types';
import { isBasicNode, isClusterNode, isCombinedNode, Lineage, VisGraphNodeType } from '../models';

import { LoadingSpinner } from '../../base/LoadingSpinner';

import { ClusterNodeDetail, LineageNodeDetail } from './LineageNodeDetail';

export interface LineageNodeDetailFactoryProps {
    highlightNode: string;
    lineage: Lineage;
    lineageOptions: LineageOptions;
    selectedNodes: VisGraphNodeType[];
}

export class LineageNodeDetailFactory extends PureComponent<LineageNodeDetailFactoryProps> {
    render(): ReactNode {
        const { highlightNode, lineage, lineageOptions, selectedNodes } = this.props;

        if (!lineage || lineage.error) {
            return null;
        }

        if (!lineage.isLoaded()) {
            // Render selected node if seed has been pre-fetched
            if (lineage.isSeedLoaded()) {
                return (
                    <LineageNodeDetail
                        lineageOptions={lineageOptions}
                        node={lineage.seedResult.nodes.get(lineage.seed)}
                        seed={lineage.seed}
                    />
                );
            }
            return <LoadingSpinner msg="Loading details..." />;
        }

        if (!selectedNodes || selectedNodes.length === 0) {
            return <em>Select a node from the graph to view the details.</em>;
        }

        if (selectedNodes.length === 1) {
            const node = selectedNodes[0];

            if (isBasicNode(node)) {
                return (
                    <LineageNodeDetail
                        highlightNode={highlightNode}
                        lineageOptions={lineageOptions}
                        node={node.lineageNode}
                        seed={lineage.seed}
                    />
                );
            } else if (isCombinedNode(node)) {
                return (
                    <ClusterNodeDetail
                        highlightNode={highlightNode}
                        nodes={node.containedNodes}
                        nodesByType={node.containedNodesByType}
                        options={lineageOptions}
                        parentNodeName={node.parentNodeName}
                    />
                );
            } else if (isClusterNode(node)) {
                return (
                    <ClusterNodeDetail
                        highlightNode={highlightNode}
                        // LineageNodes in cluster
                        nodes={node.nodesInCluster.map(n => n.kind === 'node' && n.lineageNode)}
                        options={lineageOptions}
                    />
                );
            }

            throw new Error('unknown node kind');
        }

        return <div>Multiple selected nodes</div>;
    }
}
