/*
 * Copyright (c) 2017-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map, fromJS, Iterable, Seq } from 'immutable'
import { Ajax, Filter, Utils } from '@labkey/api';
import { AppURL, buildURL, GridColumn, SchemaQuery, SCHEMAS } from "@glass/base";

import {
    Lineage,
    LineageFilter,
    LineageGridModel,
    LineageNode,
    LineageNodeMetadata,
    LineageOptions,
    LineageResult
} from "./models";
import { ISelectRowsResult, selectRows } from "../../query/api";
import { getLineageResult, updateLineageResult } from "../../global";
import { Location } from '../../util/URL'
import { LINEAGE_DIRECTIONS } from "./constants";
import { getLineageDepthFirstNodeList } from "./utils";

const LINEAGE_METADATA_COLUMNS = List(['LSID', 'Name', 'Description', 'Alias', 'RowId', 'Created']);

export function fetchLineage(seed: string, distance?: number): Promise<LineageResult> {
    return new Promise((resolve, reject) => {
        // query for both parents and children to facilitate showing counts within the grid links
        let params: any = {
            children: true,
            lsid: seed,
            parents: true
        };

        if (!isNaN(distance)) {
            // The lineage includes a "run" object for each parent as well, so we
            // query for twice the depth requested in the URL.
            params.depth = distance * 2;
        }

        Ajax.request({
            url: buildURL('experiment', 'lineage.api', params),
            success: Utils.getCallbackWrapper((lineage) => {
                resolve(LineageResult.create(lineage));
            }),
            failure: function() { // TODO: Handle how we hand back error
                reject({
                    seed,
                    message: 'Something went wrong retrieving lineage for seed ' + seed + '.'
                });
            }
        });
    });
}

function fetchSampleSetData(sampleSet: string, nodes: List<LineageNode>): Promise<ISelectRowsResult> {
    return new Promise((resolve) => {
        return selectRows({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            queryName: sampleSet,
            columns: LINEAGE_METADATA_COLUMNS.join(','),
            filterArray: [
                Filter.create("rowId", nodes.map(n => n.get('rowId')).toArray(), Filter.Types.IN),
            ]
        }).then((result) =>
            resolve(result)
        );
    });
}

function fetchDataClassData(schemaQuery: SchemaQuery, nodes: List<LineageNode>): Promise<ISelectRowsResult> {
    return new Promise((resolve) => {
        return selectRows({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            columns: LINEAGE_METADATA_COLUMNS.join(','),
            filterArray: [
                Filter.create("rowId", nodes.map(n => n.get('rowId')).toArray(), Filter.Types.IN),
            ]
        }).then((result) =>
            resolve(result)
        );
    });
}

// get the lineage nodes filtered by nodeType then grouped by their queryName
function getDataTypeMap(lineage: LineageResult, nodeType: string) : Seq.Keyed<any, Iterable<string, LineageNode>> {
    let dataNodes = lineage.nodes.filter(node => node.get('type') === nodeType);
    return dataNodes.groupBy(n => n.get('queryName'));
}

export function getLineageNodeMetadata(lineage: LineageResult): Promise<LineageResult> {
    return new Promise((resolve) => {
        let promises: Array<Promise<ISelectRowsResult>> = [];

        getDataTypeMap(lineage, 'Sample').forEach((nodeList, sampleSet) => {
            promises.push(fetchSampleSetData(sampleSet, nodeList.toList()));
        });

        getDataTypeMap(lineage, 'Data').forEach((nodeList, dataType) => {
            promises.push(fetchDataClassData(SchemaQuery.create(SCHEMAS.DATA_CLASSES.SCHEMA, dataType), nodeList.toList()));
        });

        return Promise.all(promises)
            .then((results) => {
                let metadata = {};
                results.forEach((result: ISelectRowsResult) => {
                    const queryInfo = result.queries[result.key];
                    const model = fromJS(result.models[result.key]);
                    model.forEach((data) => {
                        const lsid = data.getIn(['LSID', 'value']);
                        metadata[lsid] = LineageNodeMetadata.create(data, queryInfo);
                    });
                });

                const nodes = lineage.nodes.reduce((prev, node, key) => {
                    const lsid = node.lsid;
                    let meta = metadata[lsid];
                    node = node.set('meta', meta);
                    return prev.set(key, node);
                }, Map<string, LineageNode>());

                return lineage.set('nodes', nodes) as LineageResult;
            })
            .then((result) => {
                resolve(result);
            })
    });
}

export function loadLineageIfNeeded(seed: string, distance?: number): Promise<Lineage> {
    const existing = getLineageResult(seed);
    if (existing) {
        return Promise.resolve(existing);
    }

    return fetchLineage(seed, distance)
        .then(result => getLineageNodeMetadata(result))
        .then(result => {
            const updatedResult = resolveResultURLs(result);

            // either update the global state to include the result or set it
            let lineage = getLineageResult(seed);
            if (lineage) {
                lineage = new Lineage({
                    ...lineage,
                    result: updatedResult
                });
            }
            else {
                lineage = new Lineage({result: updatedResult});
            }

            updateLineageResult(seed, lineage);
            return lineage;
        })
        .catch(reason => {
            const lineage = new Lineage({error: reason.message});
            updateLineageResult(seed, lineage);
            return lineage;
        });
}

function resolveResultURLs(result: LineageResult): LineageResult {
    const resolvedNodes = result.nodes.map((node) => {
        if (node.type === 'Sample' || node.type === 'Data') {

            let route = 'samples';
            if (node.type === 'Data') {
                route = 'registry';
            }

            if (node.cpasType) {
                let parts = node.cpasType.split(':');
                let namespace = parts[parts.length-2];
                let name = parts[parts.length-1];

                // TODO: we ought to be using the urlResolver here instead
                // Lsid strings are 'application/x-www-form-urlencoded' encoded which replaces space with '+'
                name = name.replace(/\+/g, ' ');

                return node.merge({
                    listURL: [route, name.toLowerCase()].join('/'),
                    url: ['#', route, name.toLowerCase(), node.get('rowId')].join('/')
                });
            }
        }

        return node;
    });

    return result.set('nodes', resolvedNodes) as LineageResult;
}

export function getLocationString(location: Location): string {
    let loc = '';

    if (location) {
        let sep = '';
        // all properties on the URL that are respected by LineagePageModel
        ['distance', 'members', 'p', 'seeds'].forEach((key) => {
            loc += sep + key + '=' + location.query.get(key);
            sep = '&';
        });
    }

    return loc;
}

export function createGridModel(lineage: Lineage, members: LINEAGE_DIRECTIONS, distance: number, columns: List<string | GridColumn>, pageNumber: number): LineageGridModel {
    const result = lineage.filterResult(new LineageOptions({
        filters: List<LineageFilter>([new LineageFilter('type', ['Sample', 'Data'])])
    }));

    const nodeList = getLineageDepthFirstNodeList(result.nodes, result.seed, members, distance);
    let nodeCounts = Map<string, number>().asMutable();
    nodeList.forEach((node) => {
        const lsid = node.get('lsid');
        if (nodeCounts.has(lsid)) {
            nodeCounts.set(lsid, nodeCounts.get(lsid) + 1);
        }
        else {
            nodeCounts.set(lsid, 1);
        }
    });

    return new LineageGridModel({
        columns,
        data: nodeList,
        distance,
        isError: false,
        isLoaded: true,
        isLoading: false,
        members,
        message: undefined,
        nodeCounts,
        pageNumber,
        seedNode: nodeList.get(0),
        totalRows: nodeList.size
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