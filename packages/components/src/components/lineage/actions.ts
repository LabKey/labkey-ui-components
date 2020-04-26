/*
 * Copyright (c) 2017-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { createContext } from 'react';
import { fromJS, Map, OrderedSet } from 'immutable';
import { ActionURL, Ajax, Experiment, Filter, Utils } from '@labkey/api';
import { AppURL, ISelectRowsResult, Location, SchemaQuery, SCHEMAS, selectRows } from '../..';

import {
    Lineage,
    LineageGridModel,
    LineageNode,
    LineageNodeMetadata,
    LineageResult,
} from './models';
import { DEFAULT_LINEAGE_DIRECTION, DEFAULT_LINEAGE_DISTANCE } from './constants';
import { LINEAGE_DIRECTIONS, LineageFilter, LineageOptions } from './types';
import { getLineageDepthFirstNodeList, resolveIconAndShapeForNode } from './utils';
import { getURLResolver } from './LineageURLResolvers';

const LINEAGE_METADATA_COLUMNS = OrderedSet<string>(['LSID', 'Name', 'Description', 'Alias', 'RowId', 'Created']);

export interface WithNodeInteraction {
    isNodeInGraph?: (node: LineageNode) => boolean
    onNodeMouseOver?: (node: LineageNode) => void
    onNodeMouseOut?: (node: LineageNode) => void
    onNodeClick?: (node: LineageNode) => void
}

const NodeInteractionContext = createContext<WithNodeInteraction>(undefined);
export const NodeInteractionProvider = NodeInteractionContext.Provider;
export const NodeInteractionConsumer = NodeInteractionContext.Consumer;

function fetchLineage(seed: string, distance?: number): Promise<LineageResult> {
    return new Promise((resolve, reject) => {
        let options: any /* ILineageOptions */ = {};

        if (!isNaN(distance)) {
            // The lineage includes a "run" object for each parent as well, so we
            // query for twice the depth requested in the URL.
            options.depth = distance * 2;
        }

        Experiment.lineage({
            ...options,
            includeExpType: true,
            includeRunSteps: true,
            lsid: seed,
            success: lineage => {
                resolve(LineageResult.create(lineage))
            },
            failure: (error) => {
                let message = `Failed to fetch lineage for seed "${seed}".`;

                if (error) {
                    if (error.exception) {
                        message = error.exception;

                        // When a server exception occurs
                        if (error.exceptionClass) {
                            message = `${error.exceptionClass}: ` + error.exception;
                        }
                    }
                }

                reject({
                    seed,
                    message,
                });
            }
        });
    });
}

export function fetchLineageNodes(lsids: string[]): Promise<LineageNode[]> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: ActionURL.buildURL('experiment', 'resolve.api'),
            params: { lsids },
            success: Utils.getCallbackWrapper((json: any) => {
                resolve(json.data.map(n => LineageNode.create(n.lsid, n)));
            }),
            failure: Utils.getCallbackWrapper((error: any) => {
                reject(error);
            }, undefined, true)
        });
    });
}

function fetchNodeMetadata(lineage: LineageResult): Promise<ISelectRowsResult>[] {
    // Node metadata does not support nodes with multiple primary keys. These could be supported, however,
    // each node would require it's own request for the unique keys combination. Also, nodes without any primary
    // keys cannot be filtered upon and thus are also not supported.
    return lineage.nodes
        .filter(n => n.schemaName !== undefined && n.queryName !== undefined && n.pkFilters.size === 1)
        .groupBy(n => SchemaQuery.create(n.schemaName, n.queryName))
        .map((nodes, schemaQuery) => {
            const { fieldKey } = nodes.first().pkFilters.get(0);

            return selectRows({
                schemaName: schemaQuery.schemaName,
                queryName: schemaQuery.queryName,
                // TODO: Is there a better way to determine set of columns? Can we follow convention for detail views?
                // See LineageNodeMetadata (and it's usages) for why this is currently necessary
                columns: LINEAGE_METADATA_COLUMNS.add(fieldKey).join(','),
                filterArray: [
                    Filter.create(fieldKey, nodes.map(n => n.pkFilters.get(0).value).toArray(), Filter.Types.IN)
                ]
            });
        })
        .toArray();
}

export function getLineageNodeMetadata(lineage: LineageResult): Promise<LineageResult> {
    return new Promise((resolve) => {
        return Promise.all(fetchNodeMetadata(lineage))
            .then(results => {
                let iconURLByLsid = {};
                let metadata = {};
                results.forEach(result => {
                    const queryInfo = result.queries[result.key];
                    const model = fromJS(result.models[result.key]);
                    model.forEach((data) => {
                        const lsid = data.getIn(['LSID', 'value']);
                        iconURLByLsid[lsid] = queryInfo.iconURL;
                        metadata[lsid] = LineageNodeMetadata.create(data, queryInfo);
                    });
                });

                return lineage.set('nodes', lineage.nodes.map(node => (
                    node.merge({
                        ...resolveIconAndShapeForNode(node, lineage.seed === node.lsid, iconURLByLsid[node.lsid]),
                        meta: metadata[node.lsid],
                    })
                ))) as LineageResult;
            })
            .then((result) => {
                resolve(result);
            })
    });
}

let lineageResultCache: { [key:string]: Promise<LineageResult> } = {};

export function invalidateLineageResults(): void {
    lineageResultCache = {};
}

export function loadLineageResult(seed: string, distance?: number, options?: LineageOptions): Promise<LineageResult> {
    const key = [seed, distance ?? -1].join('|');

    if (!lineageResultCache[key]) {
        lineageResultCache[key] = fetchLineage(seed, distance).then(r => processLineageResult(r, options));
    }

    return lineageResultCache[key];
}

export function loadSampleStats(lineageResult: LineageResult): Promise<any> {
    return selectRows({
        schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
        queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName
    }).then(sampleSets => computeSampleCounts(lineageResult, sampleSets));
}

// TODO add jest test coverage for this function
function computeSampleCounts(lineageResult: LineageResult, sampleSets: any): any {
    const { key, models } = sampleSets;

    let rows = [];
    let nodeIds = {};

    lineageResult.nodes.forEach(node => {
        if (node.lsid && node.cpasType) {
            const key = node.cpasType;

            if (!nodeIds[key]) {
                nodeIds[key] = [];
            }

            nodeIds[key].push(node.id);
        }
    });

    for (let row in models[key]) {
        if (models[key].hasOwnProperty(row)) {
            const _row = models[key][row];

            let count = 0,
                filteredURL;
            let name = _row['Name'].value,
                ids = nodeIds[_row['LSID'].value];

            // if there were related samples, use the array of RowIds as a count and to build an AppURL and filter
            if (ids) {
                count = ids.length;

                filteredURL = AppURL.create('samples', name).addFilters(
                    Filter.create('RowId', ids, Filter.Types.IN)
                ).toHref();
            }

            rows.push({
                name: {
                    value: _row['Name'].value,
                    url: filteredURL
                },
                sampleCount: {
                    value: count
                },
                modified: count > 0 ? _row['Modified'] : undefined
            });
        }
    }

    return fromJS(rows);
}

export function createGridModel(
    lineage: Lineage,
    members: LINEAGE_DIRECTIONS,
    distance: number,
    pageNumber: number
): LineageGridModel {
    const result = lineage.filterResult({
        filters: [new LineageFilter('type', ['Sample', 'Data'])]
    });

    distance = distance ?? DEFAULT_LINEAGE_DISTANCE;
    members = members ?? DEFAULT_LINEAGE_DIRECTION;
    pageNumber = pageNumber ?? 1;

    const data = getLineageDepthFirstNodeList(result.nodes, result.seed, members, distance);
    const nodeCounts = data.reduce((map, node) => {
        const { lsid } = node;
        if (map.has(lsid)) {
            return map.set(lsid, map.get(lsid) + 1);
        }
        return map.set(lsid, 1);
    }, Map<string, number>());

    return new LineageGridModel({
        data,
        distance,
        isError: false,
        isLoaded: true,
        isLoading: false,
        members,
        message: undefined,
        nodeCounts,
        pageNumber,
        seedNode: data.get(0),
        totalRows: data.size,
    });
}

export function getPageNumberChangeURL(location: Location, seed: string, pageNumber: number): AppURL {
    let url = AppURL.create('lineage');

    // use the seed lsid value from the param
    url = url.addParam('seeds', seed);

    location.query.map((value: any, key: string) => {
        if (key !== 'p' && key !== 'seeds') {
            url = url.addParam(key, value);
        }
    });

    if (pageNumber > 1) {
        url = url.addParam('p', pageNumber);
    }

    return url;
}

export async function processLineageResult(result: LineageResult, options?: LineageOptions): Promise<LineageResult> {
    return getLineageNodeMetadata(result).then(r => getURLResolver(options).resolveNodes(r));
}
