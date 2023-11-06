/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { mount } from 'enzyme';

import { getRolesByUniqueName, processGetRolesResponse, UserLimitSettings } from '../permissions/actions';
import policyJSON from '../../../test/data/security-getPolicy.json';
import rolesJSON from '../../../test/data/security-getRoles.json';
import { TEST_USER_APP_ADMIN, TEST_USER_FOLDER_ADMIN, TEST_USER_PROJECT_ADMIN } from '../../userFixtures';

import { SecurityPolicy } from '../permissions/models';
import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SCHEMAS } from '../../schemas';
import { QueryInfo } from '../../../public/QueryInfo';

import { DisableableButton } from '../buttons/DisableableButton';

import { UsersGridPanelImpl } from './UsersGridPanel';

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

describe('<UsersGridPanel/>', () => {
    const DEFAULT_PROPS = {
        user: TEST_USER_APP_ADMIN,
        onCreateComplete: jest.fn(),
        onUsersStateChangeComplete: jest.fn(),
        policy: POLICY,
        rolesByUniqueName: ROLES_BY_NAME,
        actions: makeTestActions(),
        queryModels: {
            'user-management-users-all': makeTestQueryModel(
                SCHEMAS.CORE_TABLES.USERS,
                new QueryInfo(),
                {},
                [],
                0,
                'user-management-users-all'
            ),
            'user-management-users-active': makeTestQueryModel(
                SCHEMAS.CORE_TABLES.USERS,
                new QueryInfo(),
                {},
                [],
                0,
                'user-management-users-active'
            ),
            'user-management-users-inactive': makeTestQueryModel(
                SCHEMAS.CORE_TABLES.USERS,
                new QueryInfo(),
                {},
                [],
                0,
                'user-management-users-inactive'
            ),
        },
    };

    test('active users view', () => {
        const component = <UsersGridPanelImpl {...DEFAULT_PROPS} />;

        const wrapper = mount(component);
        expect(wrapper.find('GridPanel')).toHaveLength(1);
        expect(wrapper.find('UserDetailsPanel')).toHaveLength(1);
        expect(wrapper.find('.view-header').first().text()).toBe('Active Users');
        expect(wrapper.find(DisableableButton)).toHaveLength(1); // create button
        expect(wrapper.find(DisableableButton).prop('disabledMsg')).toBe(undefined);
        expect(wrapper.find('#users-manage-btn-managebtn').hostNodes()).toHaveLength(1);
        wrapper.find('#users-manage-btn-managebtn').hostNodes().simulate('click');
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Deactivate Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Reactivate Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Delete Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Inactive Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Active Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View All Users')).toHaveLength(1);
        wrapper.unmount();
    });

    test('without delete or deactivate', () => {
        const component = <UsersGridPanelImpl {...DEFAULT_PROPS} user={TEST_USER_PROJECT_ADMIN} />;

        const wrapper = mount(component);
        expect(wrapper.find('GridPanel')).toHaveLength(1);
        expect(wrapper.find('UserDetailsPanel')).toHaveLength(1);
        expect(wrapper.find('.view-header').first().text()).toBe('Active Users');
        expect(wrapper.find(DisableableButton)).toHaveLength(1); // create button
        expect(wrapper.find('#users-manage-btn-managebtn').hostNodes()).toHaveLength(1);
        wrapper.find('#users-manage-btn-managebtn').hostNodes().simulate('click');
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Deactivate Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Reactivate Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Delete Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Inactive Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Active Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View All Users')).toHaveLength(1);
        wrapper.unmount();
    });

    test('without create, delete, or deactivate', () => {
        const component = <UsersGridPanelImpl {...DEFAULT_PROPS} user={TEST_USER_FOLDER_ADMIN} />;

        const wrapper = mount(component);
        expect(wrapper.find('GridPanel')).toHaveLength(1);
        expect(wrapper.find('UserDetailsPanel')).toHaveLength(1);
        expect(wrapper.find('.view-header').first().text()).toBe('Active Users');
        expect(wrapper.find(DisableableButton)).toHaveLength(0); // create button
        expect(wrapper.find('#users-manage-btn-managebtn').hostNodes()).toHaveLength(1);
        wrapper.find('#users-manage-btn-managebtn').hostNodes().simulate('click');
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Deactivate Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Reactivate Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Delete Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Inactive Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Active Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View All Users')).toHaveLength(1);
        wrapper.unmount();
    });

    test('inactive users view', () => {
        const component = <UsersGridPanelImpl {...DEFAULT_PROPS} />;

        const wrapper = mount(component);
        wrapper.setState({ usersView: 'inactive' });

        expect(wrapper.find('GridPanel')).toHaveLength(1);
        expect(wrapper.find('UserDetailsPanel')).toHaveLength(1);
        expect(wrapper.find('.view-header').first().text()).toBe('Inactive Users');
        expect(wrapper.find(DisableableButton)).toHaveLength(1); // create button
        expect(wrapper.find('#users-manage-btn-managebtn').hostNodes()).toHaveLength(1);
        wrapper.find('#users-manage-btn-managebtn').hostNodes().simulate('click');
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Deactivate Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Reactivate Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Delete Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Inactive Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Active Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View All Users')).toHaveLength(1);
        wrapper.unmount();
    });

    test('all users view', () => {
        const component = <UsersGridPanelImpl {...DEFAULT_PROPS} />;

        const wrapper = mount(component);
        wrapper.setState({ usersView: 'all' });

        expect(wrapper.find('GridPanel')).toHaveLength(1);
        expect(wrapper.find('UserDetailsPanel')).toHaveLength(1);
        expect(wrapper.find('.view-header').first().text()).toBe('All Users');
        expect(wrapper.find(DisableableButton)).toHaveLength(1); // create button
        expect(wrapper.find('#users-manage-btn-managebtn').hostNodes()).toHaveLength(1);
        wrapper.find('#users-manage-btn-managebtn').hostNodes().simulate('click');
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Deactivate Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Reactivate Users')).toHaveLength(0);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'Delete Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Inactive Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View Active Users')).toHaveLength(1);
        expect(wrapper.find('a').filterWhere(a => a.text() === 'View All Users')).toHaveLength(0);
        wrapper.unmount();
    });

    test('active user limit reached', () => {
        const component = (
            <UsersGridPanelImpl
                {...DEFAULT_PROPS}
                userLimitSettings={{ userLimit: true, remainingUsers: 0 } as UserLimitSettings}
            />
        );
        const wrapper = mount(component);
        wrapper.setState({ usersView: 'inactive' });
        expect(wrapper.find(DisableableButton)).toHaveLength(1); // create button
        expect(wrapper.find(DisableableButton).prop('disabledMsg')).toBe('User limit has been reached');
        wrapper.find('#users-manage-btn-managebtn').hostNodes().simulate('click');
        const reactivateMenuItem = wrapper.find('#reactivate-users-menu-item');
        expect(reactivateMenuItem.prop('maxSelection')).toBe(0);
        expect(reactivateMenuItem.prop('maxSelectionDisabledMsg')).toBe('User limit has been reached');
        wrapper.unmount();
    });

    test('active user limit not reached', () => {
        const component = (
            <UsersGridPanelImpl
                {...DEFAULT_PROPS}
                userLimitSettings={{ userLimit: true, remainingUsers: 2 } as UserLimitSettings}
            />
        );
        const wrapper = mount(component);
        wrapper.setState({ usersView: 'inactive' });
        expect(wrapper.find(DisableableButton)).toHaveLength(1); // create button
        expect(wrapper.find(DisableableButton).prop('disabledMsg')).toBe(undefined);
        wrapper.find('#users-manage-btn-managebtn').hostNodes().simulate('click');
        const reactivateMenuItem = wrapper.find('#reactivate-users-menu-item');
        expect(reactivateMenuItem.prop('maxSelection')).toBe(2);
        expect(reactivateMenuItem.prop('maxSelectionDisabledMsg')).toBe(undefined);
        wrapper.unmount();
    });

    test('active user limit disabled', () => {
        const component = (
            <UsersGridPanelImpl
                {...DEFAULT_PROPS}
                userLimitSettings={{ userLimit: false, remainingUsers: 0 } as UserLimitSettings}
            />
        );
        const wrapper = mount(component);
        expect(wrapper.find(DisableableButton)).toHaveLength(1); // create button
        expect(wrapper.find(DisableableButton).prop('disabledMsg')).toBe(undefined);
        wrapper.unmount();
    });

    test('showDetailsPanel false', () => {
        const component = <UsersGridPanelImpl {...DEFAULT_PROPS} showDetailsPanel={false} />;
        const wrapper = mount(component);
        expect(wrapper.find('UserDetailsPanel')).toHaveLength(0);
        wrapper.unmount();
    });

    test('loading', () => {
        const component = <UsersGridPanelImpl {...DEFAULT_PROPS} queryModels={{}} />;
        const wrapper = mount(component);
        expect(wrapper.find('LoadingSpinner')).toHaveLength(1);
        expect(wrapper.find('GridPanel')).toHaveLength(0);
        wrapper.unmount();
    });
});
