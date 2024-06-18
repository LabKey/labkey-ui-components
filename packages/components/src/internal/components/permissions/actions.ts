/*
 * Copyright (c) 2015-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS, List, Map } from 'immutable';

import { ActionURL, Ajax, Filter, Security, Utils } from '@labkey/api';

import { ISelectRowsResult, selectRowsDeprecated } from '../../query/api';

import { Container } from '../base/models/Container';
import { FetchContainerOptions } from '../security/APIWrapper';

import { APPLICATION_ROLES_LABELS, APPLICATION_ROLES_DESCRIPTIONS } from '../administration/constants';

import { Principal, SecurityPolicy, SecurityRole } from './models';

export function processGetRolesResponse(rawRoles: any): List<SecurityRole> {
    let roles = List<SecurityRole>();
    rawRoles.forEach(roleRaw => {
        const role = roleRaw;
        if (APPLICATION_ROLES_LABELS[role?.uniqueName]) role.displayName = APPLICATION_ROLES_LABELS[role?.uniqueName];
        if (APPLICATION_ROLES_DESCRIPTIONS[role?.uniqueName]) role.description = APPLICATION_ROLES_DESCRIPTIONS[role?.uniqueName];
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
        selectRowsDeprecated({
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
        selectRowsDeprecated({
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
    principalsById?: Map<number, Principal>,
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
