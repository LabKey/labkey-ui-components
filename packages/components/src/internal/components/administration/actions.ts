import { List, Map } from 'immutable';

import { Security } from '@labkey/api';

import { AppURL } from '../../url/AppURL';
import { SecurityPolicy, SecurityRole } from '../permissions/models';

import { naturalSortByProperty } from '../../../public/sort';

import { FetchedGroup, SecurityAPIWrapper } from '../security/APIWrapper';

import { getProjectPath } from '../../app/utils';

import { Container } from '../base/models/Container';

import { GroupMembership, Groups, Member, MemberType } from './models';
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
export const getGroupMembership = (groups: FetchedGroup[], groupMemberships: GroupMembership[]): Groups => {
    const groupsWithMembers = groupMemberships.reduce<Groups>((memberships, groupMembership) => {
        const { groupId, groupName, userDisplayName, userId, userEmail } = groupMembership;
        if (groupId === -1) {
            return memberships;
        }

        const memberIsGroup = !userDisplayName;
        const foundGroup = groups.find(group => group.id === userId);

        // Issue 47306: When a member is not resolvable, do not accumulate the member into any groups.
        // For example, if you are a Project Admin, a groupMembership row associating a site group with a user possessing no
        // permissions in the project will result in your inability to resolve data on the permission-less user.
        // That user will not be visible to you, and so should be excluded from the GroupMembership return value.
        if (memberIsGroup && !foundGroup) {
            return memberships;
        }

        const member: Member = {
            name: memberIsGroup ? foundGroup.name : `${userEmail} (${userDisplayName})`,
            id: userId,
            type: memberIsGroup ? MemberType.group : MemberType.user,
        };

        if (groupId in memberships) {
            memberships[groupId].members.push(member);
            memberships[groupId].members.sort(naturalSortByProperty('name'));
        } else {
            const isProjectGroup = groups.find(group => group.id === groupId)?.isProjectGroup;
            memberships[groupId] = {
                groupName,
                members: [member],
                type: isProjectGroup ? MemberType.group : MemberType.siteGroup,
            };
        }

        return memberships;
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

export const fetchGroupMembership = async (container: Container, api: SecurityAPIWrapper): Promise<Groups> => {
    const groups = await api.fetchGroups(getProjectPath(container.path));
    const groupMemberships = await api.getGroupMemberships();
    return getGroupMembership(groups, groupMemberships);
};
