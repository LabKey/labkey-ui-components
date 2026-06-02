/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { TEST_USER_READER } from '../../userFixtures';
import { NotificationItemModel } from './model';
import { NotificationItem } from './NotificationItem';

describe('NotificationItem', () => {
    test('not dismissible item', () => {
        const item = new NotificationItemModel({
            message: 'A message',
            id: 'not_dismissible_item',
            isDismissible: false,
        });

        renderWithAppContext(<NotificationItem item={item} />, { serverContext: { user: TEST_USER_READER } });

        expect(document.querySelectorAll('.fa-times-circle')).toHaveLength(0);
        expect(document.querySelector('.notification-item').textContent).toEqual(item.message);
    });

    test('dismissible item', () => {
        const onDismiss = jest.fn();
        const item = new NotificationItemModel({
            message: 'A dismissible message',
            id: 'dismissible_item',
            isDismissible: true,
            onDismiss,
        });

        renderWithAppContext(<NotificationItem item={item} />, { serverContext: { user: TEST_USER_READER } });

        expect(document.querySelectorAll('.fa-times-circle')).toHaveLength(1);
        expect(document.querySelector('.notification-item').textContent).toEqual(item.message);
    });

    test('with message node', () => {
        const message = 'message node';
        const item = new NotificationItemModel({
            message: <div>{message}</div>,
            id: 'with_message_function',
            isDismissible: true,
        });

        renderWithAppContext(<NotificationItem item={item} />, { serverContext: { user: TEST_USER_READER } });

        expect(document.querySelectorAll('.fa-times-circle')).toHaveLength(1);
        expect(document.querySelector('.notification-item').textContent).toEqual(message);
    });
});
