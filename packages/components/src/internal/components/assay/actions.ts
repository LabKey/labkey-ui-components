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
import { Ajax, Assay, AssayDOM, Utils } from '@labkey/api';

import { AssayUploadTabs } from '../../constants';

import { SCHEMAS } from '../../schemas';
import { User } from '../base/models/User';
import { AssayDefinitionModel, AssayDomainTypes } from '../../AssayDefinitionModel';
import { buildURL } from '../../url/AppURL';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { naturalSortByProperty } from '../../../public/sort';
import { caseInsensitive } from '../../util/utils';

import { IAssayUploadOptions } from './AssayWizardModel';
import { AssayStateModel, AssayUploadResultModel } from './models';

export const GENERAL_ASSAY_PROVIDER_NAME = 'General';

export const RUN_PROPERTIES_REQUIRED_COLUMNS = SCHEMAS.CBMB.concat(
    'Name',
    'RowId',
    'ReplacesRun',
    'ReplacedByRun',
    'DataOutputs',
    'DataOutputs/DataFileUrl',
    'Batch',
    'Folder',
    // Below Columns are required for us to render the WorkflowTask in EditableDetails components
    'WorkflowTask',
    'WorkflowTask/Run',
    'Protocol/RowId'
).toList();

/**
 * Only support option to re-import run if user has insert permissions in current container
 * and the current container is where the source run is located. This prevents runs from being
 * re-imported "up" or "down" the folder structure.
 */
export function allowReimportAssayRun(user: User, runContainerId: string, targetContainerId: string): boolean {
    return (
        !!runContainerId && !!targetContainerId && targetContainerId === runContainerId && user.hasInsertPermission()
    );
}

let assayDefinitionCache: { [key: string]: Promise<List<AssayDefinitionModel>> } = {};

export function clearAssayDefinitionCache(): void {
    assayDefinitionCache = {};
}

export function fetchAllAssays(type?: string, containerPath?: string): Promise<List<AssayDefinitionModel>> {
    const key = [type ?? 'undefined', containerPath ?? 'undefined'].join('|');

    if (!assayDefinitionCache[key]) {
        assayDefinitionCache[key] = new Promise((res, rej) => {
            Assay.getAll({
                containerPath,
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
        const batchFiles = collectFiles(data.batchProperties);
        const runFiles = collectFiles(data.properties);
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

function collectFiles(source: Record<string, any>): FileMap {
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
    rowIds?: string[],
    cascadeDeleteReplacedRuns = false,
    containerPath?: string
): Promise<any> {
    return new Promise((resolve, reject) => {
        const jsonData: any = selectionKey ? { dataRegionSelectionKey: selectionKey } : { rowIds };
        jsonData.cascade = cascadeDeleteReplacedRuns;

        return Ajax.request({
            url: buildURL('experiment', 'deleteRuns.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData,
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

export function getImportItemsForAssayDefinitions(
    assayStateModel: AssayStateModel,
    sampleModel?: QueryModel,
    providerType?: string,
    isPicklist?: boolean,
    currentProductId?: string,
    targetProductId?: string,
    ignoreFilter?: boolean
): OrderedMap<AssayDefinitionModel, string> {
    let targetSQ;
    const selectionKey = sampleModel?.id;

    if (sampleModel?.queryInfo) {
        targetSQ = sampleModel.queryInfo.schemaQuery;
    }

    return assayStateModel.definitions
        .filter(assay => providerType === undefined || assay.type === providerType)
        .filter(assay => !targetSQ || assay.hasLookup(targetSQ, isPicklist))
        .sort(naturalSortByProperty('name'))
        .reduce((items, assay) => {
            const href = assay.getImportUrl(
                selectionKey ? AssayUploadTabs.Grid : AssayUploadTabs.Files,
                selectionKey,
                // Check for the existence of the "queryInfo" before getting filters from the model.
                // This avoids `QueryModel` throwing an error when the "queryInfo" is not yet available.
                sampleModel?.queryInfo ? List(sampleModel.filters) : undefined,
                isPicklist,
                currentProductId,
                targetProductId,
                ignoreFilter
            );
            return items.set(assay, href);
        }, OrderedMap<AssayDefinitionModel, string>());
}

export function getAssayDefinitionsWithResultSampleLookup(
    assayStateModel: AssayStateModel,
    providerType?: string,
    allowPicklist?: boolean
): { [key: string]: string } {
    const assays = assayStateModel.definitions.filter(
        assay => providerType === undefined || assay.type?.toLowerCase() === providerType?.toLowerCase()
    );

    const results = {};
    assays.forEach(assay => {
        const sampleCol = assay.getSampleLookupColumn(AssayDomainTypes.RESULT, allowPicklist);
        if (sampleCol !== null) results[assay.name] = sampleCol.fieldKey;
    });

    return results;
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

export function getRunPropertiesFileName(row: Record<string, any>): string {
    const dataOutputs = caseInsensitive(row, 'DataOutputs');
    return dataOutputs && dataOutputs.length === 1 ? dataOutputs[0].displayValue : undefined;
}

export function flattenQueryModelRow(rowData: Record<string, any>): Map<string, any> {
    if (rowData) {
        // TODO make the consumers of this row data able to handle the queryData instead of
        // having to create the key -> value map via reduction.
        let map = Map<string, any>();

        Object.keys(rowData).forEach(k => {
            const v = rowData[k];
            let valueMap = v;
            if (Utils.isArray(v)) {
                if (v.length > 1) {
                    console.warn("Multiple values for field '" + k + "'.  Using the last.");
                }
                valueMap = v[v.length - 1];
            }
            if (valueMap && valueMap['value'] !== undefined && valueMap['value'] !== null) {
                map = map.set(k, valueMap['value']);
            }
        });

        return map;
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
