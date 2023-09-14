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
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { User } from '../base/models/User';

import { UserMenuGroupImpl } from './UserMenuGroup';
import { MenuSectionModel } from './model';

beforeAll(() => {
    LABKEY.devMode = false;
});

describe('UserMenuGroup', () => {
    const section =
        MenuSectionModel.create({
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
        })

    test('not initialized', () => {
        const model = new MenuSectionModel({
        });
        const tree = mount(<UserMenuGroupImpl model={model} user={new User()} />);
        expect(tree).toEqual({});
    });

    test('user not logged in', () => {
        const user = new User({
            isSignedIn: false,
        });

        const tree = renderer.create(<UserMenuGroupImpl model={section} user={user} />);
        expect(tree).toMatchSnapshot();
    });

    test('user logged in, but not in dev mode', () => {
        const user = new User({
            isSignedIn: true,
        });

        const tree = renderer.create(<UserMenuGroupImpl model={section} user={user} />);
        expect(tree).toMatchSnapshot();
    });

    test('user logged in dev mode', () => {
        const user = new User({
            isSignedIn: true,
        });
        LABKEY.devMode = true;

        const tree = renderer.create(<UserMenuGroupImpl model={section} user={user} />);
        expect(tree).toMatchSnapshot();
    });

    test('user logged in extra items', () => {
        const productIds = ['extraUserItems'];
        const user = new User({
            isSignedIn: true,
        });

        const extraUserItems = [<div key="e1">Extra One</div>, <div key="e2">Extra Two</div>];
        const tree = renderer.create(<UserMenuGroupImpl model={section} user={user} extraUserItems={extraUserItems} />);
        expect(tree).toMatchSnapshot();
    });

    test('user logged in extra dev mode items', () => {
        const productIds = ['extraDevItems'];
        const user = new User({
            isSignedIn: true,
        });

        const extraUserItems = [<div key="e1">Extra One</div>, <div key="e2">Extra Two</div>];
        const extraDevItems = [<div key="e1">Extra Dev One</div>, <div key="e2">Extra Dev Two</div>];
        const tree = renderer.create(
            <UserMenuGroupImpl extraDevItems={extraDevItems} extraUserItems={extraUserItems} model={section} user={user} />
        );
        expect(tree).toMatchSnapshot();
    });
});
