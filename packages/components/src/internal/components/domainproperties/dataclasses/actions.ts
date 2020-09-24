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
import { ActionURL, Ajax, Domain, Utils } from '@labkey/api';

import { SCHEMAS } from '../../base/models/schemas';
import { deleteEntityType } from '../../entities/actions';

import { DataClassModel } from './models';

export function fetchDataClass(queryName?: string, rowId?: number): Promise<DataClassModel> {
    if (rowId) {
        return fetchDataClassProperties(rowId)
            .then(response => {
                return _fetchDataClass(undefined, response.domainId);
            })
            .catch(error => {
                return Promise.reject(error);
            });
    } else if (queryName) {
        return _fetchDataClass(queryName);
    } else {
        // for the create case to get the domain details based on domainKind param only
        return _fetchDataClass();
    }
}

function _fetchDataClass(queryName?: string, domainId?: number): Promise<DataClassModel> {
    return new Promise((resolve, reject) => {
        return Domain.getDomainDetails({
            containerPath: LABKEY.container.path,
            schemaName: SCHEMAS.DATA_CLASSES.SCHEMA,
            queryName,
            domainId,
            domainKind: queryName === undefined && domainId === undefined ? 'DataClass' : undefined,
            success: data => {
                if (data.domainKindName === 'DataClass') {
                    resolve(DataClassModel.create(data));
                } else {
                    reject({ exception: 'Unexpected domainKind type found: ' + data.domainKindName });
                }
            },
            failure: error => {
                reject(error);
            },
        });
    });
}

function fetchDataClassProperties(rowId: number): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('experiment', 'getDataClassProperties.api'),
            method: 'GET',
            params: { rowId },
            scope: this,
            success: Utils.getCallbackWrapper(data => {
                resolve(data);
            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }),
        });
    });
}

export function deleteDataClass(rowId: number): Promise<any> {
    return deleteEntityType('deleteDataClass', rowId);
}
