/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import moment from 'moment';
import { storiesOf } from '@storybook/react';
import { boolean, radios, text, withKnobs } from '@storybook/addon-knobs';

import { Notification, createNotification, User, NotificationItemModel, generateId } from '..';

import { notificationInit } from '../test/setupUtils';

// initialize the global state and the LABKEY object
notificationInit();

storiesOf('Notification', module)
    .addDecorator(withKnobs)
    .add(
        'basic notification',
        () => {
            const message = text('Message text', 'Notify me');
            const alertClass = radios(
                'Alert class',
                {
                    info: 'info',
                    success: 'success',
                    warning: 'warning',
                    danger: 'danger',
                },
                'success'
            );
            const isDismissible = boolean('Is dismissible?', true);
            const notifyItem = new NotificationItemModel({
                id: generateId('notification_'),
                alertClass,
                isDismissible,
                message,
            });
            createNotification(notifyItem);
            const user = new User();
            return <Notification user={user} />;
        },
        {
            knobs: {
                timestamps: true, // Doesn't emit events while user is typing.
            },
        }
    )
    .add('Trial notification', () => {
        const endDate = text('Trial end date', moment().add(10, 'days').format('YYYY-MM-DD'));
        const hasUpgradeLink = boolean('Has upgrade link?', false);
        const upgradeLinkText = text('Upgrade link text', undefined);
        const userIsAdmin = boolean('User is admin?', false);
        if (endDate) {
            LABKEY['moduleContext'] = {
                trialservices: {
                    trialEndDate: endDate,
                    upgradeLink: hasUpgradeLink ? 'http://upgrade/today' : undefined,
                    upgradeLinkText: hasUpgradeLink ? upgradeLinkText : undefined,
                },
            };
        }

        const user = new User({
            isAdmin: userIsAdmin,
        });
        return <Notification user={user} />;
    });
