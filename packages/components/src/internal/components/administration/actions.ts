import { List, Map } from 'immutable';

import { Security } from '@labkey/api';

import { AppURL } from '../../url/AppURL';
import { SecurityPolicy, SecurityRole } from '../permissions/models';

import { naturalSort } from '../../../public/sort';

import { FetchedGroup, SecurityAPIWrapper } from '../security/APIWrapper';

import { getProjectPath } from '../../app/utils';

import { Container } from '../base/models/Container';

import { GroupMembership, MemberType } from './models';
import { SECURITY_ROLE_DESCRIPTIONS } from './constants';

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
        displayName: updatedRoleInfo.get(role.uniqueName),
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

// groups is an array of objects, each representing a group.
// groupMemberships is an array of data rows that correlate members with groups. See core.Members, the data source.
// From this, we construct an object of the form:
// {<id of group>:
//      {
//          groupName: <group name>,
//          members: [{name: <member name>, id: <member id>, type: <member type, 'g', 'sg', or 'u'>}, ...]
//       },
//       ...
// }
// Where the members array is sorted by type, and then by name. The types stand for 'group,' 'site group,' and 'user'
export const getGroupMembership = (groups: FetchedGroup[], groupMemberships): GroupMembership => {
    const groupsWithMembers = groupMemberships.reduce((prev, curr) => {
        const groupId = curr['GroupId'];
        const isProjectGroup = groups.find(group => group.id === groupId)?.isProjectGroup;

        if (groupId === -1) {
            return prev;
        }
        const userDisplayName = curr['UserId/DisplayName'];
        const userDisplayValue = `${curr['UserId/Email']} (${userDisplayName})`;
        const memberIsGroup = !userDisplayName;

        const member = {
            name: memberIsGroup ? groups.find(group => group.id === curr.UserId).name : userDisplayValue,
            id: curr.UserId,
            type: memberIsGroup ? MemberType.group : MemberType.user,
        };
        if (curr.GroupId in prev) {
            prev[groupId].members.push(member);
            prev[groupId].members.sort((member1, member2) => naturalSort(member1.name, member2.name));
            return prev;
        } else {
            prev[groupId] = {
                groupName: curr['GroupId/Name'],
                members: [member],
                type: isProjectGroup ? MemberType.group : MemberType.siteGroup,
            };
            return prev;
        }
    }, {});

    // If a group has no members—is in groupsData but not groupRows—add it as well, unless it is a site group
    groups.forEach(group => {
        if (!(group.id in groupsWithMembers)) {
            groupsWithMembers[group.id] = {
                groupName: group.name,
                members: [],
                type: group.isProjectGroup ? MemberType.group : MemberType.siteGroup,
            };
        }
    });

    return groupsWithMembers;
};

export const fetchGroupMembership = async (container: Container, api: SecurityAPIWrapper): Promise<GroupMembership> => {
    const groups = await api.fetchGroups(getProjectPath(container.path));
    const groupMemberships = await api.getGroupMemberships();
    return getGroupMembership(groups, groupMemberships);
};
