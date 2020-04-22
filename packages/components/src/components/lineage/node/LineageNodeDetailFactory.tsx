import React from 'react';

import { LoadingSpinner } from '../../..';

import { LineageOptions } from '../types';
import { Lineage } from '../models';
import { isBasicNode, isClusterNode, isCombinedNode, VisGraphNodeType } from '../vis/VisGraphGenerator';
import { ClusterNodeDetail, LineageNodeDetail } from './LineageNodeDetail';

export interface LineageNodeDetailFactoryProps {
    highlightNode: string
    lineage: Lineage
    lineageOptions: LineageOptions
    selectedNodes: VisGraphNodeType[]
    summaryOptions: LineageOptions
}

export const LineageNodeDetailFactory: React.FC<LineageNodeDetailFactoryProps> = (props) => {
    const { highlightNode, lineage, lineageOptions, selectedNodes, summaryOptions } = props;

    if (!lineage || lineage.error) {
        return null;
    } else if (!lineage.isLoaded()) {
        // Render selected node if seed has been pre-fetched
        if (lineage.isSeedLoaded()) {
            return (
                <LineageNodeDetail
                    seed={lineage.seed}
                    node={lineage.seedResult.nodes.get(lineage.seed)}
                    summaryOptions={summaryOptions}
                />
            );
        }
        return <LoadingSpinner msg="Loading details..."/>;
    }

    const seed = lineage.seed;

    if (!selectedNodes || selectedNodes.length == 0) {
        return <em>Select a node from the graph to view the details.</em>;
    } else if (selectedNodes.length === 1) {
        const node = selectedNodes[0];

        if (isBasicNode(node)) {
            return (
                <LineageNodeDetail
                    highlightNode={highlightNode}
                    node={node.lineageNode}
                    seed={seed}
                    summaryOptions={summaryOptions}
                />
            );
        } else if (isCombinedNode(node)) {
            return (
                <ClusterNodeDetail
                    highlightNode={highlightNode}
                    nodes={node.containedNodes}
                    nodesByType={node.containedNodesByType}
                    options={lineageOptions}
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
    } else {
        return <div>Multiple selected nodes</div>;
    }
};
