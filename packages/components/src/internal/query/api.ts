/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { fromJS, List, Map, OrderedMap, Record, Set } from 'immutable';
import { normalize, schema } from 'normalizr';
import { AuditBehaviorTypes, Filter, Query, QueryDOM } from '@labkey/api';

import { getQueryMetadata } from '../global';
import { resolveKeyFromJson } from '../util/utils';
import {
    caseInsensitive,
    QueryColumn,
    QueryInfo,
    QueryInfoStatus,
    resolveSchemaQuery,
    SchemaQuery,
    URLResolver,
    ViewInfo
} from '../..';

const queryDetailsCache: { [key: string]: Promise<QueryInfo> } = {};

export function invalidateQueryDetailsCacheKey(key: string): void {
    delete queryDetailsCache[key];
}

interface GetQueryDetailsOptions {
    schemaName: string;
    queryName: string;
    containerPath?: string;
}

export function getQueryDetails(options: GetQueryDetailsOptions): Promise<QueryInfo> {
    const schemaQuery = SchemaQuery.create(options.schemaName, options.queryName);
    const key = resolveSchemaQuery(schemaQuery);

    if (!queryDetailsCache[key]) {
        queryDetailsCache[key] = new Promise((resolve, reject) => {
            Query.getQueryDetails({
                containerPath: options.containerPath,
                schemaName: options.schemaName,
                queryName: options.queryName,
                viewName: '*',
                success: queryDetails => {
                    // getQueryDetails will return an exception parameter in cases
                    // where it is unable to resolve the tableInfo. This is deemed a 'success'
                    // by the request standards but here we reject as an outright failure
                    if (queryDetails.exception) {
                        invalidateQueryDetailsCacheKey(key);
                        reject({
                            schemaQuery,
                            message: queryDetails.exception,
                            exceptionClass: undefined,
                        });
                    } else {
                        resolve(applyQueryMetadata(queryDetails));
                    }
                },
                failure: (error, request) => {
                    console.error(error);
                    invalidateQueryDetailsCacheKey(key);
                    reject({
                        message: error.exception,
                        exceptionClass: error.exceptionClass,
                        schemaQuery,
                        status: request.status,
                    });
                },
            });
        });
    }

    return queryDetailsCache[key];
}

export function applyQueryMetadata(rawQueryInfo: any): QueryInfo {
    let queryInfo;
    const metadata = getQueryMetadata();

    if (rawQueryInfo && rawQueryInfo.schemaName && rawQueryInfo.name) {
        const schemaQuery = SchemaQuery.create(rawQueryInfo.schemaName, rawQueryInfo.name);

        let columns = OrderedMap<string, QueryColumn>();
        rawQueryInfo.columns.forEach(rawColumn => {
            columns = columns.set(rawColumn.fieldKey.toLowerCase(), applyColumnMetadata(schemaQuery, rawColumn));
        });

        let schemaMeta = metadata.getIn(['schema', rawQueryInfo.schemaName.toLowerCase(), 'queryDefaults']);

        if (schemaMeta) {
            schemaMeta = schemaMeta.toJS();
        }

        // see if metadata is defined for this query
        let queryMeta = metadata.getIn([
            'schema',
            rawQueryInfo.schemaName.toLowerCase(),
            'query',
            rawQueryInfo.name.toLowerCase(),
        ]);

        if (queryMeta) {
            // remove transient properties
            queryMeta = queryMeta.delete('column');
            queryMeta = queryMeta.toJS();
        }

        let views = Map<string, ViewInfo>();

        if (rawQueryInfo.views) {
            views = views.asMutable();

            const removedViewColumns = columns
                .filter(c => c.removeFromViews === true)
                .map(c => c.fieldKey.toLowerCase())
                .toMap();

            rawQueryInfo.views.forEach(rawViewInfo => {
                let viewInfo = ViewInfo.create(rawViewInfo);

                if (removedViewColumns.size) {
                    viewInfo = viewInfo.merge({
                        columns: viewInfo.columns
                            .filter(vc => removedViewColumns.get(vc.fieldKey.toLowerCase()) === undefined)
                            .toList(),
                    }) as ViewInfo;
                }

                columns = applyViewColumns(columns, schemaQuery, rawViewInfo);

                views.set(viewInfo.name.toLowerCase(), viewInfo);
            });
            views = views.asImmutable();
        }

        // TODO get rid of the splitCamelCase?  It's only sometimes the right thing to do.
        const queryLabel = Parsers.splitCamelCase(rawQueryInfo.title || rawQueryInfo.name);

        const defaultQueryMeta = {
            queryLabel,
            plural: queryLabel,
            schemaLabel: Parsers.splitCamelCase(rawQueryInfo.schemaName),
            singular: queryLabel,
        };

        queryInfo = Object.assign({}, rawQueryInfo, schemaMeta, defaultQueryMeta, queryMeta, {
            // derived fields
            columns,
            pkCols: columns
                .filter(col => col.isKeyField)
                .map(col => col.fieldKey)
                .toList(),
            status: QueryInfoStatus.ok, // seems a little weird to be saying we are OK here
            views,
        });
    } else {
        console.warn('Invalid QueryInfo supplied for overriding metadata');
        queryInfo = rawQueryInfo;
    }

    return QueryInfo.create(queryInfo);
}

function applyColumnMetadata(schemaQuery: SchemaQuery, rawColumn: any): QueryColumn {
    let columnMetadata;
    const metadata = getQueryMetadata();

    // lookup to see if metadata needs to be applied
    if (rawColumn && rawColumn.fieldKey) {
        let allMeta = metadata.getIn(['columnDefaults', rawColumn.fieldKey.toLowerCase()]);

        if (allMeta) {
            allMeta = allMeta.toJS();
        }

        let schemaMeta = metadata.getIn([
            'schema',
            schemaQuery.schemaName.toLowerCase(),
            'columnDefaults',
            rawColumn.fieldKey.toLowerCase(),
        ]);

        if (schemaMeta) {
            schemaMeta = schemaMeta.toJS();
        }

        let columnMeta = metadata.getIn([
            'schema',
            schemaQuery.schemaName.toLowerCase(),
            'query',
            schemaQuery.queryName.toLowerCase(),
            'column',
            rawColumn.fieldKey.toLowerCase(),
        ]);

        if (columnMeta) {
            columnMeta = columnMeta.toJS();
        }

        columnMetadata = Object.assign({}, allMeta, schemaMeta, columnMeta);

        if (columnMetadata) {
            columnMetadata.columnRenderer = Renderers.applyColumnRenderer(columnMetadata, rawColumn, metadata);
            columnMetadata.detailRenderer = Renderers.applyDetailRenderer(columnMetadata, rawColumn, metadata);
            columnMetadata.inputRenderer = Renderers.applyInputRenderer(columnMetadata, rawColumn, metadata);
        }
    }

    return QueryColumn.create(Object.assign({}, rawColumn, columnMetadata));
}

// As of r57235 some column info's are only found on the views "fields" property that were previously
// available in the query info's "columns" property.
function applyViewColumns(
    columns: OrderedMap<string, QueryColumn>,
    schemaQuery: SchemaQuery,
    rawViewInfo: any
): OrderedMap<string, QueryColumn> {
    if (rawViewInfo && rawViewInfo.fields) {
        rawViewInfo.fields.forEach(rawColumn => {
            const fk = rawColumn.fieldKey.toLowerCase();
            if (!columns.has(fk)) {
                columns = columns.set(fk, applyColumnMetadata(schemaQuery, rawColumn));
            }
        });
    }

    return columns;
}

class Parsers {
    static splitCamelCase(value) {
        if (value) {
            return (
                value
                    // insert a space before all caps
                    .replace(/([A-Z])/g, ' $1')
                    // uppercase the first character
                    .replace(/^./, function (str) {
                        return str.toUpperCase();
                    })
                    .trim()
            );
        }

        return value;
    }
}

class Renderers {
    static _check(columnMetadata, rawColumn, field, metadata) {
        if (columnMetadata.conceptURI || rawColumn.conceptURI) {
            const concept = metadata.getIn([
                'concepts',
                columnMetadata.conceptURI
                    ? columnMetadata.conceptURI.toLowerCase()
                    : rawColumn.conceptURI.toLowerCase(),
            ]);

            if (concept) {
                return concept.get(field);
            }
        }

        return undefined;
    }

    static applyColumnRenderer(columnMetadata, rawColumn, metadata) {
        let value = this._check(columnMetadata, rawColumn, 'columnRenderer', metadata);
        const types = Set.of(rawColumn.type.toLowerCase(), rawColumn.friendlyType.toLowerCase());

        if (value === undefined) {
            if (rawColumn.multiValue === true) {
                value = 'MultiValueColumnRenderer';
            } else if (rawColumn.name === 'harvest') {
                value = 'MaterialLookupColumnRenderer';
            } else if (types.contains('file')) {
                value = 'FileColumnRenderer';
            }
        }

        return value;
    }

    static applyDetailRenderer(columnMetadata, rawColumn, metadata) {
        let value = this._check(columnMetadata, rawColumn, 'detailRenderer', metadata);
        if (value === undefined) {
            if (rawColumn.multiValue === true) {
                value = 'MultiValueDetailRenderer';
            }
        }

        return value;
    }

    static applyInputRenderer(columnMetadata, rawColumn, metadata) {
        return this._check(columnMetadata, rawColumn, 'inputRenderer', metadata);
    }
}

export interface ISelectRowsResult {
    key: string;
    models: any;
    orderedModels: List<any>;
    queries: {
        [key: string]: QueryInfo;
    };
    totalRows: number;
    messages?: List<Map<string, string>>;
    caller?: any;
}

// Fetches an API response and normalizes the result JSON according to schema.
// This makes every API response have the same shape, regardless of how nested it was.
export function selectRows(userConfig, caller?): Promise<ISelectRowsResult> {
    return new Promise((resolve, reject) => {
        let schemaQuery, key;
        if (userConfig.queryName) {
            schemaQuery = SchemaQuery.create(userConfig.schemaName, userConfig.queryName);
            key = resolveSchemaQuery(schemaQuery);
        }

        let hasDetails = false;
        let details;
        let hasResults = false;
        let result;

        function doResolve() {
            if (hasDetails && hasResults) {
                if (key !== result.key) {
                    console.warn(
                        `Mismatched keys between query and model results. query: "${key}", model: "${result.key}".`
                    );
                    key = result.key; // default to model key
                }
                resolve(
                    Object.assign(
                        {},
                        {
                            key,
                            models: result.models,
                            orderedModels: result.orderedModels,
                            queries: {
                                [key]: details,
                            },
                            totalRows: result.rowCount, // TODO: Why do we rename rowCount to totalRows? Seems unnecessary.
                            messages: result.messages,
                            caller,
                        }
                    )
                );
            }
        }

        if (userConfig.hasOwnProperty('sql')) {
            Query.executeSql(
                Object.assign({}, userConfig, {
                    method: 'POST',
                    requiredVersion: 17.1,
                    sql: userConfig.sql,
                    saveInSession: userConfig.saveInSession === true,
                    success: json => {
                        handle132Response(json).then(r => {
                            schemaQuery = SchemaQuery.create(userConfig.schemaName, json.queryName);
                            key = resolveSchemaQuery(schemaQuery);
                            result = r;
                            hasResults = true;

                            getQueryDetails(schemaQuery)
                                .then(d => {
                                    hasDetails = true;
                                    details = d;
                                    doResolve();
                                })
                                .catch(error => reject(error));
                        });
                    },
                    failure: (data, request) => {
                        reject({
                            exceptionClass: data.exceptionClass,
                            message: data.exception,
                            status: request.status,
                        });
                    },
                })
            );
        } else {
            Query.selectRows(
                Object.assign({}, userConfig, {
                    requiredVersion: 17.1,
                    filterArray: userConfig.filterArray,
                    method: 'POST',
                    // put on this another parameter!
                    columns: userConfig.columns ? userConfig.columns : '*',
                    success: json => {
                        handle132Response(json).then(r => {
                            result = r;
                            hasResults = true;
                            doResolve();
                        });
                    },
                    failure: (data, request) => {
                        reject({
                            exceptionClass: data.exceptionClass,
                            message: data.exception,
                            schemaQuery,
                            status: request.status,
                        });
                    },
                })
            );

            getQueryDetails(userConfig)
                .then(d => {
                    hasDetails = true;
                    details = d;
                    doResolve();
                })
                .catch(error => reject(error));
        }
    });
}

export function handle132Response(json): Promise<any> {
    // TODO: Don't make this a promise. The only async thing this method does is call urlResolver.resolveSelectRows,
    //  which is a promise, but also does not need to be, nor should be.
    return new Promise(resolve => {
        const urlResolver = new URLResolver();
        urlResolver.resolveSelectRows(json).then(resolved => {
            let count = 0,
                hasRows = false,
                models = {}, // TODO: Switch to Map
                orderedModels = {},
                qsKey = 'queries',
                rowCount = json.rowCount || 0;

            const metadataKey = resolved.metaData.id,
                modelKey = resolveKeyFromJson(resolved);

            // ensure id -- unfortunately, with normalizr 3.x there doesn't seem to be a way to generate the id
            // without attaching directly to the object
            resolved.rows.forEach((row: any) => {
                if (metadataKey) {
                    if (row[metadataKey] !== undefined) {
                        row._id_ = row[metadataKey].value;
                        return;
                    } else {
                        console.error('Missing entry', metadataKey, row, resolved.schemaKey, resolved.queryName);
                    }
                }
                row._id_ = count++;
            });

            const modelSchema = new schema.Entity(
                modelKey,
                {},
                {
                    idAttribute: '_id_',
                }
            );

            const querySchema = new schema.Entity(
                qsKey,
                {},
                {
                    idAttribute: queryJson => resolveKeyFromJson(queryJson),
                }
            );

            querySchema.define({
                rows: new schema.Array(modelSchema),
            });

            const instance = normalize(resolved, querySchema);

            Object.keys(instance.entities).forEach(key => {
                if (key !== qsKey) {
                    rowCount = instance.entities[qsKey][key].rowCount;
                    const rows = instance.entities[key];
                    // cleanup generated ids
                    Object.keys(rows).forEach(rowKey => {
                        delete rows[rowKey]['_id_'];
                    });
                    models[key] = rows;
                    orderedModels[key] = fromJS(instance.entities[qsKey][key].rows)
                        .map(r => r.toString())
                        .toList();
                    hasRows = true;
                }
            });

            if (!hasRows) {
                models[modelKey] = {};
                orderedModels[modelKey] = List();
            }

            const messages = resolved.messages ? fromJS(resolved.messages) : List<Map<string, string>>();

            resolve({
                key: modelKey,
                messages,
                models,
                orderedModels,
                rowCount,
            });
        });
    });
}

export function searchRows(selectRowsConfig, token: any, exactColumn?: string): Promise<ISelectRowsResult> {
    return new Promise((resolve, reject) => {
        let exactFilters, qFilters;
        const baseFilters = selectRowsConfig.filterArray ? selectRowsConfig.filterArray : [];
        const maxRows = selectRowsConfig.maxRows !== undefined ? selectRowsConfig.maxRows : 100000;

        if (token) {
            if (exactColumn) {
                exactFilters = [Filter.create(exactColumn, token)].concat(baseFilters);
            }

            qFilters = [Filter.create('*', token, Filter.Types.Q)].concat(baseFilters);
        } else {
            qFilters = baseFilters;
        }

        const selects = [
            selectRows(
                Object.assign({}, selectRowsConfig, {
                    filterArray: qFilters,
                })
            ),
        ];

        if (exactFilters) {
            selects.push(
                selectRows(
                    Object.assign({}, selectRowsConfig, {
                        filterArray: exactFilters,
                    })
                )
            );
        }

        return Promise.all(selects)
            .then(allResults => {
                const [queryResults, exactResults] = allResults;

                let finalResults;
                if (exactResults && exactResults.totalRows > 0) {
                    finalResults = exactResults;

                    // TODO: This can cause the "totalRows" to be incorrect. Ideally, keep track of changes to give accurate count
                    if (finalResults.totalRows < maxRows) {
                        const { key } = finalResults;
                        const finalKeySet = finalResults.orderedModels[key].toOrderedSet().asMutable();

                        queryResults.orderedModels[key].forEach(key => {
                            finalKeySet.add(key);

                            if (finalKeySet.size >= maxRows) {
                                return false;
                            }
                        });

                        finalKeySet.forEach(rowKey => {
                            if (!finalResults.models[key].hasOwnProperty(rowKey)) {
                                finalResults.orderedModels[key] = finalResults.orderedModels[key].push(rowKey);
                                finalResults.models[key][rowKey] = queryResults.models[key][rowKey];
                            }
                        });
                    }
                } else {
                    finalResults = queryResults;
                }

                resolve(finalResults);
            })
            .catch(reason => {
                reject(reason);
            });
    });
}

interface ErrorMessage {
    // msg: string // Duplicate
    message: string;
}

interface InsertRowError {
    errors: ErrorMessage[];
}

export class InsertRowsErrorResponse extends Record({
    errors: undefined,
    errorCount: 0,
    exception: undefined,
    extraContext: undefined,
    success: false,
}) {
    errors: InsertRowError[];
    errorCount: number;
    exception: string;
    extraContext: any;
    success: boolean;

    getErrorMessage() {
        return this.exception; // TODO make this more user friendly by including row number and excluding techincal details
    }
}

export interface InsertRowsOptions {
    fillEmptyFields?: boolean;
    rows: List<any>;
    schemaQuery: SchemaQuery;
    auditBehavior?: AuditBehaviorTypes;
    auditUserComment?: string;
}

export class InsertRowsResponse extends Record({
    rows: Array<any>(),
    schemaQuery: undefined,
    error: undefined,
}) {
    rows: any[];
    schemaQuery: SchemaQuery;
    error: InsertRowsErrorResponse;

    getFilter(): Filter.IFilter {
        const rowIds = [];

        // insertRows returns properties with differing case
        this.rows
            .map(row => caseInsensitive(row, 'rowId'))
            .forEach(rowId => {
                if (rowId !== undefined) {
                    rowIds.push(rowId);
                }
            });

        return Filter.create('RowId', rowIds, Filter.Types.IN);
    }
}

export function insertRows(options: InsertRowsOptions): Promise<InsertRowsResponse> {
    return new Promise((resolve, reject) => {
        const { fillEmptyFields, rows, schemaQuery, auditBehavior, auditUserComment } = options;
        const _rows = fillEmptyFields === true ? ensureAllFieldsInAllRows(rows) : rows;

        Query.insertRows({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            rows: _rows.toArray(),
            auditBehavior,
            auditUserComment,
            apiVersion: 13.2,
            success: response => {
                resolve(
                    new InsertRowsResponse({
                        schemaQuery,
                        rows: response.rows,
                    })
                );
            },
            failure: error => {
                console.error(error);
                reject(
                    new InsertRowsResponse({
                        schemaQuery,
                        error,
                    })
                );
            },
        });
    });
}

// Ensures that the List of row objects are fully (as opposed to sparsely) populated. This avoids the server
// failing to map columns on sparsely populated data sets.
// As an example:
//
// [
//     {},
//     {"columnA": "AA"},
//     {"columnD": "DD"}
// ]
//
// becomes:
//
// [
//     {"columnA": null, "columnD": null},
//     {"columnA": "AA", "columnD": null},
//     {"columnA": null, "columnD": "DD"}
// ]
function ensureAllFieldsInAllRows(rows: List<any>): List<any> {
    let masterRecord = Map<string, any>().asMutable();

    rows.forEach(row => {
        row.keySeq().forEach(key => {
            masterRecord.set(key, null);
        });
    });

    masterRecord = masterRecord.asImmutable();

    return rows.reduce(
        (allFieldRows, row) => allFieldRows.push(ensureNullForUndefined(masterRecord.merge(row))),
        List<Map<string, any>>()
    );
}

// undefined is not a valid JSON value so the values must be mapped to null.
function ensureNullForUndefined(row: Map<string, any>): Map<string, any> {
    return row.reduce((map, v, k) => map.set(k, v === undefined ? null : v), Map<string, any>());
}

interface IUpdateRowsOptions {
    containerPath?: string;
    schemaQuery: SchemaQuery;
    rows: any[];
    auditBehavior?: AuditBehaviorTypes;
    auditUserComment?: string;
}

export function updateRows(options: IUpdateRowsOptions): Promise<any> {
    return new Promise((resolve, reject) => {
        Query.updateRows({
            containerPath: options.containerPath ? options.containerPath : LABKEY.container.path,
            schemaName: options.schemaQuery.schemaName,
            queryName: options.schemaQuery.queryName,
            rows: options.rows,
            auditBehavior: options.auditBehavior,
            auditUserComment: options.auditUserComment,
            success: response => {
                resolve(
                    Object.assign(
                        {},
                        {
                            schemaQuery: options.schemaQuery,
                            rows: response.rows,
                        }
                    )
                );
            },
            failure: error => {
                reject(
                    Object.assign(
                        {},
                        {
                            schemaQuery: options.schemaQuery,
                        },
                        error
                    )
                );
            },
        });
    });
}

interface DeleteRowsOptions {
    schemaQuery: SchemaQuery;
    rows: any[];
    auditBehavior?: AuditBehaviorTypes;
    auditUserComment?: string;
}

export function deleteRows(options: DeleteRowsOptions): Promise<any> {
    return new Promise((resolve, reject) => {
        Query.deleteRows({
            schemaName: options.schemaQuery.schemaName,
            queryName: options.schemaQuery.queryName,
            rows: options.rows,
            auditBehavior: options.auditBehavior,
            auditUserComment: options.auditUserComment,
            apiVersion: 13.2,
            success: () => {
                resolve(
                    Object.assign(
                        {},
                        {
                            schemaQuery: options.schemaQuery,
                        }
                    )
                );
            },
            failure: error => {
                reject(
                    Object.assign(
                        {},
                        {
                            schemaQuery: options.schemaQuery,
                        },
                        error
                    )
                );
            },
        });
    });
}

export enum InsertOptions {
    IMPORT,
    MERGE,
}

export enum InsertFormats {
    tsv = 'tsv',
    csv = 'csv',
}

export interface IImportData {
    schemaName: string;
    queryName: string;
    file?: File; // must contain file or text but not both
    format?: InsertFormats;
    text?: string;
    insertOption?: string;
    importLookupByAlternateKey?: boolean;
    saveToPipeline?: boolean;
    importUrl?: string;
}

export function importData(config: IImportData): Promise<any> {
    return new Promise((resolve, reject) => {
        QueryDOM.importData(
            Object.assign({}, config, {
                success: response => {
                    if (response && response.exception) {
                        reject(response);
                    }
                    resolve(response);
                },
                failure: error => {
                    reject(error);
                },
            })
        );
    });
}
