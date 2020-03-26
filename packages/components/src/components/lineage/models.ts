/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map, Record } from 'immutable';
import { GridColumn, QueryInfo } from '../..';

import {
    DEFAULT_LINEAGE_DIRECTION,
    DEFAULT_LINEAGE_DISTANCE,
    DEFAULT_LINEAGE_OPTIONS,
} from './constants';
import {
    LineageGroupingOptions,
    LINEAGE_DIRECTIONS,
    LineageNodeLinks,
    LineageOptions,
} from './types'
import { generate, VisGraphOptions } from './vis/VisGraphGenerator';
import { LINEAGE_GRID_COLUMNS } from './Tag';

// TODO add jest test coverage for this function
function mergeNodes(aNodes: List<any>, bNodes: List<any>): List<any> {
    let newNodes = aNodes.asMutable();

    bNodes.forEach(node => {
        const lsid = node.get('lsid');
        const role = node.get('role');

        const N = newNodes.find(aN => (
            lsid === aN.get('lsid') &&
            role === aN.get('role')
        ));

        if (!N) {
            newNodes.push(node);
        }
    });

    return newNodes.asImmutable();
}


export class LineageNodeMetadata extends Record ({
    date: undefined,
    description: undefined,
    aliases: undefined,
    displayType: undefined,
    iconURL: undefined
}) {
    date?: string;
    description?: string;
    aliases?: List<string>;
    displayType?: string;
    iconURL?: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(selectRowsMetadata: Map<any, any>, queryInfo: QueryInfo) : LineageNodeMetadata {
        let description;
        if (selectRowsMetadata.hasIn(['Description', 'value']))
            description = selectRowsMetadata.getIn(['Description', 'value']);

        let created;
        if (selectRowsMetadata.hasIn(['Created', 'formattedValue']))
            created = selectRowsMetadata.getIn(['Created', 'formattedValue']);
        else if (selectRowsMetadata.hasIn(['Created', 'value']))
            created = selectRowsMetadata.getIn(['Created', 'value']);

        let aliases;
        if (selectRowsMetadata.has('Alias')) {
            aliases = selectRowsMetadata.get('Alias').map(alias => alias.get('displayValue'));
        }

        return new LineageNodeMetadata({
            displayType: queryInfo.queryLabel,
            iconURL: queryInfo.getIconURL(),
            description,
            date: created,
            aliases
        });
    }
}

export class LineageLink extends Record ({
    lsid: undefined
}) {
    lsid: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static createList(values?: Array<{ [key: string]: any }>): List<LineageLink> {
        const result = values ? values.map(v => new LineageLink(v)) : [];
        return List(result);
    }
}

export class LineageNode extends Record ({
    children: undefined,
    cpasType: undefined,
    distance: undefined,
    listURL: undefined,
    lsid: undefined,
    name: undefined,
    parents: undefined,
    queryName: undefined,
    rowId: undefined,
    schemaName: undefined,
    type: undefined,
    url: undefined,

    // computed properties
    links: {},
    meta: undefined,
} ) {
    children?: List<LineageLink>;
    cpasType?: string;
    distance?: number;
    listURL?: string;
    lsid?: string;
    name?: string;
    parents?: List<LineageLink>;
    queryName?: string;
    rowId?: number;
    schemaName?: string;
    type?: string;
    url?: string;

    // computed properties
    links?: LineageNodeLinks;
    meta?: LineageNodeMetadata;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(lsid, values?: { [key:string]: any }): LineageNode {
        return values ? new LineageNode({
            children:  LineageLink.createList(values.children),
            cpasType: values.cpasType,
            lsid,
            name:  values.name,
            parents: LineageLink.createList(values.parents),
            queryName: values.queryName,
            // "rowId" -> "id". See https://github.com/LabKey/platform/pull/1000
            rowId:values.id,
            schemaName: values.schemaName,
            type: values.type,
            url: values.url,
            meta: values.meta
        }) : new LineageNode({lsid});
    }
}

export class LineageResult extends Record({
    mergedIn: undefined,
    nodes: undefined,
    seed: undefined
}) {
    mergedIn: List<string>;
    nodes: Map<string, LineageNode>;
    seed: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(rawLineageResult: any): LineageResult {
        const seed = rawLineageResult.seed;

        let nodes = {};
        for (let key in rawLineageResult.nodes) {
            if (!rawLineageResult.nodes.hasOwnProperty(key))
                continue;

            let rawNode = rawLineageResult.nodes[key];
            nodes[key] = LineageNode.create(key, rawNode);
        }

        // make sure that mergedIn list of all nodes that have their lineage in the model includes the original seed node
        let mergedIn = seed ? List<string>([seed]) : List();

        return new LineageResult({
            seed,
            nodes: Map<string, LineageNode>(nodes),
            mergedIn
        });
    }

    filterIn(field: string, value: undefined | string | Array<string>): LineageResult {
        return LineageResult._filter(this, field, value, true);
    }

    filterOut(field: string, value: undefined | string | Array<string>): LineageResult {
        return LineageResult._filter(this, field, value, false);
    }

    mergeLineage(other: LineageResult): LineageResult {
        let newNodes = (this.nodes.map(node => {
            const otherNode = other.nodes.get(node.get('lsid'));

            if (otherNode) {
                return node.merge({
                    children: mergeNodes(node.get('children'), otherNode.get('children')),
                    parents: mergeNodes(node.get('parents'), otherNode.get('parents'))
                });
            }

            return node;
        }) as Map<string, any>).asMutable();

        other.nodes.forEach((otherNode, otherLsid: string) => {
            if (!this.nodes.get(otherLsid)) {
                newNodes.set(otherLsid, otherNode);
            }
        });

        return this.merge({
            mergedIn: this.mergedIn.push(other.seed),
            nodes: newNodes.asImmutable()
        }) as LineageResult;
    }

    /**
     * When 'filterIn' is true, keep nodes that match the filter field and value.  All other nodes are removed.
     *
     * When 'filterIn' is false, keep nodes that don't match the filter field and value.  All other nodes are removed.
     *
     * Edges to removed nodes will be copied to the source.
     */
    private static _filter(result: LineageResult, field: string, value: undefined | string | Array<string>, filterIn: boolean): LineageResult {
        if (field === undefined)
            throw new Error('field must not be undefined');

        let oldNodes = result.nodes;

        // filter out nodes that don't match the criteria
        let newNodes = oldNodes.reduce((m, node) => {
            const lsid = node.lsid;
            let matched = this._matches(node, field, value, filterIn);

            if (matched) {
                // walk the parents/children edges, adding any matching nodes
                return m.set(lsid, node.merge({
                    parents: LineageResult.prune(node, oldNodes, LINEAGE_DIRECTIONS.Parent, field, value, filterIn),
                    children: LineageResult.prune(node, oldNodes, LINEAGE_DIRECTIONS.Children, field, value, filterIn)
                }));
            }
            else {
                // don't include the current node
                return m;
            }

        }, Map().asMutable());

        return result.set('nodes', newNodes) as LineageResult;
    }

    /**
     * When 'filterIn' is true, returns true if the node[field] is equal to the value or any of the array item values.
     * When value is undefined, it is treated as a wildcard -- any value is allowed as long as the
     *
     * When 'filterIn' is false, returns true if the node[field] is not equal to the value or any of the array item values.
     * When value is undefined, the node must not have contain a value for the field.
     */
    private static _matches(node: LineageNode, field: string, value: undefined | string | Array<string>, filterIn: boolean): boolean {
        if (filterIn) {
            if (value === undefined) {
                // true if the field exists on node
                return node.has(field)
            }
            else if (Array.isArray(value)) {
                return (value.indexOf(node[field]) > -1)
            }
            else {
                return node[field] === value;
            }
        }
        else {
            if (value === undefined) {
                // true if the field does not exist on node
                return !node.has(field);
            }
            else if (Array.isArray(value)) {
                return (value.indexOf(node[field]) === -1)
            }
            else {
                return node[field] !== value;
            }
        }
    }

    private static prune(node: LineageNode, nodes: Map<string, LineageNode>,
                         dir: LINEAGE_DIRECTIONS, field: string, value: any, filterIn: boolean): List<{lsid: string, role: string}> {
        let newTree = [];
        const edges: List<LineageLink> = node.get(dir);
        let walked: {[key:string]: string} = {};

        edges.forEach(edge => {
            newTree = newTree.concat(LineageResult.pruneEdge(edge, nodes, dir, field, value, filterIn, walked));
        });

        return List(newTree);
    }

    private static pruneEdge(edge: LineageLink, nodes: Map<string, LineageNode>,
                             dir: LINEAGE_DIRECTIONS, field: string, value: any, filterIn: boolean, walked: {[key:string]: string}): Array<{lsid: string, role: string}> {
        let heritage = [];
        let lsid = edge.lsid;
        const toNode = nodes.get(lsid);
        const edges: List<LineageLink> = toNode.get(dir);

        let matched = this._matches(toNode, field, value, filterIn);
        if (!matched) {

            // don't walk the same edge set more than once
            if (walked[lsid]) {
                return heritage;
            }

            walked[lsid] = lsid;
            edges.forEach(edge => {
                let result = LineageResult.pruneEdge(edge, nodes, dir, field, value, filterIn, walked);
                if (result && result.length > 0) {
                    heritage = heritage.concat(result);
                }
            });
        }
        else {
            heritage.push(edge);
        }

        return heritage;
    }
}

export class Lineage extends Record({
    result: undefined,
    sampleStats: undefined,
    error: undefined
}) {
    result: LineageResult;
    sampleStats: any;
    error?: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    getSeed(): string {
        return this.result.seed;
    }

    filterResult(options?: LineageOptions): LineageResult {
        const { seed } = this.result;

        // TODO: Not really concerned with grouping here...
        const _options = Object.assign({}, DEFAULT_LINEAGE_OPTIONS, options);

        let nodes;
        if (_options.filters) {
            let result = this.result;
            _options.filters.forEach(filter => {
                if (_options.filterIn === true) {
                    result = result.filterIn(filter.field, filter.value);
                }
                else {
                    result = result.filterOut(filter.field, filter.value);
                }
            });
            nodes = result.nodes;
        }
        else {
            nodes = this.result.nodes;
        }

        let mergedIn = this.result.mergedIn;

        return new LineageResult({seed, nodes, mergedIn});
    }

    /**
     * Generate a graph of the lineage for use with vis.js.
     *
     * @remarks
     * First, the LabKey lineage is filtered according to the {@link LineageOptions.filters}
     * then the graph is translated into vis.js nodes and edges.  During translation, nodes
     * will be combined together according to {@link LineageGroupingOptions.combineSize} and recursion
     * will be stopped when {@link LineageGroupingOptions.generations} condition is met.
     */
    generateGraph(options?: LineageOptions): VisGraphOptions {
        const result = this.filterResult(options);
        return generate(result, options);
    }
}

export class LineageGridModel extends Record({
    columns: LINEAGE_GRID_COLUMNS,
    data: List<LineageNode>(),
    distance: DEFAULT_LINEAGE_DISTANCE,
    isError: false,
    isLoaded: false,
    isLoading: false,
    maxRows: 20,
    members: DEFAULT_LINEAGE_DIRECTION,
    message: undefined,
    nodeCounts: Map<string, number>(),
    pageNumber: 1,
    seedNode: undefined,
    totalRows: 0
}) {
    columns: List<string | GridColumn>;
    data: List<LineageNode>;
    distance: number;
    isError: boolean;
    isLoaded: boolean;
    isLoading: boolean;
    maxRows: number;
    members?: LINEAGE_DIRECTIONS;
    message?: string;
    nodeCounts: Map<string, number>;
    pageNumber: number;
    seedNode?: LineageNode;
    totalRows: number;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    getOffset(): number {
        return this.pageNumber > 1 ? (this.pageNumber - 1) * this.maxRows : 0;
    }

    getMaxRowIndex(): number {
        let max = this.pageNumber > 1 ? this.pageNumber * this.maxRows : this.maxRows;

        if (max > this.totalRows) {
            return this.totalRows;
        }

        return max;
    }

    getMinRowIndex(): number {
        return this.getOffset() + 1;
    }
}

export class LineagePageModel extends Record({
    distance: DEFAULT_LINEAGE_DISTANCE,
    grid: new LineageGridModel(),
    lastLocation: '',
    seeds: List<string>(),
    members: DEFAULT_LINEAGE_DIRECTION,
}) {
    distance: number;
    grid: LineageGridModel;
    lastLocation: string;
    seeds: List<string>;
    members: LINEAGE_DIRECTIONS;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

