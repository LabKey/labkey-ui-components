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
import { List, Map, OrderedMap } from 'immutable';
import { Ajax, Assay, AssayDOM, Filter, Utils } from '@labkey/api';

import {
    AssayDefinitionModel,
    AssayStateModel,
    buildURL,
    getQueryGridModel,
    getStateQueryGridModel,
    naturalSortByProperty,
    QueryColumn,
    QueryGridModel,
    SCHEMAS,
    SchemaQuery,
    QueryModel,
} from '../../..';

import { AssayUploadTabs } from '../../constants';

import { AssayUploadResultModel } from './models';
import { IAssayUploadOptions } from './AssayWizardModel';

export const GENERAL_ASSAY_PROVIDER_NAME = 'General';

export const RUN_PROPERTIES_GRID_ID = 'assay-run-details';

export const RUN_PROPERTIES_REQUIRED_COLUMNS = SCHEMAS.CBMB.concat(
    'Name',
    'RowId',
    'ReplacesRun',
    'ReplacedByRun',
    'DataOutputs',
    'DataOutputs/DataFileUrl',
    'Batch'
).toList();

let assayDefinitionCache: { [key: string]: Promise<List<AssayDefinitionModel>> } = {};

export function clearAssayDefinitionCache(): void {
    assayDefinitionCache = {};
}

export function fetchAllAssays(type?: string): Promise<List<AssayDefinitionModel>> {
    const key = type ?? 'undefined';

    if (!assayDefinitionCache[key]) {
        assayDefinitionCache[key] = new Promise((res, rej) => {
            Assay.getAll({
                parameters: { type },
                success: (rawModels: any[]) => {
                    const models = rawModels.reduce(
                        (list, raw) => list.push(AssayDefinitionModel.create(raw)),
                        List<AssayDefinitionModel>()
                    );
                    res(models);
                },
                failure: error => {
                    rej(error);
                },
            });
        });
    }

    return assayDefinitionCache[key];
}

export function importAssayRun(config: Partial<AssayDOM.IImportRunOptions>): Promise<AssayUploadResultModel> {
    return new Promise((resolve, reject) => {
        AssayDOM.importRun(
            Object.assign({}, config, {
                success: (rawModel: any) => {
                    resolve(new AssayUploadResultModel(rawModel));
                },
                failure: error => {
                    reject(error);
                },
            })
        );
    });
}

export function uploadAssayRunFiles(data: IAssayUploadOptions): Promise<IAssayUploadOptions> {
    return new Promise((resolve, reject) => {
        const batchProperties = data.batchProperties;
        const runProperties = data.properties;
        const batchFiles = collectFiles(batchProperties);
        const runFiles = collectFiles(runProperties);
        let maxFileSize = 0; // return the largest file size, used to determine if async mode should be used

        const maxRowCount = Array.isArray(data.dataRows) ? data.dataRows.length : undefined;
        if (data.files) {
            data.files.forEach(file => {
                if (file.size > maxFileSize) {
                    maxFileSize = file.size;
                }
            });
        }

        if (Utils.isEmptyObj(batchFiles) && Utils.isEmptyObj(runFiles)) {
            // No files in the data, so just go ahead and resolve so we run the import.
            resolve({ ...data, maxRowCount, maxFileSize });
            return;
        }

        // If we're this far along we've got files so let's process them.
        let fileCounter = 0;
        const formData = new FormData();
        const fileNameMap = {}; // Maps the file name "fileN" to the run/batch property it belongs to.

        // TODO factor this out so the code isn't duplicate below for the runFiles case
        Object.keys(batchFiles).forEach(columnName => {
            const name = fileCounter === 0 ? 'file' : `file${fileCounter}`;
            const file = batchFiles[columnName];
            if (file.size > maxFileSize) {
                maxFileSize = file.size;
            }
            fileNameMap[name] = {
                columnName,
                origin: 'batch',
            };
            formData.append(name, file);
            fileCounter++;
        });

        Object.keys(runFiles).forEach(columnName => {
            const name = fileCounter === 0 ? 'file' : `file${fileCounter}`;
            const file = runFiles[columnName];
            if (file.size > maxFileSize) {
                maxFileSize = file.size;
            }
            fileNameMap[name] = {
                columnName,
                origin: 'run',
            };
            formData.append(name, file);
            fileCounter++;
        });

        // N.B. assayFileUpload's success response is not handled well by Utils.getCallbackWrapper.
        Ajax.request({
            url: buildURL('assay', 'assayFileUpload.view'),
            method: 'POST',
            form: formData,
            success: result => {
                let response = JSON.parse(result.responseText);
                const batchPaths = {};
                const runPaths = {};

                if (fileCounter === 1) {
                    // Make the single file response look like the multi-file response.
                    response = {
                        file: response,
                    };
                }

                // Only process attributes that start with file so we ignore all the other stuff in the response like
                // the "success" attribute.
                Object.keys(response)
                    .filter(key => key.startsWith('file'))
                    .forEach(key => {
                        const { columnName, origin } = fileNameMap[key];

                        if (origin === 'batch') {
                            batchPaths[columnName] = response[key].absolutePath;
                        } else if (origin === 'run') {
                            runPaths[columnName] = response[key].absolutePath;
                        }
                    });

                resolve({
                    ...data,
                    batchProperties: {
                        ...data.batchProperties,
                        ...batchPaths,
                    },
                    properties: {
                        ...data.properties,
                        ...runPaths,
                    },
                    maxRowCount,
                    maxFileSize,
                });
            },
            failure: Utils.getCallbackWrapper(error => {
                // As far as I can tell errors returned from assay FileUpload are only ever strings.
                const message = `Error while uploading files: ${error}`;
                reject({ message });
            }),
        });
    });
}

interface FileMap {
    [s: string]: File;
}

function collectFiles(source): FileMap {
    return Object.keys(source).reduce((files, key) => {
        const item = source[key];

        if (item instanceof File) {
            files[key] = item;
        }

        return files;
    }, {} as FileMap);
}

export function deleteAssayRuns(
    selectionKey?: string,
    rowId?: string,
    cascadeDeleteReplacedRuns = false
): Promise<any> {
    return new Promise((resolve, reject) => {
        const params = selectionKey ? { dataRegionSelectionKey: selectionKey } : { singleObjectRowId: rowId };
        params['cascade'] = cascadeDeleteReplacedRuns;

        return Ajax.request({
            url: buildURL('experiment', 'deleteRuns.api'),
            method: 'POST',
            params,
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

export function getImportItemsForAssayDefinitionsQM(
    assayStateModel: AssayStateModel,
    sampleModel?: QueryModel,
    providerType?: string
): OrderedMap<AssayDefinitionModel, string> {
    let targetSQ;
    const selectionKey = sampleModel?.id;

    if (sampleModel?.queryInfo) {
        targetSQ = sampleModel.queryInfo.schemaQuery;
    }

    return assayStateModel.definitions
        .filter(assay => providerType === undefined || assay.type === providerType)
        .filter(assay => !targetSQ || assay.hasLookup(targetSQ))
        .sort(naturalSortByProperty('name'))
        .reduce((items, assay) => {
            const href = assay.getImportUrl(
                selectionKey ? AssayUploadTabs.Grid : AssayUploadTabs.Files,
                selectionKey,
                // Check for the existence of the "queryInfo" before getting filters from the model.
                // This avoids `QueryModel` throwing an error when the "queryInfo" is not yet available.
                sampleModel?.queryInfo ? List(sampleModel.filters) : undefined
            );
            return items.set(assay, href);
        }, OrderedMap<AssayDefinitionModel, string>());
}

export function getImportItemsForAssayDefinitions(
    assayStateModel: AssayStateModel,
    sampleModel?: QueryGridModel,
    providerType?: string
): OrderedMap<AssayDefinitionModel, string> {
    let targetSQ;
    const selectionKey = sampleModel?.selectionKey;

    if (sampleModel?.queryInfo) {
        targetSQ = sampleModel.queryInfo.schemaQuery;
    }

    return assayStateModel.definitions
        .filter(assay => providerType === undefined || assay.type === providerType)
        .filter(assay => !targetSQ || assay.hasLookup(targetSQ))
        .sort(naturalSortByProperty('name'))
        .reduce((items, assay) => {
            const href = assay.getImportUrl(
                selectionKey ? AssayUploadTabs.Grid : AssayUploadTabs.Files,
                selectionKey,
                sampleModel?.getFilters()
            );
            return items.set(assay, href);
        }, OrderedMap<AssayDefinitionModel, string>());
}

export interface DuplicateFilesResponse {
    duplicate: boolean;
    newFileNames: List<string>;
    runNamesPerFile: List<string>;
}

export function checkForDuplicateAssayFiles(fileNames: string[]): Promise<DuplicateFilesResponse> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('assay', 'assayFileDuplicateCheck.api'),
            method: 'POST',
            jsonData: {
                fileNames,
            },
            success: Utils.getCallbackWrapper(res => {
                resolve(res);
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error('Problem checking for duplicate files', response);
                reject(response);
            }),
        });
    });
}

export function getRunPropertiesModel(
    assayDefinition: AssayDefinitionModel,
    runId: string,
    props?: any
): QueryGridModel {
    let initProps = {
        allowSelection: false,
        requiredColumns: RUN_PROPERTIES_REQUIRED_COLUMNS,
        // allow for the possibility of viewing runs that have been replaced.
        baseFilters: List([Filter.create('Replaced', undefined, Filter.Types.NONBLANK)]),
    };
    if (props) {
        initProps = { ...initProps, ...props };
    }
    const model = getStateQueryGridModel(
        RUN_PROPERTIES_GRID_ID,
        SchemaQuery.create(assayDefinition.protocolSchemaName, 'Runs'),
        initProps,
        runId
    );

    return getQueryGridModel(model.getId()) || model;
}

/**
 * N.B. Because the schema name for assay queries includes the assay type and name (e.g., assay.General.GPAT 1),
 * we are not currently equipped to handle this in the application metadata defined in App/constants.ts.
 */
export function getRunDetailsQueryColumns(runPropertiesModel: QueryGridModel, rerunSupport: string): List<QueryColumn> {
    let columns = runPropertiesModel.getDisplayColumns();

    const includeRerunColumns = rerunSupport === 'ReRunAndReplace';
    const replacedByIndex = columns.findIndex(col => col.fieldKey === 'ReplacedByRun');
    if (replacedByIndex > -1) {
        if (includeRerunColumns) {
            columns = columns.set(
                replacedByIndex,
                columns.get(replacedByIndex).set('detailRenderer', 'assayrunreference') as QueryColumn
            );
        } else {
            columns = columns.delete(replacedByIndex);
        }
    }

    if (includeRerunColumns) {
        // add "replaces" field just after "replaced by"
        const replaces = runPropertiesModel.getColumn('ReplacesRun');
        if (replaces) {
            columns = columns.insert(
                replacedByIndex > -1 ? replacedByIndex + 1 : columns.size,
                replaces.set('detailRenderer', 'assayrunreference') as QueryColumn
            );
        }
    }

    return columns;
}

export function getRunPropertiesFileName(row: Map<string, any>): string {
    const dataOutputs = row?.get('DataOutputs');
    return dataOutputs && dataOutputs.size === 1 ? dataOutputs.getIn([0, 'displayValue']) : undefined;
}

export function getRunPropertiesRow(assayDefinition: AssayDefinitionModel, runId: string): Map<string, any> {
    const model = getRunPropertiesModel(assayDefinition, runId);
    return model.isLoaded ? model.getRow() : undefined;
}

export function getBatchPropertiesModel(assayDefinition: AssayDefinitionModel, batchId: string): QueryGridModel {
    if (!batchId) {
        return undefined;
    }

    const model = getStateQueryGridModel(
        'assay-batchdetails',
        SchemaQuery.create(assayDefinition.protocolSchemaName, 'Batches'),
        {
            allowSelection: false,
            requiredColumns: SCHEMAS.CBMB.concat('Name', 'RowId').toList(),
        },
        batchId
    );

    return getQueryGridModel(model.getId()) || model;
}

export function getBatchPropertiesRow(assayDefinition: AssayDefinitionModel, batchId: string): Map<string, any> {
    const model = getBatchPropertiesModel(assayDefinition, batchId);
    return model && model.isLoaded ? model.getRow() : undefined;
}

export function flattenQueryGridModelRow(rowData: Map<string, any>): Map<string, any> {
    if (rowData) {
        // TODO make the consumers of this row data able to handle the queryData instead of
        // having to create the key -> value map via reduction.
        return rowData.reduce((map, v, k) => {
            let valueMap = v;
            if (List.isList(v)) {
                if (v.size > 1) {
                    console.warn("Multiple values for field '" + k + "'.  Using the last.");
                }
                valueMap = v.get(v.size - 1);
            }
            if (valueMap && valueMap.has('value') && valueMap.get('value')) {
                return map.set(k, valueMap.get('value').toString());
            }
            return map;
        }, Map<string, any>());
    }

    return Map<string, any>();
}

export function deleteAssayDesign(rowId: string): Promise<any> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', 'deleteProtocolByRowIdsAPI.api'),
            method: 'POST',
            params: {
                singleObjectRowId: rowId,
                forceDelete: true,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}
