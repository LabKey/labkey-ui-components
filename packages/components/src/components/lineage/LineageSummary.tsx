/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';
import { List, Map } from 'immutable';

import { LoadingSpinner } from '../..';

import { LINEAGE_DIRECTIONS, LineageOptions } from './types';
import { LineageLink, LineageResult } from './models';
import { createLineageNodeCollections } from './vis/VisGraphGenerator';
import { DetailsListNodes } from './node/DetailsList';
import { InjectedLineage, withLineage } from './withLineage';

interface LineageSummaryOwnProps extends LineageOptions {
    highlightNode?: string;
}

class LineageSummaryImpl extends PureComponent<InjectedLineage & LineageSummaryOwnProps> {
    renderNodeList = (direction: LINEAGE_DIRECTIONS, lineage: LineageResult, edges: List<LineageLink>): ReactNode => {
        if (this.empty(edges)) {
            return null;
        }
        const { groupTitles, highlightNode } = this.props;

        const nodes = edges.map(edge => lineage.nodes.get(edge.lsid)).toArray();

        const nodesByType = createLineageNodeCollections(nodes, this.props);
        const groups = Object.keys(nodesByType).sort();

        const defaultTitleSuffix = direction === LINEAGE_DIRECTIONS.Parent ? 'Parents' : 'Children';
        // Issue 40008:  TBD This isn't a full fix here because of differences in treatment of the text of the queryName that identifies the groups
        const suffixes = groupTitles?.get(direction) || Map<string, string>();

        return groups.map(groupName => (
            <DetailsListNodes
                key={groupName}
                title={
                    groupName +
                    ' ' +
                    (suffixes.has(nodesByType[groupName].queryName) ? suffixes.get(nodesByType[groupName].queryName) : defaultTitleSuffix)
                }
                nodes={nodesByType[groupName]}
                highlightNode={highlightNode}
            />
        ));
    };

    private empty(nodes?: List<LineageLink>): boolean {
        return !nodes || nodes.size === 0;
    }

    render(): ReactNode {
        const { lineage } = this.props;

        if (!lineage || !lineage.isLoaded()) {
            return <LoadingSpinner msg="Loading lineage..." />;
        } else if (lineage.error) {
            return <div>{lineage.error}</div>;
        }

        const result = lineage.filterResult(this.props);
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
                {hasChildren && hasParents && <hr />}
                {this.renderNodeList(LINEAGE_DIRECTIONS.Children, result, children)}
            </>
        );
    }
}

export const LineageSummary = withLineage<LineageSummaryOwnProps>(LineageSummaryImpl);
