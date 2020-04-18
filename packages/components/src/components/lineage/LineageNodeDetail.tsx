/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';
import ReactN from 'reactn';

import { Detail, getQueryGridModel, gridInit, LoadingSpinner, QueryGridModel, SVGIcon, Theme } from '../..';

import { createLineageNodeCollections, LineageNodeCollectionByType } from './vis/VisGraphGenerator';
import { LineageNodeList } from './LineageNodeList';
import { LineageSummary } from './LineageSummary';
import { LineageNode } from './models';
import { LineageOptions } from './types';
import { getIconAndShapeForNode } from './utils';

export interface SummaryOptions {
    showSummary?: boolean;
    summaryOptions?: LineageOptions;
}

interface SelectedNodeProps {
    entityModel?: QueryGridModel;
    highlightNode?: string;
    node: LineageNode;
    seed: string;
}

export class SelectedNodeDetail extends ReactN.Component<SelectedNodeProps & SummaryOptions> {
    static defaultProps = {
        showSummary: true,
    };

    componentDidMount() {
        this.loadEntity(this.props);
    }

    componentWillReceiveProps(nextProps: SelectedNodeProps) {
        this.loadEntity(nextProps);
    }

    loadEntity(props: SelectedNodeProps) {
        const { entityModel } = props;
        if (entityModel) {
            gridInit(entityModel, true, this);
        }
    }

    getQueryGridModel(): QueryGridModel {
        const { entityModel } = this.props;
        if (entityModel) {
            return getQueryGridModel(entityModel.getId());
        }
    }

    render() {
        const model = this.getQueryGridModel();
        if (!model || !model.isLoaded) {
            return <LoadingSpinner msg="Loading details..." />;
        }

        const { seed, node, highlightNode, showSummary, summaryOptions } = this.props;
        const { links, meta, name } = node;
        const lineageUrl = links.lineage;
        const isSeed = seed === node.lsid;

        const aliases = meta?.aliases;
        const description = meta?.description;
        const displayType = meta?.displayType;

        const header = (
            <>
                {(lineageUrl && !isSeed && <a href={lineageUrl}>{name}</a>) || name}
                <div className="pull-right">
                    <a className="lineage-data-link-left" href={node.links.overview}>
                        <span className="lineage-data-link--text">Overview</span>
                    </a>
                    {lineageUrl !== undefined && (
                        <a className="lineage-data-link-right" href={lineageUrl}>
                            <span className="lineage-data-link--text">Lineage</span>
                        </a>
                    )}
                </div>
            </>
        );

        return (
            <>
                <NodeDetailHeader header={header} iconSrc={getIconAndShapeForNode(node).iconURL}>
                    {displayType && <small>{displayType}</small>}
                    {aliases && (
                        <div>
                            <small>{aliases.join(', ')}</small>
                        </div>
                    )}
                    {description && <small title={description}>{description}</small>}
                </NodeDetailHeader>

                <Detail queryModel={model} />

                {showSummary && (
                    <LineageSummary seed={node.lsid} highlightNode={highlightNode} options={summaryOptions} />
                )}
            </>
        );
    }
}

interface ClusterNodeDetailProps {
    highlightNode?: string;
    nodes: LineageNode[];
    nodesByType: LineageNodeCollectionByType;
    options?: LineageOptions;
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
        } else {
            title = nodes.length + ' items of different types';
            iconURL = 'default';
        }

        return (
            <>
                <NodeDetailHeader header={title} iconSrc={iconURL} />

                {groups.map(groupName => (
                    <LineageNodeList
                        key={groupName}
                        title={groupName}
                        nodes={nodesByType[groupName]}
                        highlightNode={highlightNode}
                    />
                ))}
            </>
        );
    }
}

interface NodeDetailHeaderProps {
    header: ReactNode;
    iconSrc: string;
}

class NodeDetailHeader extends PureComponent<NodeDetailHeaderProps> {
    render() {
        const { children, header, iconSrc } = this.props;

        return (
            <div className="margin-bottom lineage-node-detail">
                <i className="component-detail--child--img">
                    <SVGIcon theme={Theme.ORANGE} iconSrc={iconSrc} height="50px" width="50px" />
                </i>
                <div className="text__truncate">
                    <div className="lineage-name">
                        <h4 className="no-margin-top lineage-name-data">{header}</h4>
                    </div>
                    {children}
                </div>
            </div>
        );
    }
}
