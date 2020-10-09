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

import { shallow } from 'enzyme';

import { User } from '../../..';

import { NotificationItemModel } from './model';
import { NotificationItem } from './NotificationItem';

import { initNotificationsState } from './global';
import { createNotification } from './actions';

describe('<NotificationItem />', () => {
    test('not dismissible item', () => {
        const item = new NotificationItemModel({
            message: 'A message',
            id: 'not_dismissible_item',
            isDismissible: false,
        });
        const tree = shallow(<NotificationItem item={item} user={new User()} />);
        expect(tree.find('.fa-times-circle')).toHaveLength(0);
        expect(tree).toMatchSnapshot();
    });

    test('dismissible item', () => {
        initNotificationsState();
        const onDismiss = jest.fn();
        const item = new NotificationItemModel({
            message: 'A dismissible message',
            id: 'dismissible_item',
            isDismissible: true,
            onDismiss,
        });
        createNotification(item);
        const tree = shallow(<NotificationItem item={item} user={new User()} />);
        const dismissIcon = tree.find('.fa-times-circle');
        expect(dismissIcon).toHaveLength(1);
        dismissIcon.simulate('click');
        expect(onDismiss).toHaveBeenCalledTimes(1);
        expect(tree).toMatchSnapshot();
    });

    test('with message function', () => {
        const messageFn = jest.fn();
        const item = new NotificationItemModel({
            message: messageFn,
            id: 'with_message_function',
            isDismissible: true,
        });
        const tree = shallow(<NotificationItem item={item} user={new User()} />);
        expect(tree.find('.fa-times-circle')).toHaveLength(1);
        expect(messageFn).toHaveBeenCalledTimes(1);
        expect(tree).toMatchSnapshot();
    });
});
