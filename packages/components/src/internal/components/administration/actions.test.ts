import {
    getGroupMembership,

} from './actions';
import { GroupMembership, Groups, MemberType } from './models';

describe('Administration actions', () => {
    test('getGroupMembership', () => {
        const groups = [
            {
                name: 'Administrators',
                id: -1,
                isProjectGroup: false,
            },
            {
                name: 'NewSiteGroup',
                id: 1035,
                isProjectGroup: false,
            },
            {
                name: 'group1',
                id: 1064,
                isProjectGroup: true,
            },
            {
                name: 'group2',
                id: 1066,
                isProjectGroup: true,
            },
        ];

        const groupMemberships: GroupMembership[] = [
            {
                groupId: -1,
                groupName: 'Administrators',
                userDisplayName: 'rosalinep',
                userEmail: 'rosalinep@labkey.com',
                userId: 1005,
            },
            {
                groupId: 1035,
                groupName: 'NewSiteGroup',
                userDisplayName: 'rosalinep',
                userEmail: 'rosalinep@labkey.com',
                userId: 1005,
            },
            {
                groupId: 1064,
                groupName: 'group1',
                userDisplayName: 'rosalinep',
                userEmail: 'rosalinep@labkey.com',
                userId: 1005,
            },
            {
                groupId: 1064,
                groupName: 'group1',
                userDisplayName: null,
                userEmail: null,
                userId: 1066,
            },
            {
                groupId: 1064,
                groupName: 'group1',
                userDisplayName: null,
                userEmail: null,
                userId: 1000,
            },
        ];

        const expected: Groups = {
            '1035': {
                groupName: 'NewSiteGroup',
                members: [
                    {
                        id: 1005,
                        name: 'rosalinep@labkey.com (rosalinep)',
                        type: MemberType.user,
                    },
                ],
                type: MemberType.siteGroup,
            },
            '1064': {
                groupName: 'group1',
                members: [
                    {
                        id: 1066,
                        name: 'group2',
                        type: MemberType.group,
                    },
                    {
                        id: 1005,
                        name: 'rosalinep@labkey.com (rosalinep)',
                        type: MemberType.user,
                    },
                ],
                type: MemberType.group,
            },
            '1066': {
                groupName: 'group2',
                members: [],
                type: MemberType.group,
            },
            '-1': {
                groupName: 'Administrators',
                members: [],
                type: MemberType.siteGroup,
            },
        };

        // See comment on getGroupMembership() function.
        expect(getGroupMembership(groups, groupMemberships)).toEqual(expected);
    });
});
