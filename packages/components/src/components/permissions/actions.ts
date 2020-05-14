/*
 * Copyright (c) 2015-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map, fromJS } from 'immutable';

import {Filter, Security} from '@labkey/api';

import { ISelectRowsResult, selectRows } from '../../query/api';

import {Principal, SecurityPolicy, SecurityRole} from './models';

export function processGetRolesResponse(response: any): List<SecurityRole> {
    let roles = List<SecurityRole>();
    response.forEach(role => {
        roles = roles.push(SecurityRole.create(role));
    });
    return roles;
}

export function getRolesByUniqueName(roles: List<SecurityRole>): Map<string, SecurityRole> {
    let rolesByUniqueName = Map<string, SecurityRole>();
    roles.forEach(role => {
        rolesByUniqueName = rolesByUniqueName.set(role.uniqueName, role);
    });
    return rolesByUniqueName;
}

function processPrincipalsResponse(data: ISelectRowsResult, resolve) {
    const models = fromJS(data.models[data.key]);
    let principals = List<Principal>();

    data.orderedModels[data.key].forEach(modelKey => {
        const row = models.get(modelKey);
        const principal = Principal.createFromSelectRow(row);
        principals = principals.push(principal);
    });

    resolve(principals);
}

export function getPrincipals(): Promise<List<Principal>> {
    return new Promise((resolve, reject) => {
        selectRows({
            saveInSession: true, // needed so that we can call getQueryDetails
            schemaName: 'core',
            // issue 17704, add displayName for users
            sql: "SELECT p.*, u.DisplayName FROM Principals p LEFT JOIN Users u ON p.type='u' AND p.UserId=u.UserId",
        })
            .then((data: ISelectRowsResult) => {
                processPrincipalsResponse(data, resolve);
            })
            .catch(response => {
                console.error(response);
                reject(response.message);
            });
    });
}

export function getInactiveUsers(): Promise<List<Principal>> {
    return new Promise((resolve, reject) => {
        selectRows({
            schemaName: 'core',
            queryName: 'Users',
            columns: 'UserId,Email,DisplayName',
            filterArray: [Filter.create('Active', false)],
        })
            .then((data: ISelectRowsResult) => {
                const models = fromJS(data.models[data.key]);
                let principals = List<Principal>();

                data.orderedModels[data.key].forEach(modelKey => {
                    const row = models.get(modelKey);
                    const userId = row.getIn(['UserId', 'value']);
                    const name = row.getIn(['Email', 'value']);
                    const displayName = row.getIn(['DisplayName', 'value']);
                    const principal = new Principal({
                        userId,
                        name,
                        type: 'u',
                        displayName: displayName ? name + ' (' + displayName + ')' : name,
                        active: false,
                    });
                    principals = principals.push(principal);
                });

                resolve(principals);
            })
            .catch(response => {
                reject(response.message);
            });
    });
}

export function getPrincipalsById(principals: List<Principal>): Map<number, Principal> {
    let principalsById = Map<number, Principal>();
    principals.forEach(principal => {
        principalsById = principalsById.set(principal.userId, principal);
    });
    return principalsById;
}

export function fetchContainerSecurityPolicy(
    containerId: string,
    principalsById: Map<number, Principal>,
    inactiveUsersById?: Map<number, Principal>
): Promise<SecurityPolicy> {
    return new Promise((resolve, reject) => {
        Security.getPolicy({
            containerPath: containerId,
            resourceId: containerId,
            success: (data, relevantRoles) => {
                let policy = SecurityPolicy.create({ policy: data, relevantRoles, containerId });
                policy = SecurityPolicy.updateAssignmentsData(policy, principalsById);
                if (inactiveUsersById) {
                    policy = SecurityPolicy.updateAssignmentsData(policy, inactiveUsersById);
                }
                resolve(policy);
            },
            failure: response => reject(response),
        });
    });
}
