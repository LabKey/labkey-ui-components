/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import ReactN from 'reactn';
import { List } from 'immutable';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { LineageFilter, LineageLink, LineageNode, LineageOptions, LineageResult } from './models';
import { DEFAULT_LINEAGE_DISTANCE, LINEAGE_DIRECTIONS } from './constants';
import { loadLineageIfNeeded } from './actions';
import { createLineageNodeCollections } from './vis/VisGraphGenerator';
import { LineageNodeList } from './LineageNodeList';

interface Props {
    seed: string
    showRuns: boolean
    highlightNode?: string
    isNodeInGraph?: (node: LineageNode) => boolean
    onNodeMouseOver?: (node: LineageNode) => void
    onNodeMouseOut?: (node: LineageNode) => void
    onNodeClick?: (node: LineageNode) => void
}

export class LineageSummary extends ReactN.Component<Props, any> {

    componentDidMount() {
        const { seed } = this.props;
        loadLineageIfNeeded(seed, DEFAULT_LINEAGE_DISTANCE);
    }

    componentWillReceiveProps(nextProps: Props) {
        const { seed } = this.props;
        if (seed !== nextProps.seed) {
            loadLineageIfNeeded(nextProps.seed, DEFAULT_LINEAGE_DISTANCE);
        }
    }

    getLineageResult(): LineageResult {
        const { seed, showRuns } = this.props;

        // need to access this.global directly to connect this component to the re-render cycle
        const lineage = this.global.QueryGrid_lineageResults.get(seed);

        let options: LineageOptions;
        if (!showRuns) {
            options = new LineageOptions({
                filters: List<LineageFilter>([new LineageFilter('type', ['Sample', 'Data'])])
            });
        }

        return lineage ? lineage.filterResult(options) : undefined;
    }

    renderNodeList(direction, lineage, edges: List<LineageLink>, highlightNode) {
        if (this.empty(edges)) {
            return;
        }

        const nodes = edges.map(edge => lineage.nodes.get(edge.lsid)).toArray();

        const nodesByType = createLineageNodeCollections(nodes);
        const groups = Object.keys(nodesByType).sort();

        const title = direction === LINEAGE_DIRECTIONS.Parent ? "Parents" : "Children";

        return groups.map(groupName =>
            <LineageNodeList
                key={groupName}
                title={groupName + " " + title}
                nodes={nodesByType[groupName]}
                highlightNode={highlightNode}
                isNodeInGraph={this.props.isNodeInGraph}
                onNodeClick={this.props.onNodeClick}
                onNodeMouseOver={this.props.onNodeMouseOver}
                onNodeMouseOut={this.props.onNodeMouseOut}
            />
        );
    }

    private empty(nodes?: List<LineageLink>) {
        return !nodes || nodes.size === 0;
    }

    render() {
        const { highlightNode } = this.props;
        const lineage = this.getLineageResult();

        if (!lineage) {
            return <LoadingSpinner msg="Loading lineage..."/>
        }

        const node = lineage.nodes.get(lineage.seed);
        const parents: List<LineageLink> = node.get('parents');
        const children: List<LineageLink> = node.get('children');

        if (this.empty(parents) && this.empty(children)) {
            return <div>No lineage for {node.name}</div>
        }

        const hasBoth = !this.empty(parents) && !this.empty(children);

        return <>
            {this.renderNodeList(LINEAGE_DIRECTIONS.Parent, lineage, parents, highlightNode)}
            {hasBoth && <hr/>}
            {this.renderNodeList(LINEAGE_DIRECTIONS.Children, lineage, children, highlightNode)}
        </>;
    }
}
