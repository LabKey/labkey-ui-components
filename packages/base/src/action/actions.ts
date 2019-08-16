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
import { List } from 'immutable'
import { AssayDOM, Ajax, Utils, Assay } from '@labkey/api'

import { AssayDefinitionModel, AssayProtocolModel, InferDomainResponse, QueryColumn } from "../models/model";
import { buildURL } from "../url/ActionURL";

export function fetchProtocol(protocolId: number): Promise<AssayProtocolModel> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('assay', 'getProtocol.api', { protocolId }),
            success: Utils.getCallbackWrapper((data) => {
                resolve(new AssayProtocolModel(data.data));
            }),
            failure: Utils.getCallbackWrapper((error) => {
                reject(error);
            })
        })
    });
}

export function fetchAllAssays(type?: string): Promise<List<AssayDefinitionModel>> {
    return new Promise((res, rej) => {
        Assay.getAll({
            parameters: {
                type
            },
            success: (rawModels: Array<any>) => {
                let models = List<AssayDefinitionModel>().asMutable();
                rawModels.forEach(rawModel => {
                    models.push(AssayDefinitionModel.create(rawModel));
                });
                res(models.asImmutable());
            },
            failure: (error) => {
                rej(error);
            }
        });
    })
}

export function createGeneralAssayDesign(name: string, description: string, fields: List<QueryColumn>): Promise<AssayProtocolModel> {
    return new Promise((resolve, reject) => {
        const dataFields = fields.map((field) => {
            return {
                name: field.name,
                rangeURI: field.rangeURI
            }
        });

        // TODO: this API needs to handle checks for reserved fields for domains (ex. I was able to create a data domain with "RowId" as a field name but then data imports failed because of it)
        // TODO: can these domainURI template values be filled in by the saveProtocol API and not provided here?
        Ajax.request({
            url: buildURL('assay', 'saveProtocol.api'),
            jsonData: {
                providerName: 'General',
                name,
                description,
                domains: [{
                    name: 'Batch Fields',
                    domainURI: 'urn:lsid:${LSIDAuthority}:AssayDomain-Batch.Folder-${Container.RowId}:${AssayName}',
                    // fields: List<QueryColumn>()
                },{
                    name: 'Run Fields',
                    domainURI: 'urn:lsid:${LSIDAuthority}:AssayDomain-Run.Folder-${Container.RowId}:${AssayName}',
                    // fields: List<QueryColumn>()
                },{
                    name: 'Data Fields',
                    domainURI: 'urn:lsid:${LSIDAuthority}:AssayDomain-Data.Folder-${Container.RowId}:${AssayName}',
                    fields: dataFields
                }]
            },
            success: Utils.getCallbackWrapper((response) => {
                resolve(new AssayProtocolModel(response.data));
            }),
            failure: Utils.getCallbackWrapper((error) => {
                reject(error.exception);
            }, this, false)
        });
    });
}

export function importGeneralAssayRun(assayId: number, file: File, name?: string, comment?: string): Promise<any> {
    return new Promise((resolve, reject) => {
        AssayDOM.importRun({
            assayId,
            name,
            comment,
            files: [file],
            success: (response) => {
                resolve(response)
            },
            failure: (error) => {
                reject(error.exception);
            }
        });
    });
}

export function inferDomainFromFile(file: File, numLinesToInclude: number) : Promise<InferDomainResponse> {
    return new Promise((resolve, reject) => {
        let form = new FormData();
        form.append('file', file);
        form.append('numLinesToInclude', numLinesToInclude ? (numLinesToInclude + 1).toString() : undefined);

        Ajax.request({
            url: buildURL('property', 'inferDomain'),
            method: 'POST',
            form,
            success: (response) => {
                const json = JSON.parse(response.responseText);
                resolve(InferDomainResponse.create(json));
            },
            failure: (response) => {
                reject("There was a problem uploading the data file for inferring the domain.");
                console.error(response);
            }
        });
    })
}

/**
 * This is used for retrieving preview data for a file already on the server side
 * @param file  This can be a rowId for the file, or a path to the file
 * @param numLinesToInclude: the number of lines of data to include (excludes the header)
 */
export function getServerFilePreview(file: string, numLinesToInclude: number) : Promise<InferDomainResponse>{
    return new Promise((resolve, reject) => {

        Ajax.request({
                url: buildURL('property', 'getFilePreview.api'),
                method: 'GET',
                params: {
                    file,
                    numLinesToInclude: numLinesToInclude ? (numLinesToInclude + 1) : undefined // add one to account for the header
                },
                success: Utils.getCallbackWrapper((response) => {
                    resolve(InferDomainResponse.create(response));
                }),
                failure: Utils.getCallbackWrapper((response) => {
                    reject("There was a problem retrieving the preview data.");
                    console.error(response);
                })
            }
        )
    })
}

export function getUserProperties(userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('user', 'getUserProps.api', {userId}),
            success: Utils.getCallbackWrapper((response) => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response);
            })
        });
    });
}