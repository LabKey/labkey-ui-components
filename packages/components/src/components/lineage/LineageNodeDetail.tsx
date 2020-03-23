/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import ReactN from 'reactn';
import { ActionURL } from '@labkey/api';
import {
    Detail,
    getQueryGridModel,
    gridInit,
    LoadingSpinner,
    QueryGridModel,
    SVGIcon,
    Theme,
} from '../..';

import { createLineageNodeCollections, LineageNodeCollection } from './vis/VisGraphGenerator';
import { LineageNodeList } from './LineageNodeList';
import { LineageSummary } from './LineageSummary';
import { LineageNode } from './models';

interface SelectedNodeProps {
    entityModel?: QueryGridModel
    hideLegacyLinks?: boolean
    highlightNode?: string
    node: LineageNode
    isNodeInGraph?: (node: LineageNode) => boolean
    onNodeMouseOver?: (node: LineageNode) => void
    onNodeMouseOut?: (node: LineageNode) => void
    onNodeClick?: (node: LineageNode) => void
    seed: string
    showLineageSummary?: boolean
}

// TODO: Refactor and share with ComponentDetailHOCImpl?
export class SelectedNodeDetail extends ReactN.Component<SelectedNodeProps> {

    static defaultProps = {
        showLineageSummary: true
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

    handleLinkClick = (evt: React.MouseEvent): boolean => {
        evt.stopPropagation();
        return false;
    };

    onNodeMouseOver = (node: LineageNode): void => {
        if (this.props.onNodeMouseOver) {
            this.props.onNodeMouseOver(node);
        }
    };

    onNodeMouseOut = (node: LineageNode): void => {
        if (this.props.onNodeMouseOut) {
            this.props.onNodeMouseOut(node);
        }
    };

    isNodeInGraph = (node: LineageNode): boolean => {
        if (this.props.isNodeInGraph) {
            return this.props.isNodeInGraph(node);
        }
        return false;
    };

    onNodeClick = (node: LineageNode): void => {
        if (this.props.onNodeClick) {
            this.props.onNodeClick(node);
        }
    };

    render() {
        const { seed, node, highlightNode, hideLegacyLinks, showLineageSummary } = this.props;
        const url = node.url;
        const lineageUrl = url + '/lineage';
        const name = node.name;
        const isSeed = seed === node.lsid;

        let description;
        let aliases;
        let displayType;
        if (node.meta) {
            description = node.meta.description;
            aliases = node.meta.aliases;
            displayType = node.meta.displayType;
        }

        const model = this.getQueryGridModel();
        if (!model || !model.isLoaded) {
            return <LoadingSpinner msg="Loading details..."/>
        }

        const queryInfo = model.queryInfo;
        let legacyRunLineageUrl;
        let legacyDetailsLineageUrl;
        const row = model.getRow();
        if (row && row.get('Run')) {
            const runId = row.get('Run').get('value');

            legacyRunLineageUrl = ActionURL.buildURL('experiment', 'showRunGraph.view', LABKEY.container.path, {
                rowId: runId,
            });

            // see DotGraph.TYPECODE_* constants
            const typePrefix =
                node.type === 'Sample' ? 'M' :
                    node.type === 'Data' ? 'D' : 'A';
            legacyDetailsLineageUrl = ActionURL.buildURL('experiment', 'showRunGraphDetail.view', LABKEY.container.path, {
                rowId: runId,
                detail: true,
                focus: typePrefix + node.rowId
            });
        }

        return <>
            <div className="margin-bottom lineage-node-detail" >
                <i className="component-detail--child--img">
                    <SVGIcon
                        iconDir={'_images'}
                        theme={Theme.ORANGE}
                        iconSrc={queryInfo.getIconURL()}
                        height="50px"
                        width="50px"/>
                </i>
                <div className="text__truncate">
                    <div className="lineage-name">
                        <h4 className="no-margin-top lineage-name-data">
                            {(lineageUrl && !isSeed) &&
                            <a href={lineageUrl} onClick={this.handleLinkClick}>{name}</a>
                            ||
                            name
                            }
                            <div className='pull-right'>
                                <a href={url}
                                   className='lineage-data-link-left'
                                   onClick={this.handleLinkClick}>
                                    <span className='lineage-data-link--text'>Overview</span>
                                </a>
                                <a href={lineageUrl} className='lineage-data-link-right'
                                   onClick={this.handleLinkClick}>
                                    <span className='lineage-data-link--text'>Lineage</span>
                                </a>
                            </div>
                        </h4>
                    </div>
                    {displayType && <small>{displayType}</small>}
                    {aliases && <div>
                        <small>
                            {aliases.join(', ')}
                        </small>
                    </div>}
                    {description && <small title={description}>{description}</small>}
                </div>
            </div>

            {!hideLegacyLinks && LABKEY.user && LABKEY.user.isAdmin && legacyRunLineageUrl && <div className="pull-right">
                <small title='(admin only) old school lineage graphs, opens in new window'><em>
                    Legacy:&nbsp;
                    <a target='_blank' href={legacyRunLineageUrl} onClick={this.handleLinkClick}>run</a>
                    &nbsp;|&nbsp;
                    <a target='_blank' href={legacyDetailsLineageUrl} onClick={this.handleLinkClick}>details</a>
                </em></small>
            </div>}

            <Detail queryModel={model} />

            {showLineageSummary && (
                <LineageSummary
                    seed={node.lsid}
                    showRuns={true}
                    highlightNode={highlightNode}
                    isNodeInGraph={this.isNodeInGraph}
                    onNodeMouseOver={this.onNodeMouseOver}
                    onNodeMouseOut={this.onNodeMouseOut}
                    onNodeClick={this.onNodeClick}
                />
            )}

        </>;
    }
}

interface ClusterNodeDetailProps {
    highlightNode?: string
    isNodeInGraph?: (node: LineageNode) => boolean
    nodes: Array<LineageNode>
    nodesByType: {[key:string]: LineageNodeCollection}
    onNodeMouseOver?: (node: LineageNode) => void
    onNodeMouseOut?: (node: LineageNode) => void
    onNodeClick?: (node: LineageNode) => void
}

export class ClusterNodeDetail extends React.PureComponent<ClusterNodeDetailProps> {

    onNodeMouseOver = (node: LineageNode): void => {
        if (this.props.onNodeMouseOver) {
            this.props.onNodeMouseOver(node);
        }
    };

    onNodeMouseOut = (node: LineageNode): void => {
        if (this.props.onNodeMouseOut) {
            this.props.onNodeMouseOut(node);
        }
    };

    isNodeInGraph = (node: LineageNode): boolean => {
        if (this.props.isNodeInGraph) {
            return this.props.isNodeInGraph(node);
        }
        return false;
    };

    onNodeClick = (node: LineageNode): void => {
        if (this.props.onNodeClick) {
            this.props.onNodeClick(node);
        }
    };

    render() {
        const { nodes, highlightNode } = this.props;

        let nodesByType: {[key:string]: LineageNodeCollection};
        if (this.props.nodesByType) {
            nodesByType = this.props.nodesByType;
        }
        else {
            nodesByType = createLineageNodeCollections(nodes);
        }

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

        return <>
            <div className="margin-bottom lineage-node-detail">
                <i className="component-detail--child--img">
                    <SVGIcon
                        iconDir={'_images'}
                        theme={Theme.ORANGE}
                        iconSrc={iconURL}
                        height="50px"
                        width="50px"/>
                </i>
                <div className="text__truncate">
                    <div className="lineage-name">
                        <h4 className="no-margin-top lineage-name-data">
                            {title}
                        </h4>
                    </div>
                </div>
            </div>

            {groups.map(groupName =>
                <LineageNodeList
                    key={groupName}
                    title={groupName}
                    nodes={nodesByType[groupName]}
                    onNodeClick={this.onNodeClick}
                    onNodeMouseOut={this.onNodeMouseOut}
                    onNodeMouseOver={this.onNodeMouseOver}
                    isNodeInGraph={this.isNodeInGraph}
                    highlightNode={highlightNode}
                />
            )}
        </>;
    }
}
