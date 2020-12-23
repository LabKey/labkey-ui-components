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

import { NavigationBar } from './NavigationBar';
import { mount } from 'enzyme';
import { TEST_USER_GUEST, TEST_USER_READER } from '../../../test/data/users';
import { ServerNotifications } from '../notifications/ServerNotifications';
import { MenuSectionModel, ProductMenuModel } from './model';
import { List } from 'immutable';
import { markAllNotificationsRead } from '../../../test/data/notificationData';
import {ServerNotificationModel} from "../notifications/model";

describe('<NavigationBar/>', () => {
    const productMenuModel = new ProductMenuModel({
        productIds: ['testNavBar'],
        isLoaded: true,
        isLoading: false,
        sections: List<MenuSectionModel>(),
    });

    const notificationsConfig = {
        maxRows: 1,
        markAllNotificationsRead: markAllNotificationsRead,
        serverActivity: new ServerNotificationModel(),
    };

    test('default props', () => {
        const component = <NavigationBar model={null} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with search box', () => {
        const component = <NavigationBar model={null} showSearchBox={true} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with notifications no user', () => {
        const component = mount(<NavigationBar model={productMenuModel} notificationsConfig={notificationsConfig} />);
        expect(component.find(ServerNotifications)).toHaveLength(0);
        component.unmount();
    });

    test('with notifications, guest user', () => {
        const component = mount(
            <NavigationBar model={productMenuModel} user={TEST_USER_GUEST} notificationsConfig={notificationsConfig} />
        );
        expect(component.find(ServerNotifications)).toHaveLength(0);
        component.unmount();
    });

    test('with notifications, non-guest user', () => {
        const component = mount(
            <NavigationBar model={productMenuModel} user={TEST_USER_READER} notificationsConfig={notificationsConfig} />
        );
        expect(component.find(ServerNotifications)).toHaveLength(1);
        component.unmount();
    });
});
