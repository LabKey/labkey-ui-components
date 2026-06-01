/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
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
