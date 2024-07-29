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
import { addDays } from 'date-fns';
import { Map } from 'immutable';

import { mountWithAppServerContext } from '../../test/enzymeTestHelpers';
import { TEST_USER_APP_ADMIN, TEST_USER_READER } from '../../userFixtures';

import { Container } from '../base/models/Container';

import { getJsonDateFormatString } from '../../util/Date';

import { Notifications } from './Notifications';
import { NotificationItemModel } from './model';
import { NotificationItem } from './NotificationItem';

describe('Notifications', () => {
    test('no notifications', () => {
        const notifications = mountWithAppServerContext(<Notifications />, {}, { user: TEST_USER_READER });
        expect(notifications.find(NotificationItem)).toHaveLength(0);
    });

    test('one notification', () => {
        const alertClass = 'success';
        const message = 'one is the loneliest number';
        const notifications = mountWithAppServerContext(
            <Notifications />,
            {},
            { user: TEST_USER_READER },
            {
                notifications: Map.of(
                    'one_notification',
                    new NotificationItemModel({ alertClass, id: 'one_notification', message })
                ),
            }
        );
        expect(notifications.find(NotificationItem)).toHaveLength(1);
        expect(notifications.find('.alert-success')).toHaveLength(1);
        expect(notifications.find(NotificationItem).at(0).text()).toEqual(message);
    });

    test('multiple notification classes', () => {
        const models = [
            new NotificationItemModel({ alertClass: 'info', id: 'info1', message: 'info message 1' }),
            new NotificationItemModel({ alertClass: 'info', id: 'info2', message: 'info message 2' }),
            new NotificationItemModel({ id: 'default1', message: 'default message class' }),
            new NotificationItemModel({ alertClass: 'danger', id: 'danger1', message: 'Danger, Will Robinson!' }),
        ];
        const notifications = mountWithAppServerContext(
            <Notifications />,
            {},
            { user: TEST_USER_READER },
            {
                notifications: Map.of(
                    models[0].id,
                    models[0],
                    models[1].id,
                    models[1],
                    models[2].id,
                    models[2],
                    models[3].id,
                    models[3]
                ),
            }
        );
        expect(notifications.find(NotificationItem)).toHaveLength(4);
        expect(notifications.find('.notification-container')).toHaveLength(3);
        expect(notifications.find('.alert-success').exists()).toEqual(true);
        expect(notifications.find('.alert-info').exists()).toEqual(true);
        expect(notifications.find('.alert-danger').exists()).toEqual(true);
        models.forEach((model, idx) => {
            expect(notifications.find(NotificationItem).at(idx).text()).toEqual(model.message);
        });
    });

    test('with trial notification for non-admin', () => {
        const moduleContext = {
            trialservices: {
                trialEndDate: getJsonDateFormatString(addDays(new Date(), 1)),
                upgradeLink: 'your/link/to/the/future',
                upgradeLinkText: 'Upgrade now',
            },
        };
        const notifications = mountWithAppServerContext(
            <Notifications />,
            {},
            {
                user: TEST_USER_READER,
                container: new Container({
                    formats: {
                        dateTimeFormat: 'yyyy-MM-dd HH:mm',
                        numberFormat: null,
                        dateFormat: 'yyyy-MM-dd',
                    },
                }),
                moduleContext,
            }
        );
        expect(notifications.find(NotificationItem)).toHaveLength(1);
        expect(notifications.find('a')).toHaveLength(0);
        expect(notifications.find(NotificationItem).at(0).text()).toContain('This LabKey trial site will expire in ');
    });

    test('with trial notification for admin', () => {
        const moduleContext = {
            trialservices: {
                trialEndDate: getJsonDateFormatString(addDays(new Date(), 1)),
                upgradeLink: 'your/link/to/the/future',
                upgradeLinkText: 'Upgrade now',
            },
        };
        const notifications = mountWithAppServerContext(
            <Notifications />,
            {},
            {
                user: TEST_USER_APP_ADMIN,
                container: new Container({
                    formats: {
                        dateTimeFormat: 'yyyy-MM-dd HH:mm',
                        numberFormat: null,
                        dateFormat: 'yyyy-MM-dd',
                    },
                }),
                moduleContext,
            }
        );
        expect(notifications.find(NotificationItem)).toHaveLength(1);
        expect(notifications.find(NotificationItem).at(0).text()).toContain('This LabKey trial site will expire in ');
        expect(notifications.find('a')).toHaveLength(1);
        expect(notifications.find('a').text()).toEqual(moduleContext.trialservices.upgradeLinkText);
        expect(notifications.find('a').props().href).toEqual(moduleContext.trialservices.upgradeLink);
    });
});
