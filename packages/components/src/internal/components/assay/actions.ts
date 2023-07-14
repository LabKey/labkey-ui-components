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
import { List, Map } from 'immutable';
import { Ajax, Assay, AssayDOM, Utils } from '@labkey/api';

import { User } from '../base/models/User';
import { AssayDefinitionModel } from '../../AssayDefinitionModel';
import { buildURL } from '../../url/AppURL';
import { caseInsensitive } from '../../util/utils';

import { AssayUploadOptions } from './AssayWizardModel';
import { AssayUploadResultModel } from './models';

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

type ImportAssayRunOptions = Omit<AssayDOM.ImportRunOptions, 'success' | 'failure' | 'scope'>;

export function importAssayRun(config: ImportAssayRunOptions): Promise<AssayUploadResultModel> {
    return new Promise((resolve, reject) => {
        AssayDOM.importRun({
            ...config,
            success: rawModel => {
                resolve(new AssayUploadResultModel(rawModel));
            },
            failure: error => {
                console.error('Failed to import assay run', error);
                reject(error);
            },
        });
    });
}

export function uploadAssayRunFiles(data: AssayUploadOptions): Promise<AssayUploadOptions> {
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
