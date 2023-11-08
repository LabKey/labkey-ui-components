import { List } from 'immutable';

import { Principal } from '../permissions/models';

import { createGroupedOptions } from './utils';
import { MemberType } from './models';

describe('createGroupedOptions', () => {
    const SITE_GROUPS = List([
        Principal.create({
            userId: 1109,
            name: 'SiteGroup1',
            displayName: 'SiteGroup1',
            type: MemberType.group,
            active: true,
            isSiteGroup: true,
        }),
        Principal.create({
            userId: 1035,
            name: 'SiteGroup2',
            displayName: 'SiteGroup2',
            type: MemberType.group,
            active: true,
            isSiteGroup: true,
        }),
    ]);
    const USERS_AND_PROJECT_GROUPS = List([
        Principal.create({
            userId: 1009,
            name: 'editor@labkey.com',
            displayName: 'editor@labkey.com (editor)',
            type: MemberType.user,
            active: true,
            isSiteGroup: false,
        }),
        Principal.create({
            userId: 1008,
            name: 'folderadmin@labkey.com',
            displayName: 'folderadmin@labkey.com (folderadmin)',
            type: MemberType.user,
            active: true,
            isSiteGroup: false,
        }),
        Principal.create({
            userId: 1065,
            name: 'group1',
            displayName: 'group1',
            type: MemberType.group,
            active: true,
            isSiteGroup: false,
        }),
        Principal.create({
            userId: 1066,
            name: 'group2',
            displayName: 'group2',
            type: MemberType.group,
            active: true,
            isSiteGroup: false,
        }),
        Principal.create({
            userId: 1067,
            name: 'group3',
            displayName: 'group3',
            type: MemberType.group,
            active: true,
            isSiteGroup: false,
        }),
    ]);

    test('with users, site groups, and project groups', () => {
        const options = createGroupedOptions(USERS_AND_PROJECT_GROUPS);
        expect(options.length).toBe(2);
        expect(options[0].label).toBe('Groups');
        expect(options[0].options.length).toBe(3);
        expect(options[1].label).toBe('Users');
        expect(options[1].options.length).toBe(2);
    });

    test('with only users and groups', () => {
        const options = createGroupedOptions(USERS_AND_PROJECT_GROUPS.concat(SITE_GROUPS) as List<Principal>);

        expect(options.length).toBe(3);
        expect(options[0].label).toBe('Site Groups');
        expect(options[0].options.length).toBe(2);
        expect(options[1].label).toBe('Project Groups');
        expect(options[1].options.length).toBe(3);
        expect(options[2].label).toBe('Users');
        expect(options[2].options.length).toBe(2);
    });
});
