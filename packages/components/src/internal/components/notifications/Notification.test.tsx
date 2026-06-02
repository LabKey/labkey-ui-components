/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { addDays } from 'date-fns';
import { Map } from 'immutable';

import { TEST_USER_APP_ADMIN, TEST_USER_READER } from '../../userFixtures';
import { Container } from '../base/models/Container';
import { getJsonDateFormatString } from '../../util/Date';
import { Notifications } from './Notifications';
import { NotificationItemModel } from './model';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

describe('Notifications', () => {
    test('no notifications', () => {
        renderWithAppContext(<Notifications />, { serverContext: { user: TEST_USER_READER } });
        expect(document.querySelectorAll('.notification-item')).toHaveLength(0);
    });

    test('one notification', () => {
        const alertClass = 'success';
        const message = 'one is the loneliest number';
        renderWithAppContext(<Notifications />, {
            serverContext: { user: TEST_USER_READER },
            notificationContext: {
                notifications: Map.of(
                    'one_notification',
                    new NotificationItemModel({ alertClass, id: 'one_notification', message })
                ),
            },
        });
        expect(document.querySelectorAll('.notification-item')).toHaveLength(1);
        expect(document.querySelectorAll('.alert-success')).toHaveLength(1);
        expect(document.querySelector('.notification-item').textContent).toEqual(message);
    });

    test('multiple notification classes', () => {
        const models = [
            new NotificationItemModel({ alertClass: 'info', id: 'info1', message: 'info message 1' }),
            new NotificationItemModel({ alertClass: 'info', id: 'info2', message: 'info message 2' }),
            new NotificationItemModel({ id: 'default1', message: 'default message class' }),
            new NotificationItemModel({ alertClass: 'danger', id: 'danger1', message: 'Danger, Will Robinson!' }),
        ];
        renderWithAppContext(<Notifications />, {
            serverContext: { user: TEST_USER_READER },
            notificationContext: {
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
            },
        });

        expect(document.querySelectorAll('.notification-item')).toHaveLength(4);
        expect(document.querySelectorAll('.notification-container')).toHaveLength(3);
        expect(document.querySelector('.alert-success')).toBeTruthy();
        expect(document.querySelector('.alert-info')).toBeTruthy();
        expect(document.querySelector('.alert-danger')).toBeTruthy();

        const notificationItems = document.querySelectorAll('.notification-item');
        models.forEach((model, idx) => {
            expect(notificationItems[idx].textContent).toEqual(model.message);
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
        renderWithAppContext(<Notifications />, {
            serverContext: {
                user: TEST_USER_READER,
                container: new Container({
                    formats: {
                        dateTimeFormat: 'yyyy-MM-dd HH:mm',
                        numberFormat: null,
                        dateFormat: 'yyyy-MM-dd',
                    },
                }),
                moduleContext,
            },
        });

        expect(document.querySelectorAll('.notification-item')).toHaveLength(1);
        expect(document.querySelectorAll('a')).toHaveLength(0);
        expect(document.querySelector('.notification-item').textContent).toContain(
            'This LabKey trial site will expire in '
        );
    });

    test('with trial notification for admin', () => {
        const moduleContext = {
            trialservices: {
                trialEndDate: getJsonDateFormatString(addDays(new Date(), 1)),
                upgradeLink: 'your/link/to/the/future',
                upgradeLinkText: 'Upgrade now',
            },
        };
        renderWithAppContext(<Notifications />, {
            serverContext: {
                user: TEST_USER_APP_ADMIN,
                container: new Container({
                    formats: {
                        dateTimeFormat: 'yyyy-MM-dd HH:mm',
                        numberFormat: null,
                        dateFormat: 'yyyy-MM-dd',
                    },
                }),
                moduleContext,
            },
        });

        expect(document.querySelectorAll('.notification-item')).toHaveLength(1);
        expect(document.querySelector('.notification-item').textContent).toContain(
            'This LabKey trial site will expire in '
        );

        const link = document.querySelector('a');
        expect(document.querySelectorAll('a')).toHaveLength(1);
        expect(link.textContent).toEqual(moduleContext.trialservices.upgradeLinkText);
        expect(link.getAttribute('href')).toEqual(moduleContext.trialservices.upgradeLink);
    });
});
