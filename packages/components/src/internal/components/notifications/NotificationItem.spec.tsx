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

import { mountWithAppServerContext } from '../../enzymeTestHelpers';
import { TEST_USER_READER } from '../../userFixtures';

import { NotificationItemModel } from './model';
import { NotificationItem } from './NotificationItem';

describe('<NotificationItem />', () => {
    test('not dismissible item', () => {
        const item = new NotificationItemModel({
            message: 'A message',
            id: 'not_dismissible_item',
            isDismissible: false,
        });
        const wrapper = mountWithAppServerContext(<NotificationItem item={item} />, {}, { user: TEST_USER_READER });
        expect(wrapper.find('.fa-times-circle')).toHaveLength(0);
        expect(wrapper.text()).toEqual(item.message);
    });

    test('dismissible item', () => {
        const onDismiss = jest.fn();
        const item = new NotificationItemModel({
            message: 'A dismissible message',
            id: 'dismissible_item',
            isDismissible: true,
            onDismiss,
        });
        const wrapper = mountWithAppServerContext(<NotificationItem item={item} />, {}, { user: TEST_USER_READER });
        const dismissIcon = wrapper.find('.fa-times-circle');
        expect(dismissIcon).toHaveLength(1);
        expect(wrapper.text()).toEqual(item.message);
    });

    test('with message node', () => {
        const message = 'message node';
        const item = new NotificationItemModel({
            message: <div>{message}</div>,
            id: 'with_message_function',
            isDismissible: true,
        });
        const wrapper = mountWithAppServerContext(<NotificationItem item={item} />, {}, { user: TEST_USER_READER });
        expect(wrapper.find('.fa-times-circle')).toHaveLength(1);
        expect(wrapper.text()).toEqual(message);
    });
});
