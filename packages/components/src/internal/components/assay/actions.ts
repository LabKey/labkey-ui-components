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
import { ActionURL, Ajax, Assay, AssayDOM, Filter, Utils } from '@labkey/api';

import { User } from '../base/models/User';
import { AssayDefinitionModel } from '../../AssayDefinitionModel';
import { buildURL } from '../../url/AppURL';
import { caseInsensitive, handleRequestFailure } from '../../util/utils';

import { AssayProtocolModel } from '../domainproperties/assay/models';

import { QueryColumn } from '../../../public/QueryColumn';

import { SCHEMAS } from '../../schemas';
import { getSelection } from '../../actions';
import { fetchSamples } from '../samples/actions';
import { getSelectedPicklistSamples } from '../picklist/actions';

import { AssayUploadURLSearchParam, AssayUploadResultModel } from './models';
import { AssayUploadOptions } from './AssayWizardModel';

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

let assayDefinitionCache: { [key: string]: Promise<AssayDefinitionModel[]> } = {};
let protocolCache: Record<string, Promise<AssayProtocolModel>> = {};

export function clearAssayDefinitionCache(): void {
    assayDefinitionCache = {};
    protocolCache = {};
}

export type GetAssayDefinitionsOptions = Omit<Assay.GetAssaysOptions, 'failure' | 'parameters' | 'scope' | 'success'>;

export function getAssayDefinitions(options: GetAssayDefinitionsOptions): Promise<AssayDefinitionModel[]> {
    const key = [
        options.containerPath,
        options.id,
        options.name,
        options.plateEnabled,
        options.status,
        options.type,
    ].join('|');

    if (!assayDefinitionCache[key]) {
        assayDefinitionCache[key] = new Promise((resolve, reject) => {
            Assay.getAssays({
                ...options,
                success: rawModels => {
                    resolve(rawModels.map(raw => AssayDefinitionModel.create(raw)) ?? []);
                },
                failure: error => {
                    reject(error);
                },
            });
        });
    }

    return assayDefinitionCache[key];
}

export type GetProtocolOptions = {
    containerPath?: string;
    copy?: boolean;
    protocolId?: number;
    providerName?: string;
};

export function getProtocol(options: GetProtocolOptions): Promise<AssayProtocolModel> {
    const { copy = false, containerPath, protocolId, providerName } = options;
    const key = [copy, containerPath, protocolId, providerName].join('|').toLowerCase();

    // Issue 49922: Cache assay protocol requests
    if (!protocolCache[key]) {
        protocolCache[key] = new Promise((resolve, reject) => {
            const params: Record<string, any> = { copy, protocolId };

            // give precedence to the protocolId if both are provided
            if (protocolId === undefined) {
                params.providerName = providerName;
            }

            Ajax.request({
                url: ActionURL.buildURL('assay', 'getProtocol.api', containerPath, params),
                success: Utils.getCallbackWrapper(data => {
                    resolve(AssayProtocolModel.create(data.data));
                }),
                failure: handleRequestFailure(reject, 'Failed to load assay protocol'),
            });
        });
    }

    return protocolCache[key];
}

export type ImportAssayRunOptions = Omit<AssayDOM.ImportRunOptions, 'success' | 'failure' | 'scope'>;

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

/**
 * Loads a collection of RowIds from a selectionKey found on "location". Uses [[fetchSamples]] to query and filter
 * the Sample Set data.
 * @param searchParams The URLSearchParams to search for the selectionKey on
 * @param sampleColumn A QueryColumn used to map data in [[fetchSamples]]
 * @param containerPath Container path where requests are made
 */
export async function loadSelectedSamples(
    searchParams: URLSearchParams,
    sampleColumn: QueryColumn,
    containerPath?: string
): Promise<OrderedMap<any, any>> {
    const workflowJobId = searchParams.get(AssayUploadURLSearchParam.workflowJobId);
    // If the "workflowJobId" URL parameter is specified, then fetch the samples associated with the workflow job.
    if (workflowJobId) {
        return fetchSamples(
            SCHEMAS.SAMPLE_MANAGEMENT.INPUT_SAMPLES_SQ,
            sampleColumn,
            [Filter.create('ApplicationType', 'ExperimentRun'), Filter.create('ApplicationRun', workflowJobId)],
            'Name',
            'RowId', // Issue 51123
            containerPath
        );
    }

    // Otherwise, load the samples from the selection.
    const selection = await getSelection(searchParams);

    if (selection.resolved && selection.schemaQuery && selection.selected.length) {
        const isPicklist = searchParams.get(AssayUploadURLSearchParam.isPicklist) === 'true';
        let sampleIdNums = selection.selected;
        if (isPicklist) {
            sampleIdNums = await getSelectedPicklistSamples(selection.schemaQuery.queryName, selection.selected, false);
        }

        const sampleSchemaQuery =
            isPicklist || selection.schemaQuery.isEqual(SCHEMAS.SAMPLE_MANAGEMENT.INPUT_SAMPLES_SQ)
                ? SCHEMAS.EXP_TABLES.MATERIALS
                : selection.schemaQuery;
        return fetchSamples(
            sampleSchemaQuery,
            sampleColumn,
            [Filter.create('RowId', sampleIdNums, Filter.Types.IN)],
            sampleColumn.lookup.displayColumn,
            sampleColumn.lookup.keyColumn,
            containerPath
        );
    }

    return OrderedMap();
}

export function uploadAssayRunFiles(data: AssayUploadOptions): Promise<AssayUploadOptions> {
    return new Promise((resolve, reject) => {
        const batchFiles = collectFiles(data.batchProperties);
        const runFiles = collectFiles(data.properties);

        // track the largest file size for the results data, used to determine if async mode should be used
        // note that we don't include the batchFiles or runFiles in this as they are processed / posted separately
        let maxFileSize = 0;

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
            fileNameMap[name] = {
                columnName,
                origin: 'run',
            };
            formData.append(name, file);
            fileCounter++;
        });

        // N.B. assayFileUpload's success response is not handled well by Utils.getCallbackWrapper.
        Ajax.request({
            url: buildURL('assay', 'assayFileUpload.view', data.containerPath),
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

export function checkForDuplicateAssayFiles(
    fileNames: string[],
    containerPath?: string
): Promise<DuplicateFilesResponse> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('assay', 'assayFileDuplicateCheck.api', containerPath),
            method: 'POST',
            jsonData: {
                fileNames,
            },
            success: Utils.getCallbackWrapper(res => {
                resolve(res);
            }),
            failure: handleRequestFailure(reject, 'Problem checking for duplicate files'),
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
