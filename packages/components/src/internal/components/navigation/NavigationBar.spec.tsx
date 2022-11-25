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
import { ReactWrapper } from 'enzyme';
import { List } from 'immutable';

import { TEST_USER_APP_ADMIN, TEST_USER_GUEST, TEST_USER_READER } from '../../userFixtures';
import { ServerNotifications } from '../notifications/ServerNotifications';

import { mountWithAppServerContext } from '../../testHelpers';
import { markAllNotificationsRead } from '../../../test/data/notificationData';
import { ServerNotificationModel } from '../notifications/model';

import { FindAndSearchDropdown } from '../search/FindAndSearchDropdown';
import { ProductNavigation } from '../productnavigation/ProductNavigation';

import { SearchBox } from '../search/SearchBox';

import { MenuSectionModel, ProductMenuModel } from './model';

import { NavigationBar } from './NavigationBar';
import { UserMenu } from './UserMenu';
import { ProductMenu } from './ProductMenu';

describe('NavigationBar', () => {
    const productMenuModel = new ProductMenuModel({
        productIds: ['testNavBar'],
        isLoaded: true,
        isLoading: false,
        sections: List<MenuSectionModel>(),
    });

    function validate(wrapper: ReactWrapper, compCounts: Record<string, number> = {}): void {
        expect(wrapper.find('.project-name')).toHaveLength(compCounts.ProjectName ?? 0);
        expect(wrapper.find(ProductMenu)).toHaveLength(compCounts.ProductMenu ?? 1);
        expect(wrapper.find(UserMenu)).toHaveLength(compCounts.UserMenu ?? 0);
        expect(wrapper.find(SearchBox)).toHaveLength(compCounts.SearchBox ?? 0);
        expect(wrapper.find('.navbar__xs-search-icon')).toHaveLength(compCounts.SearchBox ?? 0);
        expect(wrapper.find(ServerNotifications)).toHaveLength(compCounts.ServerNotifications ?? 0);
        expect(wrapper.find(ProductNavigation)).toHaveLength(compCounts.ProductNavigation ?? 0);
        expect(wrapper.find(FindAndSearchDropdown)).toHaveLength(compCounts.FindAndSearchDropdown ?? 0);
    }

    const notificationsConfig = {
        maxRows: 1,
        markAllNotificationsRead,
        serverActivity: new ServerNotificationModel(),
        onViewAll: jest.fn(),
    };

    test('default props', () => {
        const component = mountWithAppServerContext(<NavigationBar model={productMenuModel} />);
        validate(component);
        component.unmount();
    });

    test('with search box', () => {
        const component = mountWithAppServerContext(<NavigationBar model={productMenuModel} showSearchBox />);
        validate(component, { SearchBox: 1 });
        component.unmount();
    });

    test('with findByIds', () => {
        const component = mountWithAppServerContext(
            <NavigationBar model={productMenuModel} onFindByIds={jest.fn} showSearchBox />
        );
        validate(component, { FindAndSearchDropdown: 2, SearchBox: 1 });
        component.unmount();
    });

    test('without search but with findByIds', () => {
        const component = mountWithAppServerContext(
            <NavigationBar model={productMenuModel} onFindByIds={jest.fn} showSearchBox={false} />
        );
        validate(component, { FindAndSearchDropdown: 0, SearchBox: 0 });
        component.unmount();
    });

    test('with notifications no user', () => {
        const component = mountWithAppServerContext(
            <NavigationBar model={productMenuModel} notificationsConfig={notificationsConfig} />
        );
        validate(component, { ServerNotifications: 0 });
        component.unmount();
    });

    test('with notifications, guest user', () => {
        const component = mountWithAppServerContext(
            <NavigationBar model={productMenuModel} user={TEST_USER_GUEST} notificationsConfig={notificationsConfig} />
        );
        validate(component, { UserMenu: 1, ServerNotifications: 0 });
        component.unmount();
    });

    test('with notifications, non-guest user', () => {
        const component = mountWithAppServerContext(
            <NavigationBar model={productMenuModel} user={TEST_USER_READER} notificationsConfig={notificationsConfig} />
        );
        validate(component, { UserMenu: 1, ServerNotifications: 1 });
        component.unmount();
    });

    test('show ProductNavigation for hasPremiumModule, non-admin', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['premium'], applicationMenuDisplayMode: 'ALWAYS' } };
        const component = mountWithAppServerContext(<NavigationBar model={productMenuModel} user={TEST_USER_READER} />);
        validate(component, { UserMenu: 1, ProductNavigation: 1 });
        component.unmount();
    });

    test('hide ProductNavigation for non-admin', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['premium'], applicationMenuDisplayMode: 'ADMIN' } };
        const component = mountWithAppServerContext(<NavigationBar model={productMenuModel} user={TEST_USER_READER} />);
        validate(component, { UserMenu: 1, ProductNavigation: 0 });
        component.unmount();
    });

    test('show ProductNavigation for hasPremiumModule, admin always', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['premium'], applicationMenuDisplayMode: 'ALWAYS' } };
        const component = mountWithAppServerContext(
            <NavigationBar model={productMenuModel} user={TEST_USER_APP_ADMIN} />
        );
        validate(component, { UserMenu: 1, ProductNavigation: 1 });
        component.unmount();
    });

    test('show ProductNavigation for hasPremiumModule, admin only', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['premium'], applicationMenuDisplayMode: 'ADMIN' } };
        const component = mountWithAppServerContext(
            <NavigationBar model={productMenuModel} user={TEST_USER_APP_ADMIN} />
        );
        validate(component, { UserMenu: 1, ProductNavigation: 1 });
        component.unmount();
    });
});
