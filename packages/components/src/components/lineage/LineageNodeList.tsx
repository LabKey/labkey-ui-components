/*
 * Copyright (c) 2019-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';

import { SVGIcon } from '../..';

import { NodeInteractionConsumer, WithNodeInteraction } from './actions';
import { LineageNode } from './models';
import { getLineageNodeTitle, LineageNodeCollection } from './vis/VisGraphGenerator';

interface LineageNodeListProps {
    title: string;
    highlightNode?: string;
    listURL?: string;
    nodes: LineageNodeCollection;
}

interface LineageNodeListState {
    expanded: boolean;
}

const COLLAPSED_LIST_SHOW_COUNT = 4;

// TODO move the inline styles to lineage.scss
export class LineageNodeList extends PureComponent<LineageNodeListProps, LineageNodeListState> {
    constructor(props) {
        super(props);

        this.state = {
            expanded: false,
        };
    }

    toggle = (): void => {
        this.setState(state => ({
            expanded: !state.expanded,
        }));
    };

    renderNode = (node: LineageNode): ReactNode => {
        const { highlightNode } = this.props;

        const title = getLineageNodeTitle(node, false);

        const { links, name, meta } = node;
        const iconURL = meta.iconURL;

        return (
            <li
                className="lineage-name"
                key={node.lsid}
                style={{ fontWeight: highlightNode === node.lsid ? 'bold' : 'normal' }}
                title={title}
            >
                <SVGIcon className="lineage-sm-icon" iconSrc={iconURL} />
                &nbsp;
                <NodeInteractionConsumer>
                    {(context: WithNodeInteraction) => {
                        if (context.isNodeInGraph(node)) {
                            return (
                                <a
                                    className="pointer"
                                    onClick={e => context.onNodeClick(node)}
                                    onMouseOver={e => context.onNodeMouseOver(node)}
                                    onMouseOut={e => context.onNodeMouseOut(node)}
                                >
                                    {name}
                                </a>
                            );
                        }

                        return <span>{name}</span>;
                    }}
                </NodeInteractionConsumer>
                &nbsp;
                <a href={links.overview} className="show-on-hover lineage-data-link-left">
                    <span className="lineage-data-link--text">Overview</span>
                </a>
                {links.lineage !== undefined && (
                    <a href={links.lineage} className="show-on-hover lineage-data-link-right">
                        <span className="lineage-data-link--text">Lineage</span>
                    </a>
                )}
            </li>
        );
    };

    renderCollapseExpandNode(skipCount) {
        const { expanded } = this.state;

        return (
            <li key="__skip">
                <SVGIcon className="lineage-sm-icon" />
                &nbsp;
                <a style={{ cursor: 'pointer' }} onClick={this.toggle}>
                    Show {skipCount} {expanded ? 'less' : 'more'}...
                </a>
                &nbsp;
            </li>
        );
    }

    render() {
        const { title, nodes } = this.props;
        const { expanded } = this.state;

        let includeCollapseExpand = false;
        if (nodes.nodes.length > 10) includeCollapseExpand = true;

        let rendered;
        if (includeCollapseExpand) {
            const skipCount = nodes.nodes.length - COLLAPSED_LIST_SHOW_COUNT;

            rendered = nodes.nodes.slice(0, COLLAPSED_LIST_SHOW_COUNT).map(this.renderNode);
            rendered.push(this.renderCollapseExpandNode(skipCount));
            if (expanded) {
                rendered = rendered.concat(nodes.nodes.slice(COLLAPSED_LIST_SHOW_COUNT).map(this.renderNode));
            }
        } else {
            rendered = nodes.nodes.map(this.renderNode);
        }

        return (
            <details open={true}>
                <summary className="lineage-name">
                    <h6 style={{ marginBottom: '0.3em' }}>
                        {title} ({nodes.nodes.length}) &nbsp;
                        {nodes.listURL && (
                            <a className="show-on-hover" href={nodes.listURL}>
                                View in grid
                            </a>
                        )}
                    </h6>
                </summary>
                <ul style={{ listStyleType: 'none', paddingLeft: '0', marginBottom: '1.5em' }}>{rendered}</ul>
            </details>
        );
    }
}
