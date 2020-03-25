/*
 * Copyright (c) 2017-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map } from 'immutable';
import { imageURL, Theme } from '../..';

import { LineageLink, LineageNode } from './models';
import { LINEAGE_DIRECTIONS } from './constants';

export function getImageFromLineageNode(lineageNode: LineageNode, isSeed: boolean, isSelected: boolean): string {
    const iconURL = lineageNode.meta ? lineageNode.meta.iconURL : 'default';

    return imageFromIdentifier(iconURL, isSeed, isSelected);
}

export function getBackupImageFromLineageNode(lineageNode: LineageNode, isSeed: boolean, isSelected: boolean): string {
    let iconURL = 'default';

    // Use default image specific for cpasType categories
    if (lineageNode.cpasType && lineageNode.cpasType.includes('SampleSet')) {
        iconURL = 'samples';
    }

    // use labkey.org as a backup for images src
    return 'https://labkey.org/_images/' + getImageNameWithTheme(iconURL, isSeed, isSelected);
}

function imageFromIdentifier(iconURL: string, isSeed: boolean, isSelected: boolean): string {
    return imageURL('_images', getImageNameWithTheme(iconURL, isSeed, isSelected));
}

export function getImageNameWithTheme(iconURL: string, isSeed: boolean, isSelected: boolean): string {
    // use seed and selected status to determine color of image used
    let theme = Theme.GRAY;

    if (isSelected === true) {
        theme = Theme.ORANGE;
    }
    else if (isSeed === true) {
        theme = Theme.DEFAULT;
    }

    const suffix = theme === Theme.DEFAULT ? '' : '_' + Theme[theme];

    return [iconURL, suffix, '.svg'].join('').toLowerCase();
}

export function getLineageDepthFirstNodeList(nodes: Map<string, LineageNode>, lsid: string, direction: LINEAGE_DIRECTIONS, maxDistance: number) : List<LineageNode> {
    let nodeList = List<LineageNode>().asMutable();
    nodeList.push(nodes.get(lsid).set('distance', 0));

    let nextNodes: List<LineageLink> = nodes.getIn([lsid, direction]);
    if (nextNodes) {
        nextNodes.forEach((next) => {
            nodeList.push(..._getDepthFirstNodeList(nodes, next.lsid, direction, maxDistance, 1).toArray())
        });
    }
    return nodeList.asImmutable();
}


function _getDepthFirstNodeList(nodes: Map<string, LineageNode>, lsid: string, direction: LINEAGE_DIRECTIONS, maxDistance: number, distance: number) : List<LineageNode> {
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
