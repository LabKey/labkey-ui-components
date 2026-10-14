/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS } from 'immutable';
import { ExtendedMap } from '../../../public/ExtendedMap';

import { ActionURL, Ajax, Filter, Security, Utils } from '@labkey/api';

import { ISelectRowsResult, selectRowsDeprecated } from '../../query/api';

import { Container } from '../base/models/Container';
import { FetchContainerOptions } from '../security/APIWrapper';

import { APPLICATION_ROLES_DESCRIPTIONS, APPLICATION_ROLES_LABELS } from '../administration/constants';

import { Principal, SecurityPolicy, SecurityRole } from './models';
import { executeSql } from '../../query/executeSql';
import { selectRows } from '../../query/selectRows';
import { SCHEMAS } from '../../schemas';

export function processGetRolesResponse(rawRoles: any): SecurityRole[] {
    return rawRoles.map(role => {
        if (APPLICATION_ROLES_LABELS[role?.uniqueName]) role.displayName = APPLICATION_ROLES_LABELS[role?.uniqueName];
        if (APPLICATION_ROLES_DESCRIPTIONS[role?.uniqueName])
            role.description = APPLICATION_ROLES_DESCRIPTIONS[role?.uniqueName];
        return SecurityRole.create(role);
    });
}

export function getRolesByUniqueName(roles: SecurityRole[]): ExtendedMap<string, SecurityRole> {
    const rolesByUniqueName = new ExtendedMap<string, SecurityRole>();
    roles.forEach(role => rolesByUniqueName.set(role.uniqueName, role));
    return rolesByUniqueName;
}

export async function getPrincipals(): Promise<Principal[]> {
    const result = await executeSql({
        saveInSession: true, // needed so that we can call getQueryDetails
        schemaName: 'core',
        // Issue 17704: add displayName for users
        sql: "SELECT p.*, u.DisplayName FROM Principals p LEFT JOIN Users u ON p.type='u' AND p.UserId=u.UserId",
    });

    return result.rows.map(row => Principal.createFromSelectRow(fromJS(row)));
}

export async function getPrincipalById(principalId: number): Promise<Principal | undefined> {
    const results = await selectRows({
        columns: ['UserId', 'Name', 'Type'],
        schemaQuery: SCHEMAS.CORE_TABLES.PRINCIPALS,
        filterArray: [Filter.create('UserId', principalId)],
    });

    if (results.rows.length === 1) {
        const row = results.rows[0];
        return Principal.createFromSelectRow(fromJS(row));
    }
    return undefined;
}

export function getInactiveUsers(): Promise<Principal[]> {
    return new Promise((resolve, reject) => {
        selectRowsDeprecated({
            schemaName: 'core',
            queryName: 'Users',
            columns: 'UserId,Email,DisplayName',
            filterArray: [Filter.create('Active', false)],
        })
            .then((data: ISelectRowsResult) => {
                const models = fromJS(data.models[data.key]);
                const principals = data.orderedModels[data.key].toArray().map(modelKey => {
                    const row = models.get(modelKey);
                    const userId = row.getIn(['UserId', 'value']);
                    const name = row.getIn(['Email', 'value']);
                    const displayName = row.getIn(['DisplayName', 'value']);
                    return new Principal({
                        userId,
                        name,
                        type: 'u',
                        displayName: displayName ? name + ' (' + displayName + ')' : name,
                        active: false,
                    });
                });

                resolve(principals);
            })
            .catch(response => {
                reject(response.message);
            });
    });
}

export function getPrincipalsById(principals: Principal[]): ExtendedMap<number, Principal> {
    const principalsById = new ExtendedMap<number, Principal>();
    principals.forEach(principal => principalsById.set(principal.userId, principal));
    return principalsById;
}

export function fetchContainerSecurityPolicy(
    containerId: string,
    principalsById?: ExtendedMap<number, Principal>,
    inactiveUsersById?: ExtendedMap<number, Principal>
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
            failure: error => {
                console.error('Failed to fetch security policy', error);
                reject(error);
            },
        });
    });
}

function recurseContainerHierarchy(data: Security.ContainerHierarchy, container: Container): Container[] {
    return (data.children ?? []).reduce(
        (containers, c) => containers.concat(recurseContainerHierarchy(c, new Container(c))),
        [container]
    );
}

export function fetchContainers(options: FetchContainerOptions): Promise<Container[]> {
    // NK: By default the server processes "includeSubfolders=false" as setting the
    // depth to 1. When the depth is set to 1 the results will include the first level of
    // subfolders negating the desire to not include subfolders. This endpoint wrapper
    // works around this by altering requests for "includeSubfolders=false" to be
    // "includeSubfolders=true&depth=0" so that subfolders are not included.
    if (options?.includeSubfolders === false && options.depth === undefined) {
        options.includeSubfolders = true;
        options.depth = 0;
    }

    return new Promise((resolve, reject) => {
        Security.getContainers({
            ...options,
            success: (data: Security.ContainerHierarchy) => {
                resolve(recurseContainerHierarchy(data, new Container(data)));
            },
            failure: error => {
                console.error('Failed to fetch containers', error);
                reject(error);
            },
        });
    });
}

export type UserLimitSettings = {
    activeUsers: number;
    messageHtml: string;
    remainingUsers: number;
    success: boolean;
    userLimit: boolean;
    userLimitLevel: number;
};

export function getUserLimitSettings(containerPath?: string): Promise<UserLimitSettings> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('user', 'getUserLimitSettings.api', containerPath),
            success: Utils.getCallbackWrapper(settings => {
                resolve(settings as UserLimitSettings);
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error(error);
                reject(error);
            }),
        });
    });
}
