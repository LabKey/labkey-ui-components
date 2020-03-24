/*
 * Copyright (c) 2019-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent } from 'react';
import { Link } from 'react-router';
import { SVGIcon } from '../..';

import { WithNodeInteraction } from './actions';
import { LineageNode } from './models';
import { getLineageNodeTitle, LineageNodeCollection } from './vis/VisGraphGenerator';

interface LineageNodeListProps {
    title: string
    highlightNode?: string
    listURL?: string
    nodes: LineageNodeCollection
}

interface LineageNodeListState {
    expanded: boolean
}

const COLLAPSED_LIST_SHOW_COUNT = 4;

// TODO move the inline styles to lineage.scss
export class LineageNodeList extends PureComponent<LineageNodeListProps & WithNodeInteraction, LineageNodeListState> {

    constructor(props) {
        super(props);

        this.state = {
            expanded: false
        }
    }

    isNodeInGraph = (node: LineageNode): boolean => {
        if (this.props.isNodeInGraph) {
            return this.props.isNodeInGraph(node);
        }
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

    onNodeClick = (node: LineageNode): boolean => {
        if (this.props.onNodeClick) {
            this.props.onNodeClick(node);
        }
        return false;
    };

    onCollapseClicked = (): void => {
        this.setState({
            expanded: false
        });
    };

    onExpandClicked = (): void => {
        this.setState({
            expanded: true
        });
    };

    renderNode(node: LineageNode) {
        const { highlightNode } = this.props;

        const title = getLineageNodeTitle(node, false);

        const { name, meta, url } = node;
        const iconURL = meta.iconURL;
        const lineageUrl = url + '/lineage';

        const clickable = this.isNodeInGraph(node);

        return (
            <li
                className="lineage-name"
                key={node.lsid}
                style={{fontWeight: highlightNode === node.lsid ? 'bold' : 'normal'}}
                title={title}
            >
                <SVGIcon iconDir={"_images"} iconSrc={iconURL}
                         style={{width:"1.2em", height:"1.2em", margin: "0.1em"}} />
                &nbsp;
                {clickable ?
                    <a className="pointer"
                       onMouseOver={e => this.onNodeMouseOver(node)}
                       onMouseOut={e => this.onNodeMouseOut(node)}
                       onClick={e => this.onNodeClick(node)}>{name}</a> :
                    <span>{name}</span>
                }
                &nbsp;
                <a href={url}
                   className='show-on-hover' style={{paddingLeft: '1px', paddingRight: '1px'}}>
                    <small style={{lineHeight: 1, color: '#777', fontSize: '75%'}}>Overview</small>
                </a>
                <a href={lineageUrl}
                   className='show-on-hover' style={{paddingLeft: '5px', paddingRight: '5px'}}>
                    <small style={{lineHeight: 1, color: '#777', fontSize: '75%'}}>Lineage</small>
                </a>
            </li>
        );
    }

    renderCollapseExpandNode(skipCount) {
        const { expanded } = this.state;

        const callback = expanded ? this.onCollapseClicked : this.onExpandClicked;

        return (
            <li key={'__skip'}>
                <SVGIcon iconDir={"_images"} iconSrc="default"
                         style={{width:"1.2em", height:"1.2em", margin: "0.1em", opacity: 0}} />
                &nbsp;
                <a style={{cursor:'pointer'}} onClick={callback}>Show {skipCount} {expanded ? "less" : "more"}...</a>
                &nbsp;
            </li>
        );
    }

    render() {
        const { title, nodes } = this.props;
        const { expanded } = this.state;

        let includeCollapseExpand = false;
        if (nodes.nodes.length > 10)
            includeCollapseExpand = true;

        let rendered;
        if (includeCollapseExpand) {
            const skipCount = nodes.nodes.length - COLLAPSED_LIST_SHOW_COUNT;

            rendered = nodes.nodes.slice(0, COLLAPSED_LIST_SHOW_COUNT).map(n  => this.renderNode(n));
            rendered.push(this.renderCollapseExpandNode(skipCount));
            if (expanded) {
                rendered = rendered.concat(nodes.nodes.slice(COLLAPSED_LIST_SHOW_COUNT).map(n  => this.renderNode(n)));
            }
        }
        else {
            rendered = nodes.nodes.map(n => this.renderNode(n));
        }

        return (
            <details open={true}>
                <summary className='lineage-name'>
                    <h6 style={{marginBottom:'0.3em'}}>{title} ({nodes.nodes.length})
                        &nbsp;{nodes.listURL && <Link className='show-on-hover' to={nodes.listURL}>View in grid</Link>}
                    </h6>
                </summary>
                <ul style={{listStyleType: 'none', paddingLeft: '0', marginBottom: '1.5em'}}>
                    {rendered}
                </ul>
            </details>
        );
    }
}
