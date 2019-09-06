/*
 * Copyright (c) 2017-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map, fromJS, Iterable, Seq } from 'immutable'
import { Ajax, Filter, Utils } from '@labkey/api';
import { buildURL, SchemaQuery, SCHEMAS } from "@glass/base";

import { LineageNode, LineageNodeMetadata, LineageResult } from "./models";
import { ISelectRowsResult, selectRows } from "../../query/api";

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