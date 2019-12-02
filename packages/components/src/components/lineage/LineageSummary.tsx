/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'reactn'
import { Link } from 'react-router';
import { List } from 'immutable'

import { LineageFilter, LineageLink, LineageNode, LineageOptions, LineageResult } from './models';
import { DEFAULT_LINEAGE_DISTANCE, LINEAGE_DIRECTIONS } from './constants';
import { createLineageNodeCollections, getLineageNodeTitle, LineageNodeCollection } from './vis/VisGraphGenerator';
import { loadLineageIfNeeded } from './actions';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { SVGIcon } from '../base/SVGIcon';

interface Props {
    seed: string
    showRuns: boolean
    highlightNode?: string
    isNodeInGraph?: (node: LineageNode) => boolean
    onNodeMouseOver?: (node: LineageNode) => void
    onNodeMouseOut?: (node: LineageNode) => void
    onNodeClick?: (node: LineageNode) => void
}

export class LineageSummary extends React.Component<Props, any> {

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
        const { seed, showRuns } = this.props;

        // need to access this.global directly to connect this component to the re-render cycle
        const lineage = this.global.QueryGrid_lineageResults.get(seed);

        let options: LineageOptions;
        if (!showRuns) {
            options = new LineageOptions({
                filters: List<LineageFilter>([new LineageFilter('type', ['Sample', 'Data'])])
            });
        }

        return lineage ? lineage.filterResult(options) : undefined;
    }

    renderNodeList(direction, lineage, edges: List<LineageLink>, highlightNode) {
        if (this.empty(edges)) {
            return;
        }

        const nodes = edges.map(edge => lineage.nodes.get(edge.lsid)).toArray();

        const nodesByType = createLineageNodeCollections(nodes);
        const groups = Object.keys(nodesByType).sort();

        const title = direction === LINEAGE_DIRECTIONS.Parent ? "Parents" : "Children";

        return <>
            {groups.map(groupName =>
                <div key={groupName}>
                    <LineageNodeList
                        title={groupName + " " + title}
                        nodes={nodesByType[groupName]}
                        highlightNode={highlightNode}
                        isNodeInGraph={this.props.isNodeInGraph}
                        onNodeClick={this.props.onNodeClick}
                        onNodeMouseOver={this.props.onNodeMouseOver}
                        onNodeMouseOut={this.props.onNodeMouseOut}
                    />
                </div>
            )}
        </>;
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
        const parents: List<LineageLink> = node.get('parents');
        const children: List<LineageLink> = node.get('children');

        if (this.empty(parents) && this.empty(children)) {
            return <div>No lineage for {node.name}</div>
        }

        const hasBoth = !this.empty(parents) && !this.empty(children);

        return <>
            {this.renderNodeList(LINEAGE_DIRECTIONS.Parent, lineage, parents, highlightNode)}
            {hasBoth && <hr/>}
            {this.renderNodeList(LINEAGE_DIRECTIONS.Children, lineage, children, highlightNode)}
        </>;
    }
}


interface LineageNodeListProps {
    title: string
    highlightNode?: string
    listURL?: string
    nodes: LineageNodeCollection

    isNodeInGraph?: (node: LineageNode) => boolean
    onNodeMouseOver?: (node: LineageNode) => void
    onNodeMouseOut?: (node: LineageNode) => void
    onNodeClick?: (node: LineageNode) => void
}

interface LineageNodeListState {
    expanded: boolean
}

const COLLAPSED_LIST_SHOW_COUNT = 4;

// TODO move the inline styles to lineage.scss
export class LineageNodeList extends React.Component<LineageNodeListProps, LineageNodeListState> {

    constructor(props) {
        super(props);

        this.onCollapseClicked = this.onCollapseClicked.bind(this);
        this.onExpandClicked = this.onExpandClicked.bind(this);

        this.state = {
            expanded: false
        }
    }

    isNodeInGraph(node: LineageNode) {
        if (this.props.isNodeInGraph) {
            return this.props.isNodeInGraph(node);
        }
        return false;
    }

    onNodeMouseOver(node: LineageNode) {
        if (this.props.onNodeMouseOver) {
            this.props.onNodeMouseOver(node);
        }
    }

    onNodeMouseOut(node: LineageNode) {
        if (this.props.onNodeMouseOut) {
            this.props.onNodeMouseOut(node);
        }
    }

    onNodeClick(node: LineageNode) {
        if (this.props.onNodeClick) {
            this.props.onNodeClick(node);
        }
        return false;
    }

    onCollapseClicked() {
        this.setState({
            expanded: false
        });
    }

    onExpandClicked() {
        this.setState({
            expanded: true
        });
    }

    renderNode(node: LineageNode) {
        const { highlightNode } = this.props;

        const title = getLineageNodeTitle(node, false);

        const { name, meta, url } = node;
        const iconURL = meta.iconURL;
        const lineageUrl = url + '/lineage';

        const clickable = this.isNodeInGraph(node);

        return <li key={node.lsid} title={title}
                   className='lineage-name'
                   style={{fontWeight: highlightNode === node.lsid ? 'bold' : 'normal'}}>
            <SVGIcon iconDir={"_images"} iconSrc={iconURL}
                     style={{width:"1.2em", height:"1.2em", margin: "0.1em"}} />
            &nbsp;
            {clickable ?
                <a className='pointer'
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
        </li>;
    }

    renderCollapseExpandNode(skipCount) {
        const { expanded } = this.state;

        const callback = expanded ? this.onCollapseClicked : this.onExpandClicked;

        return <li key={'__skip'}>
            <SVGIcon iconDir={"_images"} iconSrc="default"
                     style={{width:"1.2em", height:"1.2em", margin: "0.1em", opacity: 0}} />
            &nbsp;
            <a style={{cursor:'pointer'}} onClick={callback}>Show {skipCount} {expanded ? "less" : "more"}...</a>
            &nbsp;
        </li>
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
            rendered = nodes.nodes.map(n  => this.renderNode(n));
        }

        return <details open={true}>
            <summary className='lineage-name'>
                <h6 style={{marginBottom:'0.3em'}}>{title} ({nodes.nodes.length})
                    &nbsp;{nodes.listURL && <Link className='show-on-hover' to={nodes.listURL}>View in grid</Link>}
                </h6>
            </summary>
            <ul style={{listStyleType: 'none', paddingLeft: '0', marginBottom: '1.5em'}}>
                {rendered}
            </ul>
        </details>;
    }

}
