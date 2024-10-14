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
import { List } from 'immutable';
import { ActionURL, Ajax, Assay, AssayDOM, Utils } from '@labkey/api';

import { AssayDefinitionModel } from '../../AssayDefinitionModel';
import { handleRequestFailure } from '../../util/utils';

import { AssayProtocolModel } from '../domainproperties/assay/models';

import { AssayUploadResultModel } from './models';

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
