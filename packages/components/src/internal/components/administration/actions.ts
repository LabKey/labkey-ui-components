import { List, Map } from 'immutable';

import { Query, Security } from '@labkey/api';

import { AppURL } from '../../url/AppURL';
import { SecurityPolicy, SecurityRole } from '../permissions/models';

import { Row } from '../../query/selectRows';

import { SECURITY_ROLE_DESCRIPTIONS } from './constants';
import { GroupMembership } from './models';

export function getUpdatedPolicyRoles(
    roles: List<SecurityRole>,
    updatedRoleInfo: Map<string, string>
): List<SecurityRole> {
    return roles
        .map(role => {
            return updatedRoleInfo.has(role.uniqueName) ? getUpdatedRole(role, updatedRoleInfo) : role;
        })
        .toList();
}

export function getUpdatedPolicyRolesByUniqueName(
    roles: List<SecurityRole>,
    updatedRoleInfo: Map<string, string>
): Map<string, SecurityRole> {
    let rolesByUniqueName = Map<string, SecurityRole>();

    // map to role display names for the SM app
    roles.forEach(role => {
        const updatedRole = updatedRoleInfo.has(role.uniqueName) ? getUpdatedRole(role, updatedRoleInfo) : role;
        rolesByUniqueName = rolesByUniqueName.set(role.uniqueName, updatedRole);
    });

    return rolesByUniqueName;
}

function getUpdatedRole(role: SecurityRole, updatedRoleInfo: Map<string, string>): SecurityRole {
    return role.merge({
        displayName: updatedRoleInfo.get(role.uniqueName) + 's',
        description: SECURITY_ROLE_DESCRIPTIONS.get(role.uniqueName) || role.description,
    }) as SecurityRole;
}

export function getUserGridFilterURL(userIds: List<number>, urlPrefix: string): AppURL {
    let url = AppURL.create('admin', 'users');
    if (userIds && userIds.size > 0) {
        url = url.addParam(urlPrefix + '.UserId~in', userIds.join(';'));
    }
    return url;
}

export function updateSecurityPolicy(
    containerPath: string,
    userIds: List<number>,
    roleUniqueNames: string[]
): Promise<any> {
    return new Promise((resolve, reject) => {
        Security.getPolicy({
            containerPath,
            resourceId: containerPath,
            success: (data, relevantRoles) => {
                let policy = SecurityPolicy.create({ policy: data, relevantRoles });
                userIds.forEach(userId => {
                    roleUniqueNames.forEach(name => {
                        policy = SecurityPolicy.addUserIdAssignment(policy, userId, name);
                    });
                });

                Security.savePolicy({
                    containerPath,
                    policy: { policy },
                    success: response => {
                        resolve(response);
                    },
                    failure: error => {
                        reject(error);
                    },
                });
            },
            failure: error => {
                console.error('Failed to update security policy', error);
                reject(error);
            },
        });
    });
}

// right place?
export const getGroupRows = (): Promise<Row[]> => {
    return new Promise((resolve, reject) => {
        Query.selectRows({
            method: 'POST',
            schemaName: 'core',
            queryName: 'Members',
            columns: 'UserId,GroupId,GroupId/Name,UserId/DisplayName,UserId/Email',
            success: response => {
                resolve(response.rows);
            },
            failure: error => {
                console.error('Failed to fetch group memberships', error);
                reject(error);
            },
        });
    });
};

// right place?
// comment this up
export const constructGroupMembership = (groupsData, groupRows): GroupMembership => {
    const groupsWithMembers = groupRows.reduce((prev, curr) => {
        const groupId = curr['GroupId'];
        if (groupId === -1) {
            return prev;
        }
        const userDisplayName = curr['UserId/DisplayName'];
        const userDisplayValue = `${curr['UserId/Email']} (${userDisplayName})`;
        const isGroup = !userDisplayName;

        // consider efficiency of below line. Maybe make groupsData a map
        const member = {
            name: isGroup ? groupsData.find(group => group.id === curr.UserId).name : userDisplayValue,
            id: curr.UserId,
            type: isGroup ? 'g' : 'u',
        };
        if (curr.GroupId in prev) {
            prev[groupId].members.push(member);
            return prev;
        } else {
            prev[groupId] = { groupName: curr['GroupId/Name'], members: [member] };
            return prev;
        }
    }, {});

    groupsData.forEach(group => {
        if (!(group.id in groupsWithMembers)) {
            groupsWithMembers[group.id] = { groupName: group.name, members: [] };
        }
    });

    return groupsWithMembers;
};
