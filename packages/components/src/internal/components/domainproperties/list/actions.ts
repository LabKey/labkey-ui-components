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
import { ActionURL, Ajax, Utils, Domain, getServerContext } from '@labkey/api';

import { ListModel } from './models';
import { INT_LIST } from './constants';

export function getListProperties(listId?: number, containerPath?: string): Promise<ListModel> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('list', 'getListProperties.api', containerPath),
            params: { listId },
            success: Utils.getCallbackWrapper(data => {
                resolve(ListModel.create(null, data));
            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }),
        });
    });
}

export function fetchListDesign(listId?: number, containerPath?: string): Promise<ListModel> {
    return new Promise((resolve, reject) => {
        // first need to retrieve domainId, given a listId (or the default properties in the create case where listId is undefined)
        getListProperties(listId, containerPath)
            .then(model => {
                // then we can use the getDomainDetails function to get the ListModel
                Domain.getDomainDetails({
                    containerPath,
                    domainId: model.domainId,
                    domainKind: listId === undefined ? INT_LIST : undefined, // NOTE there is also a VarList domain kind but for this purpose either will work
                    success: data => {
                        resolve(ListModel.create(data));
                    },
                    failure: error => {
                        console.error(error);
                        reject(error);
                    },
                });
            })
            .catch(error => {
                console.error(error);
                reject(error);
            });
    });
}

export function getListIdFromDomainId(domainId: number): Promise<number> {
    return new Promise((resolve, reject) => {
        Domain.getDomainDetails({
            containerPath: getServerContext().container.path,
            domainId,
            success: data => {
                const newModel = ListModel.create(data);
                resolve(newModel.listId);
            },
            failure: error => {
                console.error('Unable to retrieve list id for domainId: ' + domainId, error);
                reject(undefined);
            },
        });
    });
}
