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
import { List } from 'immutable';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { User } from '../../..';

import { UserMenu } from './UserMenu';
import { MenuSectionModel, ProductMenuModel } from './model';

beforeAll(() => {
    LABKEY.devMode = false;
});

describe('UserMenu', () => {
    const sections = List([
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
        }),
    ]);

    test('not initialized', () => {
        const model = new ProductMenuModel({
            productIds: ['testProduct'],
        });
        const tree = mount(<UserMenu model={model} user={new User()} showSwitchToLabKey />);
        expect(tree).toEqual({});
    });

    test('user not logged in', () => {
        const productIds = ['notLoggedInUser'];
        const user = new User({
            isSignedIn: false,
        });

        const model = new ProductMenuModel({
            isLoaded: true,
            isLoading: false,
            productIds,
            sections,
        });
        const tree = renderer.create(<UserMenu model={model} user={user} showSwitchToLabKey />);
        expect(tree).toMatchSnapshot();
    });

    test('user logged in, but not in dev mode', () => {
        const productIds = ['loggedInUser'];
        const user = new User({
            isSignedIn: true,
        });

        const model = new ProductMenuModel({
            isLoaded: true,
            isLoading: false,
            productIds,
            sections,
        });
        const tree = renderer.create(<UserMenu model={model} user={user} showSwitchToLabKey />);
        expect(tree).toMatchSnapshot();
    });

    test('user logged in dev mode', () => {
        const productIds = ['logginedInDevMode'];
        const user = new User({
            isSignedIn: true,
        });
        LABKEY.devMode = true;
        const model = new ProductMenuModel({
            isLoaded: true,
            isLoading: false,
            productIds,
            sections,
        });
        const tree = renderer.create(<UserMenu model={model} user={user} showSwitchToLabKey />);
        expect(tree).toMatchSnapshot();
    });

    test('user logged in extra items', () => {
        const productIds = ['extraUserItems'];
        const user = new User({
            isSignedIn: true,
        });

        const model = new ProductMenuModel({
            isLoaded: true,
            isLoading: false,
            productIds,
            sections,
        });
        const extraUserItems = [<div key="e1">Extra One</div>, <div key="e2">Extra Two</div>];
        const tree = renderer.create(
            <UserMenu model={model} user={user} showSwitchToLabKey extraUserItems={extraUserItems} />
        );
        expect(tree).toMatchSnapshot();
    });

    test('user logged in, without switch to labkey', () => {
        const productIds = ['switchToLabkey'];
        const user = new User({
            isSignedIn: true,
        });

        const model = new ProductMenuModel({
            isLoaded: true,
            isLoading: false,
            productIds,
            sections,
        });
        const tree = renderer.create(<UserMenu model={model} user={user} showSwitchToLabKey={false} />);
        expect(tree).toMatchSnapshot();
    });

    test('user logged in extra dev mode items', () => {
        const productIds = ['extraDevItems'];
        const user = new User({
            isSignedIn: true,
        });

        const model = new ProductMenuModel({
            isLoaded: true,
            isLoading: false,
            productIds,
            sections,
        });
        const extraUserItems = [<div key="e1">Extra One</div>, <div key="e2">Extra Two</div>];
        const extraDevItems = [<div key="e1">Extra Dev One</div>, <div key="e2">Extra Dev Two</div>];
        const tree = renderer.create(
            <UserMenu
                extraDevItems={extraDevItems}
                extraUserItems={extraUserItems}
                model={model}
                showSwitchToLabKey
                user={user}
            />
        );
        expect(tree).toMatchSnapshot();
    });
});
