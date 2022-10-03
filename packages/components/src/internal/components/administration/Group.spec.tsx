import { mount } from 'enzyme';

import React from 'react';

import { List } from 'immutable';

import { Principal } from '../permissions/models';

import { DisableableButton } from '../buttons/DisableableButton';
import { SelectInputImpl } from '../forms/input/SelectInput';

import { MemberButtons } from './MemberButtons';
import { Group } from './Group';
import { MemberType } from './models';

describe('<Group/>', () => {
    const EDITOR = Principal.create({
        userId: 1009,
        name: 'editor@labkey.com',
        displayName: 'editor@labkey.com (editor)',
        type: MemberType.user,
        active: true,
        isSiteGroup: false,
    });
    const FOLDER_ADMIN = Principal.create({
        userId: 1008,
        name: 'folderadmin@labkey.com',
        displayName: 'folderadmin@labkey.com (folderadmin)',
        type: MemberType.user,
        active: true,
        isSiteGroup: false,
    });
    const PROJECT_GROUP1 = Principal.create({
        userId: 1064,
        name: 'group1',
        displayName: 'group1',
        type: MemberType.group,
        active: true,
        isSiteGroup: false,
    });
    const PROJECT_GROUP2 = Principal.create({
        userId: 1065,
        name: 'group2',
        displayName: 'group2',
        type: MemberType.group,
        active: true,
        isSiteGroup: false,
    });
    const PROJECT_GROUP3 = Principal.create({
        userId: 1066,
        name: 'group3',
        displayName: 'group3',
        type: MemberType.group,
        active: true,
        isSiteGroup: false,
    });
    const SITE_GROUP = Principal.create({
        userId: 1035,
        name: 'siteGroup',
        displayName: 'siteGroup',
        type: MemberType.group,
        active: true,
        isSiteGroup: true,
    });

    const USERS_AND_GROUPS = List.of(EDITOR, FOLDER_ADMIN, PROJECT_GROUP1, PROJECT_GROUP2, PROJECT_GROUP3, SITE_GROUP);

    const MEMBERS = [
        {
            name: 'editor@labkey.com (editor)',
            id: 1009,
            type: MemberType.user,
        },
        {
            name: 'group2',
            id: 1065,
            type: MemberType.group,
        },
        {
            name: 'siteGroup',
            id: 1035,
            type: MemberType.group,
        },
    ];

    const DEFAULT_PROPS = {
        name: 'group1',
        id: '1064',
        usersAndGroups: USERS_AND_GROUPS,
        onClickAssignment: jest.fn(),
        deleteGroup: jest.fn(),
        addMember: jest.fn(),
        onRemoveMember: jest.fn(),
    };

    test('without members', async () => {
        const wrapper = mount(<Group {...DEFAULT_PROPS} members={[]} selectedPrincipalId={undefined} />);

        expect(wrapper.find('.permissions-title').text()).toBe(' group1 ');
        expect(wrapper.find('.container-expandable-heading').last().text()).toBe('0 members');
        expect(wrapper.find(MemberButtons)).toHaveLength(0);

        wrapper.find('.container-expandable-grey').simulate('click');

        expect(wrapper.find(MemberButtons)).toHaveLength(2);
        expect(wrapper.find('.permissions-groups-members-ul').first().text()).toBe('None');
        expect(wrapper.find('.permissions-groups-members-ul').last().text()).toBe('None');
        expect(wrapper.find(DisableableButton).prop('disabledMsg')).toBe(undefined);
        const options = wrapper.find(SelectInputImpl).prop('options');
        expect(options[0]).toStrictEqual({ label: 'Site Groups', options: [SITE_GROUP] });
        expect(options[1]).toStrictEqual({ label: 'Project Groups', options: [PROJECT_GROUP2, PROJECT_GROUP3] });
        expect(options[2]).toStrictEqual({ label: 'Users', options: [EDITOR, FOLDER_ADMIN] });

        wrapper.unmount();
    });

    test('with members', () => {
        const wrapper = mount(<Group {...DEFAULT_PROPS} members={MEMBERS} selectedPrincipalId={1009} />);

        expect(wrapper.find('.container-expandable-heading').last().text()).toBe('3 members');

        wrapper.find('.container-expandable-grey').simulate('click');

        expect(wrapper.find('.permissions-groups-members-ul').first().children()).toHaveLength(2);
        expect(wrapper.find('.permissions-groups-members-ul').last().children()).toHaveLength(1);
        expect(wrapper.find(DisableableButton).last().prop('disabledMsg')).toBe(
            'To delete this group, first remove all members.'
        );
        const options = wrapper.find(SelectInputImpl).prop('options');
        expect(options[0]).toStrictEqual({ label: 'Groups', options: [PROJECT_GROUP3] });
        expect(options[1]).toStrictEqual({ label: 'Users', options: [FOLDER_ADMIN] });

        wrapper.unmount();
    });
});
