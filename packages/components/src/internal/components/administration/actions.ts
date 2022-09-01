import { List, Map } from 'immutable';

import { Query, Security } from '@labkey/api';

import { AppURL } from '../../url/AppURL';
import { SecurityPolicy, SecurityRole } from '../permissions/models';

import { Row } from '../../query/selectRows';

import { FetchedGroup } from '../permissions/actions';

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

// groupsData is an array of objects, each representing a group.
// groupRows is an array of data rows that correlate members with groups. See core.Members, the table it gets data from.
// From this, we construct an object of the form:
// {<id of group>:
//      {
//          groupName: <group name>,
//          members: [{name: <member name>, id: <member id>, type: <member type, 'g', 'sg', or 'u'>}, ...]
//       },
//       ...
// }
// Where the members array is sorted by type, and then by name. The types stand for 'group,' 'site group,' and 'user'
export const constructGroupMembership = (groupsData: FetchedGroup[], groupRows): GroupMembership => {
    const groupsWithMembers = groupRows.reduce((prev, curr) => {
        const groupId = curr['GroupId'];
        const i = groupsData.find(group => group.id === groupId);

        if (groupId === -1 || !i.isProjectGroup) {
            return prev;
        }
        const userDisplayName = curr['UserId/DisplayName'];
        const userDisplayValue = `${curr['UserId/Email']} (${userDisplayName})`;
        const memberIsGroup = !userDisplayName;

        const member = {
            name: memberIsGroup ? groupsData.find(group => group.id === curr.UserId).name : userDisplayValue,
            id: curr.UserId,
            type: memberIsGroup ? 'g' : 'u',
        };
        if (curr.GroupId in prev) {
            prev[groupId].members.push(member);
            prev[groupId].members.sort((member1, member2) => member1.name.localeCompare(member2.name));
            return prev;
        } else {
            prev[groupId] = { groupName: curr['GroupId/Name'], members: [member] };
            return prev;
        }
    }, {});

    // If a group has no members—is in groupsData but not groupRows—add it as well, unless it is a site group
    groupsData.forEach(group => {
        const isProjectGroup = group.isProjectGroup;
        if (!(group.id in groupsWithMembers) && isProjectGroup) {
            groupsWithMembers[group.id] = { groupName: group.name, members: [] };
        }
    });

    return groupsWithMembers;
};
