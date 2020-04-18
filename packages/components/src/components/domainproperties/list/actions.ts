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
import { ActionURL, Ajax, Utils, Domain } from '@labkey/api';

import { buildURL } from '../../..';

import { ListModel } from './models';

export function getListProperties(listId?: number) {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('list', 'GetListProperties'),
            method: 'GET',
            params: { listId },
            scope: this,
            success: Utils.getCallbackWrapper(data => {
                resolve(ListModel.create(null, data));
            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }),
        });
    });
}

export function fetchListDesign(listId: number): Promise<ListModel> {
    return new Promise((resolve, reject) => {
        // first need to retrieve domainId, given a listId
        getListProperties(listId)
            .then((model: ListModel) => {
                // then we can use the getDomainDetails function to get the ListModel
                Domain.getDomainDetails({
                    containerPath: LABKEY.container.path,
                    domainId: model.domainId,
                    success: data => {
                        resolve(ListModel.create(data));
                    },
                    failure: error => {
                        reject(error);
                    },
                });
            })
            .catch(error => {
                reject(error);
            });
    });
}
