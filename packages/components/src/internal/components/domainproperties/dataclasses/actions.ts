/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map } from 'immutable';
import { ActionURL, Ajax, Domain, Utils } from '@labkey/api';

import { SCHEMAS } from '../../../schemas';
import { deleteEntityType } from '../../entities/actions';

import { SchemaQuery } from '../../../../public/SchemaQuery';
import { DomainDetails } from '../models';

import { handleRequestFailure } from '../../../request';

import { DataClassModel } from './models';

export function fetchDataClass(queryName?: string, rowId?: number, containerPath?: string): Promise<DataClassModel> {
    if (rowId) {
        return fetchDataClassProperties(rowId, containerPath)
            .then(response => {
                return _fetchDataClass(undefined, response.domainId, containerPath);
            })
            .catch(error => {
                return Promise.reject(error);
            });
    } else if (queryName) {
        return _fetchDataClass(queryName, undefined, containerPath);
    } else {
        // for the create case to get the domain details based on domainKind param only
        return _fetchDataClass();
    }
}

function _fetchDataClass(queryName?: string, domainId?: number, containerPath?: string): Promise<DataClassModel> {
    return new Promise((resolve, reject) => {
        return Domain.getDomainDetails({
            containerPath,
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

// TODO: This should share implementation with api.samples.getSampleTypeDetails / api.domain.fetchDomainDetails
export function getDataClassDetails(
    query?: SchemaQuery,
    domainId?: number,
    containerPath?: string
): Promise<DomainDetails> {
    return new Promise((resolve, reject) => {
        return Domain.getDomainDetails({
            containerPath,
            domainId,
            queryName: query ? query.queryName : undefined,
            schemaName: query ? query.schemaName : undefined,
            domainKind: query === undefined && domainId === undefined ? 'DataClass' : undefined,
            success: response => {
                resolve(DomainDetails.create(Map(response)));
            },
            failure: response => {
                console.error(response);
                reject(response);
            },
        });
    });
}

function fetchDataClassProperties(rowId: number, containerPath?: string): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('experiment', 'getDataClassProperties.api', containerPath),
            params: { rowId },
            scope: this,
            success: Utils.getCallbackWrapper(data => {
                resolve(data);
            }),
            failure: handleRequestFailure(reject, 'Failed to get data class properties'),
        });
    });
}

export function deleteDataClass(rowId: number, containerPath?: string, auditUserComment?: string): Promise<void> {
    return deleteEntityType('deleteDataClass', rowId, containerPath, auditUserComment);
}
