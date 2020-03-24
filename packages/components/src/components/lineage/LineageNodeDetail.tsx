/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent } from 'react';
import ReactN from 'reactn';
import { List } from 'immutable';
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
import { WithNodeInteraction } from './actions'
import { LineageFilter, LineageNode, LineageOptions } from './models';

interface SelectedNodeProps {
    entityModel?: QueryGridModel
    highlightNode?: string
    node: LineageNode
    seed: string
    showSummary?: boolean
    summaryLineageOptions?: LineageOptions
}

export class SelectedNodeDetail extends ReactN.Component<SelectedNodeProps & WithNodeInteraction> {

    static defaultProps = {
        showSummary: true,
        // TODO: Should likely calculate the summary listing based on the selected node's type
        summaryLineageOptions: new LineageOptions({
            filters: List<LineageFilter>([new LineageFilter('type', ['Sample', 'Data'])])
        })
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
        const model = this.getQueryGridModel();
        if (!model || !model.isLoaded) {
            return <LoadingSpinner msg="Loading details..."/>
        }

        const { seed, node, highlightNode, showSummary, summaryLineageOptions } = this.props;
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

        return <>
            <div className="margin-bottom lineage-node-detail" >
                <i className="component-detail--child--img">
                    <SVGIcon
                        iconDir={'_images'}
                        theme={Theme.ORANGE}
                        iconSrc={model.queryInfo.getIconURL()}
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

            <Detail queryModel={model} />

            {showSummary && (
                <LineageSummary
                    seed={node.lsid}
                    highlightNode={highlightNode}
                    isNodeInGraph={this.isNodeInGraph}
                    onNodeMouseOver={this.onNodeMouseOver}
                    onNodeMouseOut={this.onNodeMouseOut}
                    onNodeClick={this.onNodeClick}
                    options={summaryLineageOptions}
                />
            )}
        </>;
    }
}

interface ClusterNodeDetailProps {
    highlightNode?: string
    nodes: Array<LineageNode>
    nodesByType: {[key:string]: LineageNodeCollection}
}

export class ClusterNodeDetail extends PureComponent<ClusterNodeDetailProps & WithNodeInteraction> {

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
                        iconDir="_images"
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
