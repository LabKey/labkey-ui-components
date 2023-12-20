/*
 * Copyright (c) 2017-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map } from 'immutable';
import { Experiment, Utils } from '@labkey/api';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { imageURL } from '../../url/ActionURL';
import { Theme } from '../base/SVGIcon';
import { SCHEMAS } from '../../schemas';

import { LINEAGE_DIRECTIONS, LineageIconMetadata } from './types';
import { LineageLink, LineageNode } from './models';

export const DEFAULT_ICON_URL = 'default';
const BACKUP_IMAGE_ROOT = 'https://labkey.org/_images/';

// The default vis-network icon shape to use for nodes in the lineage graph
const DEFAULT_ICON_SHAPE = 'circularImage';

// A constant set of icons that are better displayed as a normal image (since default is "circularImage")
const NON_CIRCULAR_IMAGES = ['datafile', 'file', 'expressionsystem', 'mixtures', 'rawmaterials', 'run'];

function getQueryFromSchema(schemasObject: any, queryName: string): SchemaQuery {
    return Object.keys(schemasObject)
        .map(k => schemasObject[k])
        .filter(value => !Utils.isString(value))
        .find(schemaQuery => schemaQuery.queryName.toLowerCase() === queryName.toLowerCase());
}

function imageFromIdentifier(iconURL: string, isSeed: boolean, isSelected: boolean): string {
    return imageURL('_images', getImageNameWithTheme(iconURL, isSeed, isSelected));
}

export function getImageNameWithTheme(iconURL: string, isSeed: boolean, isSelected: boolean): string {
    // use seed and selected status to determine color of image used
    let theme = Theme.GRAY;

    if (isSelected === true) {
        theme = Theme.ORANGE;
    } else if (isSeed === true) {
        theme = Theme.DEFAULT;
    }

    const suffix = theme === Theme.DEFAULT ? '' : '_' + Theme[theme];

    return [iconURL, suffix, '.svg'].join('').toLowerCase();
}

export function getLineageDepthFirstNodeList(
    nodes: Map<string, LineageNode>,
    lsid: string,
    direction: LINEAGE_DIRECTIONS,
    maxDistance: number
): List<LineageNode> {
    const nodeList = List<LineageNode>().asMutable();
    nodeList.push(nodes.get(lsid).set('distance', 0) as LineageNode);

    const nextNodes: List<LineageLink> = nodes.getIn([lsid, direction]);
    if (nextNodes) {
        nextNodes.forEach(next => {
            nodeList.push(..._getDepthFirstNodeList(nodes, next.lsid, direction, maxDistance, 1).toArray());
        });
    }
    return nodeList.asImmutable();
}

function _getDepthFirstNodeList(
    nodes: Map<string, LineageNode>,
    lsid: string,
    direction: LINEAGE_DIRECTIONS,
    maxDistance: number,
    distance: number
): List<LineageNode> {
    const nodeList = List<LineageNode>().asMutable();
    const nextNodes: List<LineageLink> = nodes.getIn([lsid, direction]);
    if (distance <= maxDistance) {
        nodeList.push(nodes.get(lsid).set('distance', distance) as LineageNode);
        if (nextNodes !== undefined) {
            nextNodes.forEach(nextNode => {
                nodeList.push(
                    ..._getDepthFirstNodeList(
                        nodes,
                        nextNode.get('lsid'),
                        direction,
                        maxDistance,
                        distance + 1
                    ).toArray()
                );
            });
        }
    }
    return nodeList.asImmutable();
}

// TODO: The iconURL should be resolved by the server.
export function resolveIconAndShapeForNode(
    item?: Experiment.LineageItemBase,
    queryInfoIconURL?: string,
    isSeed?: boolean
): LineageIconMetadata {
    let iconURL = DEFAULT_ICON_URL;
    let imageShape = DEFAULT_ICON_SHAPE;

    if (queryInfoIconURL && queryInfoIconURL !== DEFAULT_ICON_URL) {
        iconURL = queryInfoIconURL.toLowerCase();
    } else if (item) {
        const schemaName = item.schemaName?.toLowerCase() ?? '';
        const queryName = item.queryName?.toLowerCase() ?? '';

        if (schemaName === SCHEMAS.SAMPLE_SETS.SCHEMA.toLowerCase()) {
            // Samples
            const schemaQuery = getQueryFromSchema(SCHEMAS.SAMPLE_SETS, queryName);

            iconURL = schemaQuery ? queryName : 'samples';

            // eesh...
            if (queryName === 'mixturebatches') {
                iconURL = 'batch';
            }
        } else if (schemaName === SCHEMAS.DATA_CLASSES.SCHEMA.toLowerCase()) {
            // Data Classes
            const schemaQuery = getQueryFromSchema(SCHEMAS.DATA_CLASSES, queryName);

            if (schemaQuery) {
                iconURL = queryName;
            }
        } else if (schemaName === 'exp.materials') {
            // Materials
            iconURL = 'samples';
        } else if (item.expType === 'ExperimentRun') {
            iconURL = 'run';
        } else if (item.expType === 'Data') {
            iconURL = 'datafile';
        }
    }

    if (NON_CIRCULAR_IMAGES.indexOf(iconURL) > -1) {
        imageShape = 'image';
    }

    return {
        iconURL,
        image: imageFromIdentifier(iconURL, isSeed, false),
        imageBackup: `${BACKUP_IMAGE_ROOT}${getImageNameWithTheme(iconURL, isSeed, false)}`,
        imageSelected: imageFromIdentifier(iconURL, isSeed, true),
        imageShape,
    };
}
