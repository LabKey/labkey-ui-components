import { naturalSortByProperty } from '../../../public/sort';

import { FetchedGroup, SecurityAPIWrapper } from '../security/APIWrapper';

import { getProjectPath } from '../../app/utils';

import { Container } from '../base/models/Container';

import { GroupMembership, Groups, Member, MemberType } from './models';

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
