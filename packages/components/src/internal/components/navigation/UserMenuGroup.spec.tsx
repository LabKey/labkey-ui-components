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
import { mount, ReactWrapper, shallow } from 'enzyme';

import { Dropdown, DropdownButton, MenuItem } from 'react-bootstrap';

import { User } from '../base/models/User';

import { UserMenuGroupImpl } from './UserMenuGroup';
import { MenuSectionModel } from './model';

beforeAll(() => {
    LABKEY.devMode = false;
});

describe('UserMenuGroup', () => {
    const section = MenuSectionModel.create({
        key: 'user',
        label: 'Your Items',
        url: undefined,
        items: [
            {
                key: 'profile',
                label: 'Profile',
                url: 'profile/link/here',
                requiresLogin: true,
            },
            {
                key: 'docs',
                label: 'Documentation',
                url: 'http://show/me/the/docs',
                requiresLogin: false,
            },
        ],
        sectionKey: 'user',
    });

    const noHelpSection = MenuSectionModel.create({
        key: 'user',
        label: 'Your Items',
        url: undefined,
        items: [
            {
                key: 'profile',
                label: 'Profile',
                url: 'profile/link/here',
                requiresLogin: true,
            },
            {
                key: 'notdocs',
                label: 'Documentation',
                url: 'http://show/me/the/docs',
                requiresLogin: false,
            },
        ],
        sectionKey: 'user',
    });

    const withAdmins = MenuSectionModel.create({
        key: 'user',
        label: 'Your Items',
        url: undefined,
        items: [
            {
                key: 'profile',
                label: 'Profile',
                url: 'profile/link/here',
                requiresLogin: true,
            },
            {
                key: 'adminsetting',
                label: 'Application Settings',
                url: 'settings',
                requiresLogin: true,
            },
            {
                key: 'docs',
                label: 'Documentation',
                url: 'http://show/me/the/docs',
                requiresLogin: false,
            },
        ],
        sectionKey: 'user',
    });

    function verify(wrapper: ReactWrapper, userOptions?: string[], adminOptions?: string[], help?: boolean) {
        const userMenu = wrapper.find(Dropdown);
        const userMenuOptions = userMenu.at(0).find(MenuItem);
        expect(userMenuOptions).toHaveLength(userOptions?.length);
        for (let i = 0; i < userOptions.length; i++) {
            expect(userMenuOptions.at(i).text()).toEqual(userOptions[i]);
        }

        if (adminOptions?.length > 0) {
            const adminMenu = wrapper.find(DropdownButton);
            expect(adminMenu).toHaveLength(1);
            const adminMenuOptions = adminMenu.find(MenuItem);
            expect(adminMenuOptions).toHaveLength(adminOptions?.length);
            for (let i = 0; i < adminOptions.length; i++) {
                expect(adminMenuOptions.at(i).text()).toEqual(adminOptions[i]);
            }
        }

        expect(wrapper.find('#nav-help-button').length).toEqual(help ? 1 : 0);
    }

    test('not initialized', () => {
        const model = new MenuSectionModel({});
        const tree = mount(<UserMenuGroupImpl model={model} user={new User()} />);
        expect(tree).toEqual({});
    });

    test('user not logged in', () => {
        const user = new User({
            isSignedIn: false,
        });

        const tree = mount(<UserMenuGroupImpl model={section} user={user} />);
        verify(tree, ['', 'Sign In'], null, true);
    });

    test('no help icon', () => {
        const user = new User({
            isSignedIn: false,
        });

        const tree = mount(<UserMenuGroupImpl model={noHelpSection} user={user} />);
        verify(tree, ['Documentation', '', 'Sign In'], null, false);
    });

    test('with admin items', () => {
        const user = new User({
            isSignedIn: true,
        });

        const tree = mount(<UserMenuGroupImpl model={withAdmins} user={user} isAppHome={true}/>);

        verify(tree, ['Profile', '', /* divider*/ 'Sign Out'], ['Application Settings'], true);
    });

    test('with admin items, not isAppHome', () => {
        const user = new User({
            isSignedIn: true,
        });

        const tree = mount(<UserMenuGroupImpl model={withAdmins} user={user} isAppHome={false}/>);

        verify(tree, ['Profile', '', /* divider*/ 'Sign Out'], ['Application Settings', 'Project Settings'], true);
    });

    test('user logged in, but not in dev mode', () => {
        const user = new User({
            isSignedIn: true,
        });

        const tree = mount(<UserMenuGroupImpl model={section} user={user} />);
        verify(tree, ['Profile', '', /* divider*/ 'Sign Out'], null, true);
    });

    test('user logged in dev mode', () => {
        const user = new User({
            isSignedIn: true,
        });
        LABKEY.devMode = true;

        const tree = mount(<UserMenuGroupImpl model={section} user={user} />);
        verify(tree, ['Profile', '', /* divider*/ 'Sign Out'], ['Dev Tools', 'Enable Redux Tools'], true);
    });

    test('user logged in extra items', () => {
        const user = new User({
            isSignedIn: true,
        });

        const extraUserItems = (
            <>
                <MenuItem key="e1">Extra One</MenuItem>
                <MenuItem key="e2">Extra Two</MenuItem>
            </>
        );
        const tree = mount(<UserMenuGroupImpl model={section} user={user} extraUserItems={extraUserItems} />);

        verify(tree, ['Profile', 'Extra One', 'Extra Two', '', /* divider*/ 'Sign Out'], null, true);
    });

    test('user logged in extra dev mode items', () => {
        const user = new User({
            isSignedIn: true,
        });

        const extraUserItems = (
            <>
                <MenuItem key="e1">Extra One</MenuItem>
                <MenuItem key="e2">Extra Two</MenuItem>
            </>
        );
        const extraDevItems = (
            <>
                <MenuItem key="d1">Extra Dev One</MenuItem>
                <MenuItem key="d2">Extra Dev Two</MenuItem>
            </>
        );

        LABKEY.devMode = true;
        const tree = mount(
            <UserMenuGroupImpl
                extraDevItems={extraDevItems}
                extraUserItems={extraUserItems}
                model={section}
                user={user}
            />
        );

        verify(
            tree,
            ['Profile', 'Extra One', 'Extra Two', '', /* divider*/ 'Sign Out'],
            ['Dev Tools', 'Enable Redux Tools', 'Extra Dev One', 'Extra Dev Two'],
            true
        );
    });
});
