/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent } from 'react';

import { createLineageNodeCollections, LineageNodeCollectionByType } from '../vis/VisGraphGenerator';
import { LineageNodeList } from './LineageNodeList';
import { LineageSummary } from '../LineageSummary';
import { LineageNode } from '../models';
import { LineageOptions } from '../types';
import { getIconAndShapeForNode } from '../utils';
import { NodeDetail } from './NodeDetail';
import { NodeDetailHeader } from './NodeDetailHeader';

export interface SummaryOptions {
    showSummary?: boolean
    summaryOptions?: LineageOptions
}

interface LineageNodeDetailProps {
    highlightNode?: string
    node: LineageNode
    seed: string
}

export class LineageNodeDetail extends PureComponent<LineageNodeDetailProps & SummaryOptions> {

    static defaultProps = {
        showSummary: true
    };

    render() {
        const { seed, node, highlightNode, showSummary, summaryOptions } = this.props;
        const { links, meta, name } = node;
        const lineageUrl = links.lineage;
        const isSeed = seed === node.lsid;

        const aliases = meta?.aliases;
        const description = meta?.description;
        const displayType = meta?.displayType;

        const header = (
            <>
                {(lineageUrl && !isSeed) &&
                <a href={lineageUrl}>{name}</a>
                ||
                name
                }
                <div className="pull-right">
                    <a className="lineage-data-link-left"
                       href={node.links.overview}>
                        <span className="lineage-data-link--text">Overview</span>
                    </a>
                    {lineageUrl !== undefined && (
                        <a className="lineage-data-link-right"
                           href={lineageUrl}>
                            <span className="lineage-data-link--text">Lineage</span>
                        </a>
                    )}
                </div>
            </>
        );

        return <>
            <NodeDetailHeader
                header={header}
                iconSrc={getIconAndShapeForNode(node).iconURL}
            >
                {displayType && <small>{displayType}</small>}
                {aliases && (
                    <div>
                        <small>
                            {aliases.join(', ')}
                        </small>
                    </div>
                )}
                {description && <small title={description}>{description}</small>}
            </NodeDetailHeader>

            <NodeDetail node={node} />

            {showSummary && (
                <LineageSummary
                    seed={node.lsid}
                    highlightNode={highlightNode}
                    options={summaryOptions}
                />
            )}
        </>;
    }
}

interface ClusterNodeDetailProps {
    highlightNode?: string
    nodes: LineageNode[]
    nodesByType?: LineageNodeCollectionByType
    options?: LineageOptions
}

export class ClusterNodeDetail extends PureComponent<ClusterNodeDetailProps> {

    render() {
        const { highlightNode, nodes, options } = this.props;

        const nodesByType = this.props.nodesByType ?? createLineageNodeCollections(nodes, options);
        const groups = Object.keys(nodesByType).sort();

        let iconURL;
        let title;
        if (groups.length === 1) {
            title = nodes.length + ' ' + groups[0];
            iconURL = nodes[0].meta.iconURL;
        }
        else {
            title = nodes.length + ' items of different types';
            iconURL = 'default';
        }

        return (
            <>
                <NodeDetailHeader header={title} iconSrc={iconURL} />

                {groups.map(groupName =>
                    <LineageNodeList
                        key={groupName}
                        title={groupName}
                        nodes={nodesByType[groupName]}
                        highlightNode={highlightNode}
                    />
                )}
            </>
        );
    }
}
