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
import { mount, ReactWrapper } from 'enzyme';
import { List } from 'immutable';

import { TEST_USER_GUEST, TEST_USER_READER } from '../../../test/data/users';
import { ServerNotifications } from '../notifications/ServerNotifications';

import { markAllNotificationsRead } from '../../../test/data/notificationData';
import { ServerNotificationModel } from '../notifications/model';

import { MenuSectionModel, ProductMenuModel } from './model';

import { NavigationBar } from './NavigationBar';
import { UserMenu } from "./UserMenu";
import { ProductMenu } from "./ProductMenu";
import { SearchBox } from "./SearchBox";
import { ProductNavigation } from "../productnavigation/ProductNavigation";
import moment from "moment";


beforeEach(() => {
    LABKEY.devMode = false;
    LABKEY.moduleContext = { samplemanagement: { hasPremiumModule: false } };
});

describe('<NavigationBar/>', () => {
    const productMenuModel = new ProductMenuModel({
        productIds: ['testNavBar'],
        isLoaded: true,
        isLoading: false,
        sections: List<MenuSectionModel>(),
    });

    const notificationsConfig = {
        maxRows: 1,
        markAllNotificationsRead,
        serverActivity: new ServerNotificationModel(),
        onViewAll: jest.fn(),
    };

    test('default props', () => {
        const component = <NavigationBar model={null} />;

        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
    });

    test('with search box', () => {
        const component = <NavigationBar model={null} showSearchBox={true} />;

        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
    });

    function validate(wrapper: ReactWrapper, compCounts?: Record<string, number>) {
        expect(wrapper.find('.project-name')).toHaveLength(compCounts?.ProjectName ?? 0);
        expect(wrapper.find(ProductMenu)).toHaveLength(compCounts?.ProductMenu ?? 0);
        expect(wrapper.find(UserMenu)).toHaveLength(compCounts?.UserMenu ?? 0);
        expect(wrapper.find(SearchBox)).toHaveLength(compCounts?.SearchBox ?? 0);
        expect(wrapper.find('.navbar__xs-search-icon')).toHaveLength(compCounts?.SearchBox ?? 0);
        expect(wrapper.find(ServerNotifications)).toHaveLength(compCounts?.ServerNotifications ?? 0);
        expect(wrapper.find(ProductNavigation)).toHaveLength(compCounts?.ProductNavigation ?? 0);
    }

    test('with notifications no user', () => {
        const component = mount(<NavigationBar model={productMenuModel} notificationsConfig={notificationsConfig} />);
        validate(component, { ProductMenu: 1, ServerNotifications: 0 });
        component.unmount();
    });

    test('with notifications, guest user', () => {
        const component = mount(
            <NavigationBar model={productMenuModel} user={TEST_USER_GUEST} notificationsConfig={notificationsConfig} />
        );
        validate(component, { ProductMenu: 1, UserMenu: 1, ServerNotifications: 0 });
        component.unmount();
    });

    test('with notifications, non-guest user', () => {
        const component = mount(
            <NavigationBar model={productMenuModel} user={TEST_USER_READER} notificationsConfig={notificationsConfig} />
        );
        validate(component, { ProductMenu: 1, UserMenu: 1, ServerNotifications: 1 });
        component.unmount();
    });

    test('show ProductNavigation for devMode', () => {
        LABKEY.devMode = true;
        const component = mount(
            <NavigationBar model={null} />
        );
        validate(component, { ProductNavigation: 1 });
        component.unmount();
    });

    test('show ProductNavigation for hasPremiumModule', () => {
        LABKEY.moduleContext = { samplemanagement: { hasPremiumModule: true } };
        const component = mount(
            <NavigationBar model={null} />
        );
        validate(component, { ProductNavigation: 1 });
        component.unmount();
    });
});
