import React, { FC, memo } from 'react';

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

export const LineageNodeDetailFactory: FC<LineageNodeDetailFactoryProps> = memo(props => {
    const { highlightNode, lineage, lineageOptions, selectedNodes } = props;

    if (!lineage || lineage.error) return null;

    if (!lineage.isLoaded()) {
        // Render selected node if seed has been pre-fetched
        if (!lineage.isSeedLoaded()) {
            return <LoadingSpinner msg="Loading details..." />;
        }

        const node = lineage.seedResult.nodes.get(lineage.seed);
        return <LineageNodeDetail key={node.lsid} lineageOptions={lineageOptions} node={node} seed={lineage.seed} />;
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
                    key={node.lineageNode.lsid}
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
});
LineageNodeDetailFactory.displayName = 'LineageNodeDetailFactory';
