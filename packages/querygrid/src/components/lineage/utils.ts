/*
 * Copyright (c) 2017-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map, OrderedSet, Set } from 'immutable'
import { imageURL, Theme } from "@glass/base";

import { LineageGroupingGenerations, ILineageGroupingOptions, LineageDirections, LineageLink, LineageNode } from './models'

export function applyMultiLineLabel(name: string, cpasType: string, isBold?: boolean): string {
    let cpasTypeEnd = cpasType ? cpasType.substring(cpasType.lastIndexOf(':') + 1): '';
    let label = name;

    if (isBold === true) {
        label = cpasTypeEnd + '\n' + '<b>' + label + '</b>';
    }
    else {
        label = cpasTypeEnd + '\n' + label;
    }

    return label;
}

export function getImageFromLineageNode(lineageNode: LineageNode, isSeed: boolean, isSelected: boolean): string {
    const iconURL = lineageNode.meta ? lineageNode.meta.iconURL : 'default';

    return imageFromIdentifier(iconURL, isSeed, isSelected);
}

export function getBackupImageFromLineageNode(lineageNode: LineageNode, isSeed: boolean, isSelected: boolean): string {
    let iconURL = 'default';

    // Use default image specific for cpasType categories
    if (lineageNode.cpasType && lineageNode.cpasType.includes('SampleSet')) {
        iconURL = 'Samples';
    }

    return imageFromIdentifier(iconURL, isSeed, isSelected);
}

function imageFromIdentifier(iconURL: string, isSeed: boolean, isSelected: boolean): string {
    // use seed and selected status to determine color of image used
    let theme = Theme.GRAY;

    if (isSelected === true) {
        theme = Theme.ORANGE;
    }
    else if (isSeed === true) {
        theme = Theme.DEFAULT;
    }

    const suffix = theme === Theme.DEFAULT ? '' : '_' + Theme[theme];

    return imageURL('_images', [iconURL, suffix, '.svg'].join('').toLowerCase());
}

/**
 * Processes each depth for the graph of `nodes`. Returns a List of OrderedSet's for each depth. `options`
 * can be supplied which modify how depth processing occurs.
 */
export function processDepth(options: ILineageGroupingOptions, nodes: Map<string, LineageNode>, lsid: string, dir: LineageDirections): List<OrderedSet<string>> {
    let depths = List<OrderedSet<string>>().asMutable();
    let processed = Set<string>().asMutable();

    _processDepth(options, nodes, lsid, depths, processed, 0, dir);

    return depths;
}

/**
 * This is a recursive function that will populate the `depths` List from `nodes` walking the graph in the `dir`
 * specified. Each depth is an OrderedSet of LSIDs found at that depth.
 */
function _processDepth(options: ILineageGroupingOptions, nodes: Map<string, LineageNode>, lsid: string, depths: List<OrderedSet<string>>, processed: Set<string>, depth: number, dir: LineageDirections): void {

    if (processed.has(lsid)) {
        return;
    }

    // nearest only examines the first parent and child generations (depth = 1) from seed
    if (options && options.generations === LineageGroupingGenerations.Nearest && depth + 1 > 1) {
        return;
    }
    // specific will examine parent and child generations to the depths specified from seed
    else if (options && options.generations === LineageGroupingGenerations.Specific && depth + 1 > (dir === LineageDirections.Parent ? options.parentDepth: options.childDepth) ) {
        return;
    }

    processed.add(lsid);

    let queue = [];
    let edges = nodes.get(lsid).get(dir);
    if (edges.size > 0) {

        let depthSet;
        if (depth + 1 > depths.size) {
            depthSet = OrderedSet<string>().asMutable();
            depths.push(depthSet);
        } else {
            depthSet = depths.get(depth);
        }

        edges.forEach((n) => {
            if (!depthSet.contains(n.lsid)) {
                depthSet.add(n.lsid);
                queue.push(n.lsid);
            }
        });

        // if generations = 'multi' then as soon as we find a depth that has multiple nodes then we are done
        if (options && options.generations === LineageGroupingGenerations.Multi && depthSet.size > 1) {
            return;
        }

        for (let i=0; i < queue.length; i++) {
            _processDepth(options, nodes, queue[i], depths, processed, depth + 1, dir);
        }
    }
}


export function getLineageDepthFirstNodeList(nodes: Map<string, LineageNode>, lsid: string, direction: LineageDirections, maxDistance: number) : List<LineageNode> {
    let nodeList = List<LineageNode>().asMutable();
    nodeList.push(nodes.get(lsid).set('distance', 0));

    let nextNodes: List<LineageLink> = nodes.getIn([lsid, direction]);
    if (nextNodes) {
        nextNodes.forEach((next: LineageLink) => {
            nodeList.push(..._getDepthFirstNodeList(nodes, next.get('lsid'), direction, maxDistance, 1).toArray())
        });
    }
    return nodeList.asImmutable();
}


function _getDepthFirstNodeList(nodes: Map<string, LineageNode>, lsid: string, direction: LineageDirections, maxDistance: number, distance: number) : List<LineageNode> {
    let nodeList = List<LineageNode>().asMutable();
    const nextNodes: List<LineageLink> = nodes.getIn([lsid, direction]);
    if (distance <= maxDistance) {
        nodeList.push(nodes.get(lsid).set('distance', distance));
        if (nextNodes !== undefined) {
            nextNodes.forEach((nextNode) => {
                nodeList.push(..._getDepthFirstNodeList(nodes, nextNode.get('lsid'), direction, maxDistance, distance + 1).toArray());
            });
        }
    }
    return nodeList.asImmutable();
}