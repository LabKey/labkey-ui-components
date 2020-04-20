/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';
import { List } from 'immutable';
import { LoadingSpinner } from '../..';

import { LINEAGE_DIRECTIONS, LineageOptions } from './types';
import { Lineage, LineageLink, LineageResult } from './models';
import { createLineageNodeCollections } from './vis/VisGraphGenerator';
import { LineageNodeList } from './node/LineageNodeList';
import { LineageContextConsumer } from './withLineage';

interface LineageSummaryOwnProps {
    highlightNode?: string
    options?: LineageOptions
}

class LineageSummaryImpl extends PureComponent<{ lineage: Lineage } & LineageSummaryOwnProps> {
    renderNodeList = (
        direction: LINEAGE_DIRECTIONS,
        lineage: LineageResult,
        edges: List<LineageLink>,
    ): ReactNode => {
        if (this.empty(edges)) {
            return;
        }
        const { highlightNode } = this.props;

        const nodes = edges.map(edge => lineage.nodes.get(edge.lsid)).toArray();

        const nodesByType = createLineageNodeCollections(nodes, this.props.options);
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
    };

    private empty(nodes?: List<LineageLink>): boolean {
        return !nodes || nodes.size === 0;
    }

    render() {
        const { lineage, options } = this.props;

        if (!lineage || !lineage.isLoaded()) {
            return <LoadingSpinner msg="Loading lineage..."/>;
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
                {this.renderNodeList(LINEAGE_DIRECTIONS.Parent, result, parents)}
                {hasChildren && hasParents && <hr/>}
                {this.renderNodeList(LINEAGE_DIRECTIONS.Children, result, children)}
            </>
        );
    }
}

export const LineageSummary: React.FC<LineageSummaryOwnProps> = (props) => (
    <LineageContextConsumer>
        {(lineage) => (
            <LineageSummaryImpl
                {...props}
                lineage={lineage}
            />
        )}
    </LineageContextConsumer>
);
