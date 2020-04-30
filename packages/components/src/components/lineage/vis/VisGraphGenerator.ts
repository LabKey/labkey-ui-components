/*
 * Copyright (c) 2017-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map, Record } from 'immutable';
import { Utils } from '@labkey/api';
import { DataSet, Edge, Network, Node } from 'vis-network';

import { applyLineageOptions, LineageLink, LineageNode, LineageResult } from '../models';
import { getImagesForNode } from '../utils';
import { LINEAGE_DIRECTIONS, LINEAGE_GROUPING_GENERATIONS, LineageGroupingOptions, LineageOptions } from '../types';
import { getURLResolver } from '../LineageURLResolvers';

export type VisGraphNodeType = VisGraphNode | VisGraphCombinedNode | VisGraphClusterNode;

export const DEFAULT_EDGE_PROPS = {
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

export const DEFAULT_NODE_PROPS = {
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
        size: 10,
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

// collection of lineage node, all of the same type
export interface LineageNodeCollection {
    cpasType: string;
    displayType: string;
    listURL: string;
    nodes: LineageNode[];
}

export type LineageNodeCollectionByType = { [nodeType: string]: LineageNodeCollection };

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
            let byTypeList = nodesByType[displayType];
            if (!byTypeList) {
                byTypeList = {
                    displayType,
                    cpasType: n.cpasType,
                    listURL: undefined,
                    nodes: [],
                };
                nodesByType[displayType] = byTypeList;
            }
            byTypeList.nodes.push(n);
        });

    for (const groupName of Object.keys(nodesByType)) {
        const group = nodesByType[groupName];
        group.listURL = getURLResolver(options).resolveGroupedNodes(group.nodes);
    }

    return nodesByType;
}

// extend Node to include the LabKey lineage node and the cluster id
export interface VisGraphNode extends Node {
    id: string;
    kind: 'node';
    lineageNode: LineageNode;
}

export interface VisGraphCombinedNode extends Node {
    id: string;
    kind: 'combined';
    containedNodes: LineageNode[];
    containedNodesByType: LineageNodeCollectionByType;
}

// vis.js doesn't expose cluster nodes directly, so this is our shim
export interface VisGraphClusterNode {
    kind: 'cluster';
    id: string | number;
    nodesInCluster: VisGraphNodeType[];
}

export function isBasicNode(item: VisGraphNodeType): item is VisGraphNode {
    return item.kind === 'node';
}

export function isCombinedNode(item: VisGraphNodeType): item is VisGraphCombinedNode {
    return item.kind === 'combined';
}

export function isClusterNode(item: VisGraphNodeType): item is VisGraphClusterNode {
    return item.kind === 'cluster';
}

export class VisGraphOptions extends Record({
    edges: undefined,
    nodes: undefined,
    options: {},
    makeClusters: undefined,
    initialSelection: undefined,
}) {
    edges?: DataSet<Edge>;
    nodes?: DataSet<VisGraphNode | VisGraphCombinedNode>;
    options?: { [key: string]: any };
    makeClusters?: (network: Network, options?: VisGraphOptions) => void;
    initialSelection?: string[];

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    getCombinedNodes(): VisGraphCombinedNode[] {
        return this.nodes.get({ filter: isCombinedNode }) as VisGraphCombinedNode[];
    }
}

export function generate(result: LineageResult, options?: LineageOptions): VisGraphOptions {
    if (result === undefined) throw new Error('raw lineage result needed to create graph');

    const _options = applyLineageOptions(options);

    const nodes = result.nodes;

    // The primary output of this function: the node objects to be consumed by vis.js
    // lsid -> VisGraphNode or VisGraphCombinedNode
    const visNodes: { [key: string]: VisGraphNode | VisGraphCombinedNode } = {};

    // The primary output of this function: the edge objects to be consumed by vis.js
    // fromLsid + '||' + toLsid -> Edge
    const visEdges: { [key: string]: Edge } = {};

    // Intermediate state used by processNodes
    // combined id -> VisGraphCombinedNode
    const combinedNodes: { [key: string]: VisGraphCombinedNode } = {};

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
            combinedNodes,
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
            combinedNodes,
            nodesInCombinedNode
        );
    });

    return new VisGraphOptions({
        nodes: new DataSet<VisGraphNode | VisGraphCombinedNode>(Object['values'](visNodes)),
        edges: new DataSet<Edge>(Object['values'](visEdges)),

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
 *  - if there are more than 5 edges, create a combined node
 *     - mark all included nodes and edges on the combined node: {containedNodes: [...]}
 *     - fixup any existing edges to the nodes that are now included in the combined node
 *     - add any additional edges needed for other combined nodes the edge target might belong to
 *     - create edge from the node to the new combined node
 *   - if there are less than 5 edges, create a basic node
 *     - create edges from the node to all of edge targets
 */
function processNodes(
    seed: string,
    startLisd: string,
    nodes: Map<string, LineageNode>,
    options: LineageOptions,
    dir: LINEAGE_DIRECTIONS,
    visEdges: { [p: string]: Edge },
    visNodes: { [p: string]: VisGraphNode | VisGraphCombinedNode },
    combinedNodes: { [key: string]: VisGraphCombinedNode },
    nodesInCombinedNode: { [key: string]: string[] }
) {
    const processed: { [key: string]: boolean } = {};

    // group nodes by depth from the seed in the direction, regardless of the lineage
    const depthSets: Array<{ [key: string]: string }> = [];

    _processNodes(
        seed,
        startLisd,
        nodes,
        options,
        dir,
        visEdges,
        visNodes,
        combinedNodes,
        nodesInCombinedNode,
        0,
        processed,
        depthSets
    );
}

function _processNodes(
    seed: string,
    lsid: string,
    nodes: Map<string, LineageNode>,
    options: LineageOptions,
    dir: LINEAGE_DIRECTIONS,
    visEdges: { [key: string]: Edge },
    visNodes: { [key: string]: VisGraphNode | VisGraphCombinedNode },
    combinedNodes: { [key: string]: VisGraphCombinedNode },
    nodesInCombinedNode: { [key: string]: string[] },
    depth: number,
    processed: { [key: string]: boolean },
    depthSets: Array<{ [key: string]: string }>
) {
    if (processed[lsid] === true) {
        return;
    }

    // console.log("  ".repeat(depth) + "processing: " + lsid);
    processed[lsid] = true;

    const node = nodes.get(lsid);
    if (node === undefined) {
        // console.log("  ".repeat(depth) + "not found: ", nodes);
        return;
    }

    // if node hasn't already been added to a cluster and hasn't been created as a normal node yet, add it now
    const currentNodeIsNotInCombinedNode = nodesInCombinedNode[lsid] === undefined;
    if (currentNodeIsNotInCombinedNode && visNodes[lsid] === undefined) {
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
        // NOTE: this checks the previous depth so any basic nodes at this depth will be created but it's edges won' be traversed.
        if (grouping.generations === LINEAGE_GROUPING_GENERATIONS.Multi) {
            let currentDepthSize = 0;
            if (depth > 0 && depthSets.length >= depth) currentDepthSize = Object.keys(depthSets[depth - 1]).length;
            if (currentDepthSize > 1) {
                // console.log("  ".repeat(depth) + "multi. stop");
                return;
            }
        }
    }

    // examine the edges of the node in the desired direction
    const queue = [];
    const edges = dir == LINEAGE_DIRECTIONS.Parent ? node.parents : node.children;
    if (edges.size > 0) {
        // depthSets contains a list of cousin nodes at each depth
        let depthSet;
        if (depth + 1 > depthSets.length) {
            depthSet = {};
            depthSets.push(depthSet);
        } else {
            depthSet = depthSets[depth];
        }

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
            const containedNodes = edges.map(e => e.lsid).toArray();
            // console.log("  ".repeat(depth) + "creating combined node for: " + containedNodes);
            const combinedNode = createCombinedVisNode(nodes, containedNodes, options);
            visNodes[combinedNode.id] = combinedNode;
            combinedNodes[combinedNode.id] = combinedNode;

            edges.forEach(e => {
                // remove the basic node from the graph if it exists
                if (visNodes[e.lsid]) {
                    if (visNodes[e.lsid].kind !== 'node') {
                        console.error('Edge in raw graph should only connect basic nodes: ' + lsid + ' -> ' + e.lsid);
                    }
                    delete visNodes[e.lsid];
                }

                // Find existing edges in either direction to the edge target node being added to the combined node.
                // The existing edges will be deleted and re-added to the new combined node.
                const existingEdges = findConnectedNodes(Object['values'](visEdges), e.lsid);
                // console.log("  ".repeat(depth) + "existing edges for '" + e.lsid + "': " + existingEdges.map(e => e.id));
                for (const existingEdge of existingEdges) {
                    // remove existing edge
                    // console.log("  ".repeat(depth) + "deleting existing edge: " + existingEdge.id);
                    delete visEdges[existingEdge.id];

                    if (existingEdge.from === e.lsid) {
                        // create a new edge to the combined node from the existing basic node
                        const edgeId = makeEdgeId(combinedNode.id, existingEdge.to);
                        // console.log("  ".repeat(depth) + "from matches. creating new edge: " + edgeId);
                        visEdges[edgeId] = {
                            id: edgeId,
                            from: combinedNode.id,
                            to: existingEdge.to,
                        };
                    } else if (existingEdge.to === e.lsid) {
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
                if (nodesInCombinedNode[e.lsid]) {
                    for (const existingCombinedId of nodesInCombinedNode[e.lsid]) {
                        const existingEdgesForNodeWithinCombinedNode = findConnectedNodes(
                            Object['values'](visEdges),
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
                let existingCombinedNodes = nodesInCombinedNode[e.lsid];
                if (existingCombinedNodes === undefined) existingCombinedNodes = nodesInCombinedNode[e.lsid] = [];
                existingCombinedNodes.push(combinedNode.id);
            });

            // create a VisGraph Edge from the current node to the new combined node
            // as well as an edge for each of the combined nodes that one of the edge target nodes may belong to.
            addEdges(lsid, combinedNode.id, visEdges, edges, nodesInCombinedNode, dir, depth);
        } else {
            // create a VisGraph Edge from the current node to the edge's target for each edge
            addEdges(lsid, null, visEdges, edges, nodesInCombinedNode, dir, depth);
        }

        // recurse for other nodes not yet processed at this depth
        for (let i = 0; i < queue.length; i++) {
            _processNodes(
                seed,
                queue[i],
                nodes,
                options,
                dir,
                visEdges,
                visNodes,
                combinedNodes,
                nodesInCombinedNode,
                depth + 1,
                processed,
                depthSets
            );
        }
    }
}

function addEdges(
    lsid: string,
    targetId: string | undefined,
    visEdges: { [key: string]: Edge },
    edges: List<LineageLink>,
    nodesInCombinedNode: { [key: string]: string[] },
    dir: LINEAGE_DIRECTIONS,
    depth: number
) {
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

            edgesToMake.forEach(targetId => {
                // console.log("  ".repeat(depth) + "creating new edge: " + nodeId + " -> " + targetId);
                addEdge(visEdges, dir, nodeId, targetId, depth);
            });
        });
    }
}

/**
 * Create an edge between fromId -> toId when dir === Child.
 * Create an edge between fromId <- toId when dir === Parent.
 */
function addEdge(visEdges: { [key: string]: Edge }, dir, fromId, toId, depth?: number) {
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

const EDGE_ID_SEPARATOR = '||';

function makeEdgeId(fromId, toId) {
    return fromId + EDGE_ID_SEPARATOR + toId;
}

/**
 * Get all Edges that are connected to the id
 */
export function findConnectedNodes(visEdges: Edge[], id: string, dir?: 'from' | 'to'): Edge[] {
    return visEdges.filter(e => {
        if (dir === 'from' && e.to === id) return true;
        if (dir === 'to' && e.from === id) return true;
        if (dir === undefined && (e.to === id || e.from === id)) return true;
        return false;
    });
}

function createVisNode(node: LineageNode, id: string, isSeed: boolean): VisGraphNode {
    // show the alternate icon image color if this node is the seed or has been selected
    const { image, imageBackup, imageSelected, shape } = getImagesForNode(node, isSeed);

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
        shape,
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

function createCombinedVisNode(
    nodes: Map<string, LineageNode>,
    containedNodeIds: string[],
    options: LineageOptions
): VisGraphCombinedNode {
    const { combineSize } = options.grouping;
    let typeLabel: string;
    let commonNode: LineageNode;

    const containedNodes = containedNodeIds.map(n => nodes.get(n));
    const containedNodesByType = createLineageNodeCollections(containedNodes, options);
    const types = Object.keys(containedNodesByType).sort();
    if (types.length === 1) {
        typeLabel = containedNodesByType[types[0]].displayType;
        commonNode = containedNodesByType[types[0]].nodes[0];
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
    };

    if (commonNode) {
        const { image, imageBackup, imageSelected, shape } = getImagesForNode(commonNode, false);

        clusterOptions.shape = shape;
        clusterOptions.image = {
            unselected: image,
            selected: imageSelected,
        };
        clusterOptions.brokenImage = imageBackup;
    }

    return clusterOptions;
}

// https://stackoverflow.com/a/13403498/351483
// generate a random id like "ahl3dhtcxchvqbwyga2nhg"
function randId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function getLineageNodeTitle(node: LineageNode, html: boolean): string {
    // encodeHtml if we are generating html for vis.js to use as the node's tooltip title
    const h = s => (html ? Utils.encodeHtml(s) : s);

    let title = '';

    const meta = node.meta;
    if (meta && meta.displayType) {
        title += h(meta.displayType) + ': ';
    }

    title += node.name;

    if (meta && meta.aliases && meta.aliases.size) {
        title += ' (' + meta.aliases.map(h).join(', ') + ')';
    }

    if (meta && meta.description) {
        title += (html ? '<br>' : '\n') + h(meta.description);
    }

    return title;
}
