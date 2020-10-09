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
import moment from 'moment';
import renderer from 'react-test-renderer';

import { mount, shallow } from 'enzyme';

import { User } from '../../..';

import { notificationInit } from '../../../test/setupUtils';

import { Notification } from './Notification';
import { createNotification } from './actions';
import { NotificationItemModel } from './model';
import { NotificationItem } from './NotificationItem';

beforeEach(() => {
    notificationInit();
});

describe('<Notification/>', () => {
    test('no notifications', () => {
        const tree = renderer.create(<Notification user={new User()} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('no notification with header', () => {
        const tree = renderer.create(<Notification notificationHeader="Header message" user={new User()} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('one notification', () => {
        createNotification(
            new NotificationItemModel({
                alertClass: 'success',
                id: 'one_notification',
                message: 'one is the loneliest number',
            })
        );
        const notification = shallow(<Notification user={new User()} />);
        expect(notification.find(NotificationItem)).toHaveLength(1);
        expect(notification).toMatchSnapshot();
    });

    test('multiple notification classes', () => {
        createNotification(
            new NotificationItemModel({
                alertClass: 'info',
                id: 'info1',
                message: 'info message 1',
            })
        );
        createNotification(
            new NotificationItemModel({
                alertClass: 'info',
                id: 'info2',
                message: 'info message 2',
            })
        );
        createNotification('default message class');
        createNotification(
            new NotificationItemModel({
                alertClass: 'danger',
                id: 'danger1',
                message: 'Danger, Will Robinson!',
            })
        );
        const notifications = shallow(<Notification user={new User()} />);
        expect(notifications.find(NotificationItem)).toHaveLength(4);
        expect(notifications.find('.notification-container')).toHaveLength(3);
        expect(notifications).toMatchSnapshot();
    });

    test('with trial notification for non-admin', () => {
        LABKEY.moduleContext = {
            trialservices: {
                trialEndDate: moment().add(1, 'days').format('YYYY-MM-DD'),
                upgradeLink: 'your/link/to/the/future',
                upgradeLinkText: 'Upgrade now',
            },
        };
        const notifications = mount(<Notification user={new User()} />);
        expect(notifications.find(NotificationItem)).toHaveLength(1);
        expect(notifications.find('a')).toHaveLength(0);
        expect(notifications).toMatchSnapshot();
        notifications.unmount();
    });

    test('with trial notification for admin', () => {
        LABKEY.moduleContext = {
            trialservices: {
                trialEndDate: moment().add(1, 'days').format('YYYY-MM-DD'),
                upgradeLink: 'your/link/to/the/future',
                upgradeLinkText: 'Upgrade now',
            },
        };
        const notifications = mount(<Notification user={new User({ isAdmin: true })} />);
        expect(notifications.find(NotificationItem)).toHaveLength(1);
        expect(notifications.find('a')).toHaveLength(1);
        expect(notifications).toMatchSnapshot();
        notifications.unmount();
    });
});
