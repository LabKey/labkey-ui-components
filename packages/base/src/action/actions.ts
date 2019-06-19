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
import { Ajax, Utils, Assay } from '@labkey/api'

import { AssayDefinitionModel, AssayProtocolModel } from "../models/model";
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