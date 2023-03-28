/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Draft, immerable, produce } from 'immer';
import { List, Map, Record as ImmutableRecord } from 'immutable';
import { Experiment, Utils } from '@labkey/api';
import { DataSet, Edge, IdType, Node } from 'vis-network';

import { QueryInfo } from '../../../public/QueryInfo';

import { LoadingState } from '../../../public/LoadingState';

import { GridColumn } from '../base/models/GridColumn';

import {
    DEFAULT_GROUPING_OPTIONS,
    DEFAULT_LINEAGE_DIRECTION,
    DEFAULT_LINEAGE_DISTANCE,
    DEFAULT_LINEAGE_OPTIONS,
    LINEAGE_GRID_COLUMNS,
} from './constants';
import { getURLResolver } from './LineageURLResolvers';
import {
    LINEAGE_DIRECTIONS,
    LineageLinkMetadata,
    LineageOptions,
    LineageIconMetadata,
    LineageFilter,
    LINEAGE_GROUPING_GENERATIONS,
} from './types';

export function getLineageNodeTitle(node: LineageItemWithMetadata, asHTML = false): string {
    // encodeHtml if we are generating html for vis.js to use as the node's tooltip title
    const h = (s: string): string => (asHTML ? Utils.encodeHtml(s) : s);

    let title = '';

    if (node instanceof LineageNode) {
        const { meta } = node;
        if (meta && meta.displayType) {
            title += h(meta.displayType) + ': ';
        }

        title += node.name;

        if (meta && meta.aliases && meta.aliases.size) {
            title += ' (' + meta.aliases.map(h).join(', ') + ')';
        }

        if (meta && meta.description) {
            title += (asHTML ? '<br>' : '\n') + h(meta.description);
        }
    } else {
        title = node.name;
    }

    return title;
}

export function applyLineageOptions(options?: LineageOptions): LineageOptions {
    const _options = {
        ...DEFAULT_LINEAGE_OPTIONS,
        ...options,
        ...{
            grouping: {
                ...DEFAULT_GROUPING_OPTIONS,
                ...options?.grouping,
            },
        },
    };

    // deep copy "filters"
    _options.filters = _options.filters.map(filter => new LineageFilter(filter.field, filter.value));

    return _options;
}

export class LineageNodeMetadata extends ImmutableRecord({
    date: undefined,
    description: undefined,
    aliases: undefined,
    displayType: undefined,
}) {
    declare date?: string;
    declare description?: string;
    declare aliases?: List<string>;
    declare displayType?: string;

    static create(selectRowsMetadata: Map<any, any>, queryInfo: QueryInfo): LineageNodeMetadata {
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
            description,
            date: created,
            aliases,
        });
    }
}

export class LineageLink extends ImmutableRecord({
    lsid: undefined,
}) {
    declare lsid: string;

    static createList(values?: any): List<LineageLink> {
        const result = values ? values.map(v => new LineageLink(v)) : [];
        return List(result);
    }
}

export interface LineageItemWithMetadata extends Experiment.LineageItemBase {
    iconProps: LineageIconMetadata;
    links: LineageLinkMetadata;
}

export interface ProvenanceMap {
    from: Experiment.LineageItemBase;
    to: Experiment.LineageItemBase;
}

interface LineageIOConfig extends Experiment.LineageIOConfig {
    objectInputs?: Experiment.LineageItemBase[];
    objectOutputs?: Experiment.LineageItemBase[];
    provenanceMap?: ProvenanceMap[];
}

export interface LineageIOWithMetadata extends LineageIOConfig {
    dataInputs?: LineageItemWithMetadata[];
    dataOutputs?: LineageItemWithMetadata[];
    materialInputs?: LineageItemWithMetadata[];
    materialOutputs?: LineageItemWithMetadata[];
    objectInputs?: LineageItemWithMetadata[];
    objectOutputs?: LineageItemWithMetadata[];
}

export interface LineageItemWithIOMetadata extends LineageItemWithMetadata, LineageIOWithMetadata {}

export interface LineageRunStepConfig extends Experiment.LineageRunStepBase, LineageItemWithIOMetadata {}

export class LineageRunStep implements LineageRunStepConfig {
    [immerable] = true;

    readonly applicationType: string;
    readonly activityDate: string;
    readonly activitySequence: number;
    readonly container: string;
    readonly created: string;
    readonly createdBy: string;
    readonly dataInputs: LineageIO[];
    readonly dataOutputs: LineageIO[];
    readonly expType: string;
    readonly iconProps: LineageIconMetadata;
    readonly id: number;
    readonly links: LineageLinkMetadata;
    readonly lsid: string;
    readonly materialInputs: LineageIO[];
    readonly materialOutputs: LineageIO[];
    readonly modified: string;
    readonly modifiedBy: string;
    readonly name: string;
    readonly objectInputs: LineageIO[];
    readonly objectOutputs: LineageIO[];
    readonly pkFilters: Experiment.LineagePKFilter[];
    readonly protocol: Experiment.LineageItemBase;
    readonly queryName: string;
    readonly schemaName: string;

    constructor(values?: LineageRunStepConfig) {
        Object.assign(this, values, {
            ...LineageIO.applyConfig(values),
        });
    }
}

export class LineageIO implements LineageItemWithMetadata {
    [immerable] = true;

    readonly container: string;
    readonly created: string;
    readonly createdBy: string;
    readonly expType: string;
    readonly iconProps: LineageIconMetadata;
    readonly id: number;
    readonly lsid: string;
    readonly links: LineageLinkMetadata;
    readonly modified: string;
    readonly modifiedBy: string;
    readonly name: string;
    readonly pkFilters: Experiment.LineagePKFilter[];
    readonly queryName: string;
    readonly schemaName: string;

    constructor(values?: Partial<LineageIO>) {
        Object.assign(this, values);
    }

    static applyConfig(values?: LineageIOConfig): LineageIOConfig {
        return {
            dataInputs: LineageIO.fromArray(values?.dataInputs),
            dataOutputs: LineageIO.fromArray(values?.dataOutputs),
            materialInputs: LineageIO.fromArray(values?.materialInputs),
            materialOutputs: LineageIO.fromArray(values?.materialOutputs),
            // convert the provenanceMap to the inputs and outputs array, filter for just those that have a from/to lsid value
            objectInputs: LineageIO.fromArray(
                values?.provenanceMap?.map(prov => prov.from).filter(input => input?.lsid)
            ),
            objectOutputs: LineageIO.fromArray(
                values?.provenanceMap?.map(prov => prov.to).filter(input => input?.lsid)
            ),
        };
    }

    static fromArray(values?: any[]): LineageIO[] {
        if (Utils.isArray(values)) {
            return (values as any[]).map(io => new LineageIO(io));
        }

        return [];
    }
}

interface LineageNodeConfig
    extends Omit<Experiment.LineageNodeBase, 'children' | 'parents' | 'steps'>,
        LineageItemWithIOMetadata {
    children: List<LineageLink>;
    // computed properties
    distance: number;
    listURL: string;

    meta: LineageNodeMetadata;
    parents: List<LineageLink>;
    steps: List<LineageRunStep>;
}

export class LineageNode
    extends ImmutableRecord({
        absolutePath: undefined,
        children: undefined,
        container: undefined,
        cpasType: undefined,
        created: undefined,
        createdBy: undefined,
        dataFileURL: undefined,
        dataInputs: undefined,
        dataOutputs: undefined,
        expType: undefined,
        id: undefined,
        lsid: undefined,
        materialInputs: undefined,
        materialOutputs: undefined,
        modified: undefined,
        modifiedBy: undefined,
        name: undefined,
        objectInputs: undefined,
        objectOutputs: undefined,
        parents: undefined,
        pipelinePath: undefined,
        pkFilters: undefined,
        properties: undefined,
        queryName: undefined,
        schemaName: undefined,
        steps: undefined,
        type: undefined,
        materialLineageType: undefined,
        url: undefined,

        // computed properties
        distance: undefined,
        iconProps: {},
        links: {},
        listURL: undefined,
        meta: undefined,
    })
    implements LineageNodeConfig
{
    declare absolutePath: string;
    declare children: List<LineageLink>;
    declare container: string;
    declare cpasType: string;
    declare created: string;
    declare createdBy: string;
    declare dataFileURL: string;
    declare dataInputs: LineageIO[];
    declare dataOutputs: LineageIO[];
    declare expType: string;
    declare id: number;
    declare lsid: string;
    declare materialInputs: LineageIO[];
    declare materialOutputs: LineageIO[];
    declare modified: string;
    declare modifiedBy: string;
    declare name: string;
    declare objectInputs: LineageIO[];
    declare objectOutputs: LineageIO[];
    declare parents: List<LineageLink>;
    declare pipelinePath: string;
    declare pkFilters: Experiment.LineagePKFilter[];
    declare properties: any;
    declare queryName: string;
    declare schemaName: string;
    declare steps: List<LineageRunStep>;
    declare type: string;
    declare materialLineageType: string;
    declare url: string;

    // computed properties
    distance: number;
    iconProps: LineageIconMetadata;
    links: LineageLinkMetadata;
    listURL: string;
    meta: LineageNodeMetadata;

    static create(lsid: string, values?: Partial<LineageNodeConfig>): LineageNode {
        let config: any;

        if (values && values instanceof LineageNode) {
            config = values;
        } else {
            config = {
                ...values,
                ...LineageIO.applyConfig(values as LineageNodeConfig),
                ...{
                    children: LineageLink.createList(values.children),
                    lsid,
                    parents: LineageLink.createList(values.parents),
                    steps: List(values.steps?.map(stepProps => new LineageRunStep(stepProps))),
                },
            };
        }

        return new LineageNode(config);
    }

    get isRun(): boolean {
        return this.expType === 'ExperimentRun';
    }
}

export class LineageResult extends ImmutableRecord({
    mergedIn: undefined,
    nodes: undefined,
    seed: undefined,
}) {
    declare mergedIn: List<string>;
    declare nodes: Map<string, LineageNode>;
    declare seed: string;

    static create(rawLineageResult: any): LineageResult {
        const seed = rawLineageResult.seed;

        const nodes = {};
        for (const key in rawLineageResult.nodes) {
            if (!rawLineageResult.nodes.hasOwnProperty(key)) continue;

            const rawNode = rawLineageResult.nodes[key];
            nodes[key] = LineageNode.create(key, rawNode);
        }

        // make sure that mergedIn list of all nodes that have their lineage in the model includes the original seed node
        const mergedIn = seed ? List<string>([seed]) : List();

        return new LineageResult({
            seed,
            nodes: Map<string, LineageNode>(nodes),
            mergedIn,
        });
    }

    filterIn(field: string, value: undefined | string | string[]): LineageResult {
        return LineageResult._filter(this, field, value, true);
    }

    filterOut(field: string, value: undefined | string | string[]): LineageResult {
        return LineageResult._filter(this, field, value, false);
    }

    /**
     * When 'filterIn' is true, keep nodes that match the filter field and value.  All other nodes are removed.
     *
     * When 'filterIn' is false, keep nodes that don't match the filter field and value.  All other nodes are removed.
     *
     * Edges to removed nodes will be copied to the source.
     */
    private static _filter(
        result: LineageResult,
        field: string,
        value: undefined | string | string[],
        filterIn: boolean
    ): LineageResult {
        if (field === undefined) throw new Error('field must not be undefined');

        const oldNodes = result.nodes;

        // filter out nodes that don't match the criteria
        const newNodes = oldNodes.reduce((m, node) => {
            const lsid = node.lsid;
            const matched = this._matches(node, field, value, filterIn);

            if (matched) {
                // walk the parents/children edges, adding any matching nodes
                return m.set(
                    lsid,
                    node.merge({
                        parents: LineageResult.prune(node, oldNodes, LINEAGE_DIRECTIONS.Parent, field, value, filterIn),
                        children: LineageResult.prune(
                            node,
                            oldNodes,
                            LINEAGE_DIRECTIONS.Children,
                            field,
                            value,
                            filterIn
                        ),
                    })
                );
            } else {
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
    private static _matches(
        node: LineageNode,
        field: string,
        value: undefined | string | string[],
        filterIn: boolean
    ): boolean {
        if (filterIn) {
            if (value === undefined) {
                // true if the field exists on node
                return node.has(field);
            } else if (Array.isArray(value)) {
                return value.indexOf(node[field]) > -1;
            } else {
                return node[field] === value;
            }
        } else {
            if (value === undefined) {
                // true if the field does not exist on node
                return !node.has(field);
            } else if (Array.isArray(value)) {
                return value.indexOf(node[field]) === -1;
            } else {
                return node[field] !== value;
            }
        }
    }

    private static prune(
        node: LineageNode,
        nodes: Map<string, LineageNode>,
        dir: LINEAGE_DIRECTIONS,
        field: string,
        value: any,
        filterIn: boolean
    ): List<{ lsid: string; role: string }> {
        let newTree = [];
        const edges: List<LineageLink> = node.get(dir);
        const walked: { [key: string]: string } = {};

        edges.forEach(edge => {
            newTree = newTree.concat(LineageResult.pruneEdge(edge, nodes, dir, field, value, filterIn, walked));
        });

        return List(newTree);
    }

    private static pruneEdge(
        edge: LineageLink,
        nodes: Map<string, LineageNode>,
        dir: LINEAGE_DIRECTIONS,
        field: string,
        value: any,
        filterIn: boolean,
        walked: { [key: string]: string }
    ): Array<{ lsid: string; role: string }> {
        let heritage = [];
        const lsid = edge.lsid;
        const toNode = nodes.get(lsid);
        const edges: List<LineageLink> = toNode.get(dir);

        const matched = this._matches(toNode, field, value, filterIn);
        if (!matched) {
            // don't walk the same edge set more than once
            if (walked[lsid]) {
                return heritage;
            }

            walked[lsid] = lsid;
            edges.forEach(edge => {
                const result = LineageResult.pruneEdge(edge, nodes, dir, field, value, filterIn, walked);
                if (result && result.length > 0) {
                    heritage = heritage.concat(result);
                }
            });
        } else {
            heritage.push(edge);
        }

        return heritage;
    }
}

export class Lineage {
    [immerable] = true;

    readonly error?: string;
    readonly result: LineageResult;
    readonly resultLoadingState: LoadingState = LoadingState.INITIALIZED;
    readonly sampleStats: List<Map<string, any>>;
    readonly seed: string;
    readonly seedResult: LineageResult;
    readonly seedResultError?: string;
    readonly seedResultLoadingState: LoadingState = LoadingState.INITIALIZED;

    constructor(values?: Partial<Lineage>) {
        Object.assign(this, values);
    }

    // Defensive check against calls made when an error is present and provides a more useful error message.
    private checkError(): void {
        if (this.error) {
            throw new Error(
                'Invalid call on Lineage object. Check errors prior to attempting to interact with Lineage object.'
            );
        }
    }

    filterResult(options?: LineageOptions): LineageResult {
        this.checkError();
        const { seed } = this.result;

        const _options = applyLineageOptions(options);

        let nodes;
        if (_options.filters) {
            let result = this.result;
            _options.filters.forEach(filter => {
                if (_options.filterIn === true) {
                    result = result.filterIn(filter.field, filter.value);
                } else {
                    result = result.filterOut(filter.field, filter.value);
                }
            });
            nodes = result.nodes;
        } else {
            nodes = this.result.nodes;
        }

        const mergedIn = this.result.mergedIn;

        return new LineageResult({ seed, nodes, mergedIn });
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
        this.checkError();

        if (this.isLoaded()) {
            return generate(this.filterResult(options), options);
        }

        return undefined;
    }

    isLoaded(): boolean {
        return this.resultLoadingState === LoadingState.LOADED;
    }

    isSeedLoaded(): boolean {
        return !this.seedResultError && this.seedResultLoadingState === LoadingState.LOADED;
    }

    /**
     * Returns a deep copy of this model with props applied iff props is not empty/null/undefined else
     * returns this.
     * @param props
     */
    mutate(props: Partial<Lineage>): Lineage {
        return produce(this, (draft: Draft<Lineage>) => {
            Object.assign(draft, props);
        });
    }
}

export class LineageGridModel {
    [immerable] = true;

    readonly columns: List<string | GridColumn> = LINEAGE_GRID_COLUMNS;
    readonly data: List<LineageNode> = List();
    readonly distance: number = DEFAULT_LINEAGE_DISTANCE;
    readonly isError: boolean = false;
    readonly isLoaded: boolean = false;
    readonly isLoading: boolean = false;
    readonly maxRows: number = 20;
    readonly members: LINEAGE_DIRECTIONS = DEFAULT_LINEAGE_DIRECTION;
    readonly message: string;
    readonly nodeCounts: Map<string, number> = Map();
    readonly pageNumber: number = 1;
    readonly seedNode: LineageNode;
    readonly totalRows: number = 0;

    constructor(config?: Partial<LineageGridModel>) {
        Object.assign(this, { ...config });
    }

    get offset(): number {
        return this.pageNumber > 1 ? (this.pageNumber - 1) * this.maxRows : 0;
    }

    get maxRowIndex(): number {
        const max = this.pageNumber > 1 ? this.pageNumber * this.maxRows : this.maxRows;

        if (max > this.totalRows) {
            return this.totalRows;
        }

        return max;
    }

    get minRowIndex(): number {
        return this.offset + 1;
    }
}

// extend Node to include the LabKey lineage node and the cluster id
export interface VisGraphNode extends Node {
    id: string;
    kind: 'node';
    lineageNode: LineageNode;
}

export interface VisGraphCombinedNode extends Node {
    containedNodes: LineageNode[];
    containedNodesByType: LineageNodeCollectionByType;
    id: string;
    kind: 'combined';
    parentNodeName?: string;
}

// vis.js doesn't expose cluster nodes directly, so this is our shim
interface VisGraphClusterNode {
    id: string | number;
    kind: 'cluster';
    nodesInCluster: VisGraphNodeType[];
}

export type VisGraphNodeType = VisGraphNode | VisGraphCombinedNode | VisGraphClusterNode;

export function isBasicNode(item: VisGraphNodeType): item is VisGraphNode {
    return item && item.kind === 'node';
}

export function isCombinedNode(item: VisGraphNodeType): item is VisGraphCombinedNode {
    return item && item.kind === 'combined';
}

export function isClusterNode(item: VisGraphNodeType): item is VisGraphClusterNode {
    return item && item.kind === 'cluster';
}

interface IVisGraphOptions {
    edges: DataSet<Edge>;
    initialSelection: string[];
    nodes: DataSet<VisGraphNode | VisGraphCombinedNode>;
    options: Record<string, any>;
}

export class VisGraphOptions implements IVisGraphOptions {
    [immerable] = true;

    readonly edges: DataSet<Edge>;
    readonly initialSelection: string[];
    readonly nodes: DataSet<VisGraphNode | VisGraphCombinedNode>;
    readonly options: Record<string, any>;

    constructor(config?: Partial<IVisGraphOptions>) {
        Object.assign(this, config);
    }

    getCombinedNodes(): VisGraphCombinedNode[] {
        return this.nodes.get({ filter: isCombinedNode }) as VisGraphCombinedNode[];
    }
}

const EDGE_ID_SEPARATOR = '||';

function makeEdgeId(fromId: IdType, toId: IdType): string {
    return fromId + EDGE_ID_SEPARATOR + toId;
}

type EdgeMap = Record<string, Edge>;
type LineageNodeMap = Record<string, LineageNode>;
type VisNodeMap = Record<string, VisGraphNode | VisGraphCombinedNode>;

/**
 * Create an edge between fromId -> toId when dir === Child.
 * Create an edge between fromId <- toId when dir === Parent.
 */
function addEdge(visEdges: EdgeMap, dir: LINEAGE_DIRECTIONS, fromId: IdType, toId: IdType): void {
    const edgeId = dir === LINEAGE_DIRECTIONS.Children ? makeEdgeId(fromId, toId) : makeEdgeId(toId, fromId);
    if (visEdges[edgeId] === undefined) {
        // console.log("  ".repeat(depth) + "creating new edge: " + fromId + (dir === LINEAGE_DIRECTIONS.Children ? " -> " : " <- ") + toId);
        visEdges[edgeId] = {
            id: edgeId,
            from: dir === LINEAGE_DIRECTIONS.Children ? fromId : toId,
            to: dir === LINEAGE_DIRECTIONS.Children ? toId : fromId,
        };
    } else {
        // console.log("  ".repeat(depth) + "edge already exists: " + fromId + (dir === LINEAGE_DIRECTIONS.Children ? " -> " : " <- ") + toId);
    }
}

function addEdges(
    lsid: string,
    targetId: string | undefined,
    visEdges: EdgeMap,
    edges: List<LineageLink>,
    nodesInCombinedNode: { [key: string]: string[] },
    dir: LINEAGE_DIRECTIONS
): void {
    // if current node is in a combined node, use the combined node's id as the edge source
    let nodeIds = nodesInCombinedNode[lsid];
    if (nodeIds === undefined) {
        nodeIds = [lsid];
    }

    for (let i = 0; i < nodeIds.length; i++) {
        const nodeId = nodeIds[i];

        // create an edge from the current lsid (or a combined node it lives in) to the edge's target
        edges.forEach(e => {
            // Create an edge to the supplied target node or the edge target
            // or to any combined node the target belongs to.
            let edgesToMake = targetId ? [targetId] : [e.lsid];
            const existingCombinedNodes = nodesInCombinedNode[e.lsid];
            if (existingCombinedNodes !== undefined) {
                edgesToMake = existingCombinedNodes;
            }

            edgesToMake.forEach(targetId_ => {
                // console.log("  ".repeat(depth) + "creating new edge: " + nodeId + " -> " + targetId_);
                addEdge(visEdges, dir, nodeId, targetId_);
            });
        });
    }
}

function createVisNode(node: LineageNode, id: string, isSeed: boolean): VisGraphNode {
    // show the alternate icon image color if this node is the seed or has been selected
    const { image, imageBackup, imageSelected, imageShape } = node.iconProps;

    return {
        kind: 'node',
        id,
        lineageNode: node,
        label: node.name,
        title: getLineageNodeTitle(node, true),
        image: {
            unselected: image,
            selected: imageSelected,
        },
        brokenImage: imageBackup,
        shape: imageShape,
        shadow: isSeed === true,
        font: isSeed
            ? {
                  multi: 'html',
                  color: '#116596', // this is the color of the fill from the _v1.svg images used as seed node images
                  align: 'left',
                  background: 'white',
                  // for the seed node the multi line label uses <b> on the second line, this seed node font object
                  // override of font.bold cause the label to render the second line text bigger than first line text
                  // Note: this override for <b> font only work if the options nodes object does not set the 'value'
                  // property or attempt to override default scaling behaviour.
                  bold: {
                      size: 18,
                  },
              }
            : {
                  align: 'left',
                  background: 'white',
              },
    };
}

// https://stackoverflow.com/a/13403498/351483
// generate a random id like "ahl3dhtcxchvqbwyga2nhg"
function randId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export type LineageNodeCollectionByType = Record<string, LineageNodeCollection>;

// group the array of nodes into collections by type
export function createLineageNodeCollections(
    nodes: LineageNode[],
    options?: LineageOptions
): LineageNodeCollectionByType {
    const nodesByType: LineageNodeCollectionByType = {};

    nodes
        .filter(n => n.meta)
        .forEach(n => {
            const { displayType } = n.meta;
            const { materialLineageType } = n;
            const displayTypeGroup = displayType + (materialLineageType ? '-' + materialLineageType : '');
            let byTypeList = nodesByType[displayTypeGroup];
            if (!byTypeList) {
                byTypeList = {
                    displayType,
                    queryName: n.queryName,
                    cpasType: n.cpasType,
                    listURL: undefined,
                    materialLineageType,
                    nodes: [],
                };
                nodesByType[displayTypeGroup] = byTypeList;
            }
            byTypeList.nodes.push(n);
        });

    for (const groupName of Object.keys(nodesByType)) {
        const group = nodesByType[groupName];
        group.listURL = getURLResolver(options).resolveGroupedNodes(group.nodes);
    }

    return nodesByType;
}

function createCombinedLineageNode(combinedVisNode: VisGraphCombinedNode): LineageNode {
    const { children, parents } = combinedVisNode.containedNodes.reduce(
        (acc, node) => {
            acc.children = acc.children.concat(node.children) as List<LineageLink>;
            acc.parents = acc.parents.concat(node.parents) as List<LineageLink>;
            return acc;
        },
        { children: List<LineageLink>(), parents: List<LineageLink>() }
    );

    return new LineageNode({ children, lsid: combinedVisNode.id, parents });
}

function createCombinedVisNode(
    containedNodes: LineageNode[],
    options: LineageOptions,
    parentNodeName: string
): VisGraphCombinedNode {
    const { combineSize } = options.grouping;
    let typeLabel: string;
    let commonNode: LineageNode;

    const containedNodesByType = createLineageNodeCollections(containedNodes, options);
    const types = Object.keys(containedNodesByType).sort();

    if (types.length === 1) {
        const nodeCollection = containedNodesByType[types[0]];
        commonNode = nodeCollection.nodes[0];

        if (nodeCollection.materialLineageType === 'Aliquot') {
            typeLabel = 'aliquots';
        } else {
            typeLabel = nodeCollection.displayType;
        }
    } else {
        typeLabel = 'of different types';
    }

    // construct title using the node list groupings
    let title = '';
    let sep = '';
    for (let i = 0; i < types.length; i++) {
        title += sep;
        sep = '<br>';

        const displayType = types[i];
        const nodeList = containedNodesByType[displayType];
        title += displayType + ' (' + nodeList.nodes.length + '):<br>';
        for (let j = 0; j < Math.min(nodeList.nodes.length, combineSize); j++) {
            title += nodeList.nodes[j].name + '<br>';
        }
        if (nodeList.nodes.length > combineSize) {
            title += '...';
        }
    }

    const clusterOptions: VisGraphCombinedNode = {
        kind: 'combined',
        id: 'combined:' + randId(),
        shape: 'dot',
        containedNodes,
        containedNodesByType,
        title,
        label: containedNodes.length + ' ' + typeLabel,
        parentNodeName,
    };

    if (commonNode) {
        const { image, imageBackup, imageSelected, imageShape } = commonNode.iconProps;

        clusterOptions.shape = imageShape;
        clusterOptions.image = {
            unselected: image,
            selected: imageSelected,
        };
        clusterOptions.brokenImage = imageBackup;
    }

    return clusterOptions;
}

/**
 * Get all Edges that are connected to the id
 */
function findConnectedNodes(visEdges: Edge[], id: string, dir?: 'from' | 'to'): Edge[] {
    return visEdges.filter(e => {
        if (dir === 'from' && e.to === id) return true;
        if (dir === 'to' && e.from === id) return true;
        if (dir === undefined && (e.to === id || e.from === id)) return true;
        return false;
    });
}

// collection of lineage node, all of the same type
export interface LineageNodeCollection {
    cpasType: string;
    displayType: string;
    listURL: string;
    materialLineageType?: string;
    nodes: LineageNode[];
    queryName: string;
}

export function isAliquotNodeCollection(node: LineageNodeCollection | LineageNode): boolean {
    return node.materialLineageType === 'Aliquot';
}

function processCombinedNode(
    lsid: string,
    edge: LineageLink,
    combinedNode,
    visEdges: EdgeMap,
    visNodes: VisNodeMap,
    nodesInCombinedNode: { [key: string]: string[] }
): void {
    if (!combinedNode) return;

    // remove the basic node from the graph if it exists
    if (visNodes[edge.lsid]) {
        if (visNodes[edge.lsid].kind !== 'node') {
            console.error('Edge in raw graph should only connect basic nodes: ' + lsid + ' -> ' + edge.lsid);
        }
        delete visNodes[edge.lsid];
    }

    // Find existing edges in either direction to the edge target node being added to the combined node.
    // The existing edges will be deleted and re-added to the new combined node.
    const existingEdges = findConnectedNodes(Object.values(visEdges), edge.lsid);
    // console.log("  ".repeat(depth) + "existing edges for '" + e.lsid + "': " + existingEdges.map(e => e.id));
    for (const existingEdge of existingEdges) {
        // remove existing edge
        // console.log("  ".repeat(depth) + "deleting existing edge: " + existingEdge.id);
        delete visEdges[existingEdge.id];

        if (existingEdge.from === edge.lsid) {
            // create a new edge to the combined node from the existing basic node
            const edgeId = makeEdgeId(combinedNode.id, existingEdge.to);
            // console.log("  ".repeat(depth) + "from matches. creating new edge: " + edgeId);
            visEdges[edgeId] = {
                id: edgeId,
                from: combinedNode.id,
                to: existingEdge.to,
            };
        } else if (existingEdge.to === edge.lsid) {
            // create a new edge from the combined node from the existing basic node
            const edgeId = makeEdgeId(existingEdge.from, combinedNode.id);
            // console.log("  ".repeat(depth) + "to matches. creating new edge: " + edgeId);
            visEdges[edgeId] = {
                id: edgeId,
                from: existingEdge.from,
                to: combinedNode.id,
            };
        }
    }

    // Find existing edges in either direction to any combined nodes the target node belong to.
    // These edges won't be deleted, but new edges will be added to the existing combined nodes.
    if (nodesInCombinedNode[edge.lsid]) {
        for (const existingCombinedId of nodesInCombinedNode[edge.lsid]) {
            const existingEdgesForNodeWithinCombinedNode = findConnectedNodes(
                Object.values(visEdges),
                existingCombinedId
            );
            // console.log("  ".repeat(depth) + "existing edges for combined node '" + existingCombinedId + "' of which '" + e.lsid + "' is a member: " + existingEdgesForNodeWithinCombinedNode.map(e => e.id));

            for (const existingEdge of existingEdgesForNodeWithinCombinedNode) {
                if (existingEdge.from === existingCombinedId) {
                    // create a new edge to the combined node from the existing basic node
                    const edgeId = makeEdgeId(combinedNode.id, existingEdge.to);
                    // console.log("  ".repeat(depth) + "from matches. creating new edge: " + edgeId);
                    visEdges[edgeId] = {
                        id: edgeId,
                        from: combinedNode.id,
                        to: existingEdge.to,
                    };
                } else if (existingEdge.to === existingCombinedId) {
                    // create a new edge from the combined node from the existing basic node
                    const edgeId = makeEdgeId(existingEdge.from, combinedNode.id);
                    // console.log("  ".repeat(depth) + "to matches. creating new edge: " + edgeId);
                    visEdges[edgeId] = {
                        id: edgeId,
                        from: existingEdge.from,
                        to: combinedNode.id,
                    };
                }
            }
        }
    }

    // create association from the node within the combined node to the combined node
    if (!nodesInCombinedNode.hasOwnProperty(edge.lsid)) {
        nodesInCombinedNode[edge.lsid] = [];
    }
    nodesInCombinedNode[edge.lsid].push(combinedNode.id);
}

/** Applies the {@link LineageGroupingOptions#combineSize} logic to the graph. */
function applyCombineSize(
    lsid: string,
    edges: List<LineageLink>,
    nodes: LineageNodeMap,
    options: LineageOptions,
    dir: LINEAGE_DIRECTIONS,
    visEdges: EdgeMap,
    visNodes: VisNodeMap,
    nodesInCombinedNode: { [key: string]: string[] }
): LineageNode[] {
    const combinedLineageNodes: LineageNode[] = [];
    let combinedAliquotNode: VisGraphCombinedNode;
    let combinedNonAliquotNode: VisGraphCombinedNode;

    const node = nodes[lsid];
    const { aliquotEdges, nonAliquotEdges } = edges.reduce(
        (acc, e) => {
            if (nodes[e.lsid].materialLineageType === 'Aliquot') {
                acc.aliquotEdges.push(e);
            } else {
                acc.nonAliquotEdges.push(e);
            }
            return acc;
        },
        { aliquotEdges: [] as LineageLink[], nonAliquotEdges: [] as LineageLink[] }
    );

    if (aliquotEdges.length > 1) {
        const aliquotNodes = aliquotEdges.map(e => nodes[e.lsid]);

        combinedAliquotNode = createCombinedVisNode(aliquotNodes, options, node.name);
        visNodes[combinedAliquotNode.id] = combinedAliquotNode;
        combinedLineageNodes.push(createCombinedLineageNode(combinedAliquotNode));

        // create a VisGraph Edge from the current node to the new combined node
        // as well as an edge for each of the combined nodes that one of the edge target nodes may belong to.
        addEdges(lsid, combinedAliquotNode.id, visEdges, List(aliquotEdges), nodesInCombinedNode, dir);
    }

    if (edges.size - aliquotEdges.length >= options.grouping.combineSize) {
        const nonAliquotNodes = nonAliquotEdges.map(e => nodes[e.lsid]);

        combinedNonAliquotNode = createCombinedVisNode(nonAliquotNodes, options, node.name);
        visNodes[combinedNonAliquotNode.id] = combinedNonAliquotNode;
        combinedLineageNodes.push(createCombinedLineageNode(combinedNonAliquotNode));

        // create a VisGraph Edge from the current node to the new combined node
        // as well as an edge for each of the combined nodes that one of the edge target nodes may belong to.
        addEdges(lsid, combinedNonAliquotNode.id, visEdges, List(nonAliquotEdges), nodesInCombinedNode, dir);
    } else {
        // create a VisGraph Edge from the current node to the edge's target for each edge
        if (nonAliquotEdges.length > 0) {
            addEdges(lsid, null, visEdges, List(nonAliquotEdges), nodesInCombinedNode, dir);
        }
    }

    edges.forEach(e => {
        const isAliquot = isAliquotNodeCollection(nodes[e.lsid]);
        const combinedNode = isAliquot ? combinedAliquotNode : combinedNonAliquotNode;
        processCombinedNode(lsid, e, combinedNode, visEdges, visNodes, nodesInCombinedNode);
    });

    return combinedLineageNodes;
}

/**
 * Recursively walks the node list in the direction indicated creating clusters as it goes.
 * The LabKey lineage in `nodes` is processed by this algorithm to populate the
 * `visEdges` collection with {@link Edge} object and the `visNodes` collections with
 * either {@link VisGraphNode} or {@link VisGraphCombinedNode} objects.
 * These collections will be fed into the vis.js {@link Network} to perform the graph layout.
 *
 * If a node has an edge count greater than {@link LineageGroupingOptions.combineSize},
 * a {@link VisGraphCombinedNode} node will be created to hold the collection of {@link LineageNode}
 * objects. We opted to create our own combined nodes rather than use vis.js's cluster node due
 * to vis.js performance issues when laying out large graph sizes with clustered nodes.
 *
 * The algorithm will stop traversing the graph when the conditions specified
 * by {@link LineageGroupingOptions.generations} have been met.
 *
 * The general approach is:
 *  starting from 'mergedIn' nodes (including the original seed)
 *  - if a node has been seen, skip
 *  - create a VisGraphNode and add it to the graph (if it hasn't already been added within a combined node)
 *  - check for stop conditions in `options.generations`:
 *      - if Immediate and depth exceeds depth 1, stop
 *      - if Specific an depth exceeds the desired depth, stop
 *      - if 'Multi' and there are >1 edges at the previous depth, stop
 *  - if there are more than {combineSize} edges, create a combined node
 *     - mark all included nodes and edges on the combined node: {containedNodes: [...]}
 *     - fixup any existing edges to the nodes that are now included in the combined node
 *     - add any additional edges needed for other combined nodes the edge target might belong to
 *     - create edge from the node to the new combined node
 *   - if there are less than {combineSize} edges, create a basic node
 *     - create edges from the node to all of edge targets
 */
function processNodes(
    seed: string,
    lsid: string,
    nodes: LineageNodeMap,
    options: LineageOptions,
    dir: LINEAGE_DIRECTIONS,
    visEdges: EdgeMap,
    visNodes: VisNodeMap,
    nodesInCombinedNode: { [key: string]: string[] },
    depth = 0,
    processed: { [key: string]: boolean } = {},
    depthSets: Array<{ [key: string]: string }> = []
): void {
    if (processed[lsid] === true) {
        return;
    }

    // console.log("  ".repeat(depth) + "processing: " + lsid);
    processed[lsid] = true;

    const node = nodes[lsid];
    if (node === undefined) {
        // console.log("  ".repeat(depth) + "not found: ", nodes);
        return;
    }

    // if node hasn't already been added to a cluster and hasn't been created as a normal node yet, add it now
    if (nodesInCombinedNode[lsid] === undefined && visNodes[lsid] === undefined) {
        // console.log("  ".repeat(depth) + "created basic node");
        visNodes[lsid] = createVisNode(node, lsid, lsid === seed);
    }

    const { grouping } = options;

    if (grouping) {
        // Nearest only examines the first parent and child generations (depth = 1) from seed
        if (grouping.generations === LINEAGE_GROUPING_GENERATIONS.Nearest && depth + 1 > 1) {
            // console.log("  ".repeat(depth) + "nearest. stop");
            return;
        }

        // Specific will examine parent and child generations to the depths specified from seed
        if (
            grouping.generations === LINEAGE_GROUPING_GENERATIONS.Specific &&
            depth + 1 > (dir === LINEAGE_DIRECTIONS.Parent ? grouping.parentDepth : grouping.childDepth)
        ) {
            // console.log("  ".repeat(depth) + "specific depth. stop");
            return;
        }

        // Multi will stop when we hit a depth with multiple nodes.
        // NOTE: this checks the previous depth so any basic nodes at this depth will be created but it's edges won't be traversed.
        if (grouping.generations === LINEAGE_GROUPING_GENERATIONS.Multi) {
            let currentDepthSize = 0;
            if (depth > 0 && depthSets.length >= depth) {
                currentDepthSize = Object.keys(depthSets[depth - 1]).length;
            }
            if (currentDepthSize > 1) {
                // console.log("  ".repeat(depth) + "multi. stop");
                return;
            }
        }
    }

    // examine the edges of the node in the desired direction
    const edges = dir === LINEAGE_DIRECTIONS.Parent ? node.parents : node.children;
    if (edges.size === 0) {
        return;
    }

    // depthSets contains a list of cousin nodes at each depth
    let depthSet;
    if (depth + 1 > depthSets.length) {
        depthSet = {};
        depthSets.push(depthSet);
    } else {
        depthSet = depthSets[depth];
    }

    let queue: string[] = [];
    edges.forEach(e => {
        // queue up nodes we haven't seen at this depth for recursion
        if (depthSet[e.lsid] === undefined) {
            depthSet[e.lsid] = e.lsid;
            queue.push(e.lsid);
        }
    });

    if (grouping.combineSize === 1) {
        throw new Error('combineSize must be >1 or disabled (0 or undefined)');
    }

    if (grouping.combineSize && edges.size >= grouping.combineSize) {
        const combinedLineageNodes = applyCombineSize(
            lsid,
            edges,
            nodes,
            options,
            dir,
            visEdges,
            visNodes,
            nodesInCombinedNode
        );

        if (combinedLineageNodes.length > 0) {
            queue = [];

            combinedLineageNodes.forEach(cln => {
                nodes[cln.lsid] = cln;
                edges.forEach(e => {
                    processed[e.lsid] = true;
                });
                queue.push(cln.lsid);
            });
        }
    } else {
        // create a VisGraph Edge from the current node to the edge's target for each edge
        addEdges(lsid, null, visEdges, edges, nodesInCombinedNode, dir);
    }

    // recurse for other nodes not yet processed at this depth
    for (let i = 0; i < queue.length; i++) {
        processNodes(
            seed,
            queue[i],
            nodes,
            options,
            dir,
            visEdges,
            visNodes,
            nodesInCombinedNode,
            depth + 1,
            processed,
            depthSets
        );
    }
}

const DEFAULT_EDGE_PROPS = {
    arrows: {
        to: {
            enabled: true,
        },
        from: {
            enabled: false,
        },
    },
    arrowStrikethrough: false,
    chosen: false,
    dashes: false,
    color: {
        // Issue 37380: edges are missing from lineage graph
        // Without 'inherit:false', edges take their color of the 'from' node -- which is white :(
        inherit: false,
        color: '#808080',
    },
};

const DEFAULT_NODE_PROPS = {
    // ensure edge lines do not enter the image by setting useBorderImage to true and making the border
    // color be white (the same as the background) so that user does not see border box drawn around image
    color: {
        border: '#F0F0F0',
        background: '#F8F8F8',
    },
    shadow: {
        enabled: false,
        color: 'rgba(0,0,0,0.25)',
        size: 3,
        x: 3,
        y: 3,
    },
    shapeProperties: {
        useBorderWithImage: true,
    },
    font: {
        size: 14,
    },
    chosen: {
        node: function (values, id, selected, hovering) {
            if (selected || hovering) {
                values.borderColor = '#FFA500';
                values.shadow = true;
            }

            if (hovering) {
                values.borderWidth = 1;
            }

            if (selected) {
                values.borderWidth = 1.5;
            }
        },
    },
};

export function generate(result: LineageResult, options?: LineageOptions): VisGraphOptions {
    if (result === undefined) {
        throw new Error('raw lineage result needed to create graph');
    }

    const _options = applyLineageOptions(options);

    const nodes = result.nodes.toObject();

    // The primary output of this function: the node objects to be consumed by vis.js
    // lsid -> VisGraphNode or VisGraphCombinedNode
    const visNodes: VisNodeMap = {};

    // The primary output of this function: the edge objects to be consumed by vis.js
    // fromLsid + '||' + toLsid -> Edge
    const visEdges: EdgeMap = {};

    // Intermediate state used by processNodes
    // lsid -> Array of combined id nodes
    const nodesInCombinedNode: { [key: string]: string[] } = {};

    result.mergedIn.forEach(startLsid => {
        // parents
        processNodes(
            result.seed,
            startLsid,
            nodes,
            _options,
            LINEAGE_DIRECTIONS.Parent,
            visEdges,
            visNodes,
            nodesInCombinedNode
        );

        // children
        processNodes(
            result.seed,
            startLsid,
            nodes,
            _options,
            LINEAGE_DIRECTIONS.Children,
            visEdges,
            visNodes,
            nodesInCombinedNode
        );
    });

    return new VisGraphOptions({
        nodes: new DataSet<VisGraphNode | VisGraphCombinedNode>(Object.values(visNodes)),
        edges: new DataSet<Edge>(Object.values(visEdges)),

        // visjs options described in detail here: http://visjs.org/docs/network/
        options: {
            // hierarchical is needed to render linage as consistent straight up and down single branch
            // oriented in the direction implied by the direction of the edges.
            layout: {
                hierarchical: {
                    enabled: true,
                    direction: 'UD',
                    sortMethod: 'directed',
                },
            },

            interaction: {
                dragNodes: false,
                zoomView: true,
                dragView: true,
                keyboard: false,
                hover: true,
            },

            physics: {
                enabled: false,
            },

            nodes: DEFAULT_NODE_PROPS,

            edges: DEFAULT_EDGE_PROPS,
        },

        initialSelection: [result.seed],
    });
}
