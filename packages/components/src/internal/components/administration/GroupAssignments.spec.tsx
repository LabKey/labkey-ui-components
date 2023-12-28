import React from 'react';
import { fromJS, List, Map } from 'immutable';
import { Button } from 'react-bootstrap';
import PanelBody from 'react-bootstrap/lib/PanelBody';

import { Principal, SecurityPolicy } from '../permissions/models';
import policyJSON from '../../../test/data/security-getPolicy.json';
import { getRolesByUniqueName, processGetRolesResponse } from '../permissions/actions';
import rolesJSON from '../../../test/data/security-getRoles.json';

import { JEST_SITE_ADMIN_USER_ID } from '../../../test/data/constants';

import { ExpandableContainer } from '../ExpandableContainer';

import { Alert } from '../base/Alert';

import { mountWithServerContext } from '../../test/enzymeTestHelpers';
import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { MemberType } from './models';
import { GroupAssignments } from './GroupAssignments';

describe('GroupAssignments', () => {
    const GROUP_MEMBERSHIP = {
        '1035': {
            groupName: 'NewSiteGroup',
            members: [
                {
                    name: 'rosalinep@labkey.com (rosalinep)',
                    id: 1005,
                    type: MemberType.user,
                },
            ],
            type: MemberType.siteGroup,
        },
        '1064': {
            groupName: 'group1',
            members: [
                {
                    name: 'group2',
                    id: 1066,
                    type: MemberType.group,
                },
                {
                    name: 'rosalinep@labkey.com (rosalinep)',
                    id: 1005,
                    type: MemberType.user,
                },
            ],
            type: MemberType.group,
        },
        '1066': {
            groupName: 'group2',
            members: [
                {
                    name: 'aaaaaaaaa@labkey.com (aaaaaaaaa)',
                    id: 1033,
                    type: MemberType.user,
                },
                {
                    name: 'folderadmin@labkey.com (folderadmin)',
                    id: 1008,
                    type: MemberType.user,
                },
                {
                    name: 'FromMyBiologicsSiteGroup',
                    id: 1110,
                    type: MemberType.group,
                },
            ],
            type: MemberType.group,
        },
        '-1': {
            groupName: 'Site Administrators',
            members: [],
            type: MemberType.siteGroup,
        },
    };

    const ROLES = processGetRolesResponse(rolesJSON.roles);
    const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

    const GROUP = Principal.createFromSelectRow(
        fromJS({
            UserId: { value: 11842 },
            Type: { value: MemberType.group },
            Name: { value: 'Editor User Group' },
        })
    );
    const USER = Principal.createFromSelectRow(
        fromJS({
            UserId: { value: JEST_SITE_ADMIN_USER_ID },
            Type: { value: MemberType.user },
            Name: { value: 'cnathe@labkey.com' },
            DisplayName: { value: 'Cory Nathe' },
        })
    );
    const PRINCIPALS_BY_ID = List<Principal>([GROUP, USER]).reduce((map, principal) => {
        return map.set(principal.userId, principal);
    }, Map<number, Principal>());

    const DEFAULT_PROPS = {
        groupMembership: {},
        usersAndGroups: List() as List<Principal>,
        rolesByUniqueName: ROLES_BY_NAME,
        principalsById: PRINCIPALS_BY_ID,
        policy: SecurityPolicy.create(policyJSON),
        errorMsg: undefined,
        addMembers: jest.fn(),
        createGroup: jest.fn(),
        deleteGroup: jest.fn(),
        getIsDirty: jest.fn(),
        removeMember: jest.fn(),
        save: jest.fn(),
        setErrorMsg: jest.fn(),
        setIsDirty: jest.fn(),
    };

    test('without members', async () => {
        const wrapper = mountWithServerContext(<GroupAssignments {...DEFAULT_PROPS} />, { user: TEST_USER_APP_ADMIN });

        expect(wrapper.find(PanelBody).last().text()).toBe('No user selected.');
        // 'Create Group' and 'Save' button are disabled
        expect(wrapper.find(Button).first().prop('disabled')).toBeTruthy();
        expect(wrapper.find(Button).last().prop('disabled')).toBeTruthy();
        expect(wrapper.find(ExpandableContainer)).toHaveLength(0);

        wrapper.unmount();
    });

    test('with members', async () => {
        const wrapper = mountWithServerContext(
            <GroupAssignments {...DEFAULT_PROPS} groupMembership={GROUP_MEMBERSHIP} />,
            { user: TEST_USER_APP_ADMIN }
        );

        expect(wrapper.find(ExpandableContainer)).toHaveLength(2);
        expect(wrapper.find('.permissions-title').first().text()).toBe(' group1 ');
        expect(wrapper.find('.permissions-title').last().text()).toBe(' group2 ');

        wrapper.unmount();
    });

    test('creating a group', async () => {
        const wrapper = mountWithServerContext(
            <GroupAssignments {...DEFAULT_PROPS} groupMembership={GROUP_MEMBERSHIP} />,
            { user: TEST_USER_APP_ADMIN }
        );

        // Does not create duplicate 'group1' group
        wrapper.find('.create-group__input').simulate('change', { target: { value: 'group1' } });
        expect(wrapper.find(Button).first().prop('disabled')).toBeFalsy();
        wrapper.find(Button).first().simulate('click');
        expect(DEFAULT_PROPS.createGroup).toHaveBeenCalledTimes(0);

        // Does create new 'group3' group
        wrapper.find('.create-group__input').simulate('change', { target: { value: 'group3' } });
        wrapper.find(Button).first().simulate('click');
        expect(DEFAULT_PROPS.createGroup).toHaveBeenCalledTimes(1);
        expect(wrapper.find('.create-group__input').prop('value')).toBe('');

        wrapper.unmount();
    });

    test('dirtiness', async () => {
        const wrapper = mountWithServerContext(<GroupAssignments {...DEFAULT_PROPS} />, { user: TEST_USER_APP_ADMIN });

        wrapper.find('.create-group__input').simulate('change', { target: { value: 'group3' } });
        wrapper.find(Button).first().simulate('click');
        expect(DEFAULT_PROPS.setIsDirty).toHaveBeenCalledWith(true);

        wrapper.unmount();
    });

    test('with error', async () => {
        const wrapper = mountWithServerContext(<GroupAssignments {...DEFAULT_PROPS} errorMsg="Error message." />, {
            user: TEST_USER_APP_ADMIN,
        });
        expect(wrapper.find(Alert).text()).toBe('Error message.');

        wrapper.unmount();
    });
});
