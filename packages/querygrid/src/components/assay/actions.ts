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
import { List, OrderedMap } from 'immutable'
import { ActionURL, Ajax, Utils, AssayDOM } from '@labkey/api'
import {
    AssayDefinitionModel,
    AssayUploadTabs,
    buildURL,
    naturalSort,
    QueryGridModel,
    SchemaQuery
} from '@glass/base'

import { AssayUploadResultModel, IAssayUploadOptions } from './models'

export function importAssayRun(config: AssayDOM.IImportRunOptions): Promise<AssayUploadResultModel> {
    return new Promise((resolve, reject) => {
        AssayDOM.importRun(Object.assign({}, config, {
            success: (rawModel: any) => {
                resolve(new AssayUploadResultModel(rawModel));
            },
            failure: (error) => {
                reject(error);
            }
        }));
    });
}

export function uploadAssayRunFiles(data: IAssayUploadOptions): Promise<IAssayUploadOptions> {
    return new Promise((resolve, reject) => {
        const batchProperties = data.batchProperties;
        const runProperties = data.properties;
        const batchFiles = collectFiles(batchProperties);
        const runFiles = collectFiles(runProperties);

        if (Utils.isEmptyObj(batchFiles) && Utils.isEmptyObj(runFiles)) {
            // No files in the data, so just go ahead and resolve so we run the import.
            resolve(data);
            return;
        }

        // If we're this far along we've got files so let's process them.
        let fileCounter = 0;
        const formData = new FormData();
        const fileNameMap = {}; // Maps the file name "fileN" to the run/batch property it belongs to.

        // TODO factor this out so the code isn't duplicate below for the runFiles case
        Object.keys(batchFiles).forEach((columnName) => {
            const name = fileCounter === 0 ? 'file' : `file${fileCounter}`;
            const file = batchFiles[columnName];
            fileNameMap[name] = {
                columnName,
                origin: 'batch',
            };
            formData.append(name, file);
            fileCounter++;
        });

        Object.keys(runFiles).forEach((columnName) => {
            const name = fileCounter === 0 ? 'file' : `file${fileCounter}`;
            const file = runFiles[columnName];
            fileNameMap[name] = {
                columnName,
                origin: 'run',
            };
            formData.append(name, file);
            fileCounter++;
        });

        Ajax.request({
            url: ActionURL.buildURL('assay', 'assayFileUpload.view'),
            method: 'POST',
            form: formData,
            success: (result) => {
                let response = JSON.parse(result.responseText);
                const batchPaths = {};
                const runPaths = {};

                if (fileCounter === 1) {
                    // Make the single file response look like the multi-file response.
                    response = {
                        'file': response,
                    };
                }

                // Only process attributes that start with file so we ignore all the other stuff in the response like
                // the "success" attribute.
                Object.keys(response).filter(key => key.startsWith('file')).forEach(key => {
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
                    }
                })
            },
            failure: (resp) => {
                // As far as I can tell errors returned from assay FileUpload are only ever strings.
                const message = `Error while uploading files: ${resp.responseText}`;
                reject({message});
            }
        });
    });
}

interface FileMap
{
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


export function deleteAssayRuns(selectionKey?: string, rowId?: string) : Promise<any> {
    return new Promise((resolve, reject) => {
        const params = selectionKey ? {'dataRegionSelectionKey': selectionKey} : {singleObjectRowId: rowId};
        return Ajax.request({
            url: buildURL('experiment', 'deleteRuns.api'),
            method: 'POST',
            params,
            success: Utils.getCallbackWrapper((response) => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response);
            }),
        });
    });
}

export function getImportItemsForAssayDefinitions(assayDefModels: List<AssayDefinitionModel>, sampleModel: QueryGridModel): OrderedMap<AssayDefinitionModel, string> {
    let items = OrderedMap<AssayDefinitionModel, string>();
    let targetSQ = undefined;

    let selectionKey = undefined;
    if (sampleModel && sampleModel.queryInfo) {
        const singleSelect = sampleModel.keyValue !== undefined;
        targetSQ = sampleModel.queryInfo.schemaQuery;
        selectionKey = singleSelect ? SchemaQuery.createAppSelectionKey(targetSQ, [sampleModel.keyValue]) : sampleModel.getId()
    }

    assayDefModels
        .sortBy(a => a.name, naturalSort)
        .filter((assay) => !targetSQ || assay.hasLookup(targetSQ))
        .forEach((assay) => {
            const href = assay.getImportUrl(selectionKey ? AssayUploadTabs.Grid : AssayUploadTabs.Files, selectionKey);
            items = items.set(assay, href);
        });

    return items;
}


export interface DuplicateFilesResponse {
    duplicate: boolean
    newFileNames: List<string>
    runNamesPerFile: List<string>
}

export function checkForDuplicateAssayFiles(fileNames: Array<string>) : Promise<DuplicateFilesResponse> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('assay', 'assayFileDuplicateCheck.api'),
            method: 'POST',
            jsonData: {
                fileNames,
            },
            success: Utils.getCallbackWrapper((res) => {
                resolve(res);
            }),
            failure: Utils.getCallbackWrapper((response) => {
                console.error("Problem checking for duplicate files", response);
                reject(response);
            }),
        });
    });
}