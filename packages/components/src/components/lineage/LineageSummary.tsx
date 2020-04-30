/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ReactNode } from 'react';
import ReactN from 'reactn';
import { List, Map } from 'immutable';

import { LoadingSpinner } from '../..';

import { DEFAULT_LINEAGE_DISTANCE } from './constants';
import { LINEAGE_DIRECTIONS, LineageOptions } from './types';
import { Lineage, LineageLink, LineageResult } from './models';
import { loadLineageIfNeeded } from './actions';
import { createLineageNodeCollections } from './vis/VisGraphGenerator';
import { LineageNodeList } from './LineageNodeList';

interface Props {
    seed: string;
    highlightNode?: string;
    options?: LineageOptions;
}

export class LineageSummary extends ReactN.Component<Props> {
    componentDidMount() {
        this.load(this.props);
    }

    componentWillReceiveProps(nextProps: Props) {
        const { seed } = this.props;
        if (seed !== nextProps.seed) {
            this.load(nextProps);
        }
    }

    load = (props: Props) => {
        loadLineageIfNeeded(props.seed, DEFAULT_LINEAGE_DISTANCE, props.options);
    };

    getLineage(): Lineage {
        const { seed } = this.props;

        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid_lineageResults.get(seed);
    }

    renderNodeList = (
        direction: LINEAGE_DIRECTIONS,
        lineage: LineageResult,
        edges: List<LineageLink>,
        highlightNode: string
    ): ReactNode => {
        if (this.empty(edges)) {
            return;
        }

        const nodes = edges.map(edge => lineage.nodes.get(edge.lsid)).toArray();

        const nodesByType = createLineageNodeCollections(nodes, this.props.options);
        const groups = Object.keys(nodesByType).sort();

        const defaultTitleSuffix = direction === LINEAGE_DIRECTIONS.Parent ? 'Parents' : 'Children';
        // Issue 40008:  TBD This isn't a full fix here because of differences in treatment of the text of the queryName that identifies the groups
        const suffixes = this.props.options?.groupTitles?.get(direction) || Map<string, string>();

        return groups.map(groupName => (
            <LineageNodeList
                key={groupName}
                title={groupName + ' ' + (suffixes.has(groupName.toLowerCase()) ? suffixes.get(groupName.toLowerCase()) : defaultTitleSuffix)}
                nodes={nodesByType[groupName]}
                highlightNode={highlightNode}
            />
        ));
    };

    private empty(nodes?: List<LineageLink>): boolean {
        return !nodes || nodes.size === 0;
    }

    render() {
        const { highlightNode, options } = this.props;
        const lineage = this.getLineage();

        if (!lineage) {
            return <LoadingSpinner msg="Loading lineage..." />;
        } else if (lineage.error) {
            return <div>{lineage.error}</div>;
        }

        const result = lineage.filterResult(options);
        const node = result.nodes.get(result.seed);

        if (!node) {
            return <div>Unable to resolve lineage for seed: {result.seed}</div>;
        }

        const { children, parents } = node;
        const hasChildren = !this.empty(children);
        const hasParents = !this.empty(parents);

        if (!hasChildren && !hasParents) {
            return <div>No lineage for {node.name}</div>;
        }

        return (
            <>
                {this.renderNodeList(LINEAGE_DIRECTIONS.Parent, result, parents, highlightNode)}
                {hasChildren && hasParents && <hr />}
                {this.renderNodeList(LINEAGE_DIRECTIONS.Children, result, children, highlightNode)}
            </>
        );
    }
}
