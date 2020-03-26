/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import ReactN from 'reactn';
import { List } from 'immutable';
import { LoadingSpinner } from '../..';

import { LineageLink, LineageOptions, LineageResult } from './models';
import { DEFAULT_LINEAGE_DISTANCE, LINEAGE_DIRECTIONS } from './constants';
import { loadLineageIfNeeded } from './actions';
import { createLineageNodeCollections } from './vis/VisGraphGenerator';
import { LineageNodeList } from './LineageNodeList';

interface Props {
    seed: string
    highlightNode?: string
    options?: LineageOptions
}

export class LineageSummary extends ReactN.Component<Props> {

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
        const { options, seed } = this.props;

        // need to access this.global directly to connect this component to the re-render cycle
        const lineage = this.global.QueryGrid_lineageResults.get(seed);

        return lineage?.filterResult(options);
    }

    renderNodeList(
        direction: LINEAGE_DIRECTIONS,
        lineage: LineageResult,
        edges: List<LineageLink>,
        highlightNode: string
    ) {
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

        if (!node) {
            return <div>Unable to resolve lineage for seed: {lineage.seed}</div>
        }

        const { children, parents } = node;
        const hasChildren = !this.empty(children);
        const hasParents = !this.empty(parents);

        if (!hasChildren && !hasParents) {
            return <div>No lineage for {node.name}</div>
        }

        return (
            <>
                {this.renderNodeList(LINEAGE_DIRECTIONS.Parent, lineage, parents, highlightNode)}
                {hasChildren && hasParents && <hr/>}
                {this.renderNodeList(LINEAGE_DIRECTIONS.Children, lineage, children, highlightNode)}
            </>
        );
    }
}
