import { fromJS, List, Map } from 'immutable';

import { SecurityRole } from '../permissions/models';

import {
    getGroupMembership,
    getUpdatedPolicyRoles,
    getUpdatedPolicyRolesByUniqueName,
    getUserGridFilterURL,
} from './actions';
import { GroupMembership, Groups, MemberType } from './models';

describe('Administration actions', () => {
    test('getUpdatedPolicyRoles', () => {
        const testRole = SecurityRole.create({ uniqueName: 'testRole', displayName: 'TestRoleDisplayName' });
        const roles = List<SecurityRole>([testRole]);

        // test with no changes
        const noChangeRoles = getUpdatedPolicyRoles(roles, Map<string, string>());
        expect(roles.size === noChangeRoles.size).toBeTruthy();
        expect(noChangeRoles.get(0).uniqueName).toBe(testRole.uniqueName);
        expect(noChangeRoles.get(0).displayName).toBe(testRole.displayName);

        // test with a mapping to a new displayName
        const changedRoles = getUpdatedPolicyRoles(roles, fromJS({ testRole: 'UpdatedDisplayName' }));
        expect(roles.size === changedRoles.size).toBeTruthy();
        expect(changedRoles.get(0).uniqueName).toBe(testRole.uniqueName);
        expect(changedRoles.get(0).displayName).toBe('UpdatedDisplayName');
    });

    test('getUpdatedPolicyRolesByUniqueName', () => {
        const key = 'testRole';
        const testRole = SecurityRole.create({ uniqueName: key, displayName: 'TestRoleDisplayName' });
        const roles = List<SecurityRole>([testRole]);

        // test with no changes
        const noChangeRoles = getUpdatedPolicyRolesByUniqueName(roles, Map<string, string>());
        expect(noChangeRoles.get(key).uniqueName).toBe(testRole.uniqueName);
        expect(noChangeRoles.get(key).displayName).toBe(testRole.displayName);

        // test with a mapping to a new displayName
        const changedRoles = getUpdatedPolicyRolesByUniqueName(roles, fromJS({ testRole: 'UpdatedDisplayName' }));
        expect(changedRoles.get(key).uniqueName).toBe(testRole.uniqueName);
        expect(changedRoles.get(key).displayName).toBe('UpdatedDisplayName');
    });

    test('getUserGridFilterURL', () => {
        const baseExpectedUrl = '/admin/users';
        expect(getUserGridFilterURL(undefined, 'query').toString()).toBe(baseExpectedUrl);
        expect(getUserGridFilterURL(List<number>(), 'query').toString()).toBe(baseExpectedUrl);
        expect(getUserGridFilterURL(List<number>([]), 'query').toString()).toBe(baseExpectedUrl);
        expect(getUserGridFilterURL(List<number>([1]), 'query').toString()).toBe(
            baseExpectedUrl + '?query.UserId~in=1'
        );
        expect(getUserGridFilterURL(List<number>([1, 2]), 'query').toString()).toBe(
            baseExpectedUrl + '?query.UserId~in=1%3B2'
        );
    });

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
