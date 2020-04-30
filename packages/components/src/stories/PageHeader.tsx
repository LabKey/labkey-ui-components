/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Button } from 'react-bootstrap';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import './stories.scss';

import { notificationInit } from '../test/setupUtils';
import { NotificationItemModel, Persistence } from '../components/notifications/model';
import { createNotification } from '../components/notifications/actions';
import { PageHeader } from '../components/base/PageHeader';

notificationInit();

createNotification(
    new NotificationItemModel({
        id: 'login_seesion_notice',
        message: 'A login session notification (from PageHeader story)',
        persistence: Persistence.LOGIN_SESSION,
    })
);

storiesOf('PageHeader', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        const hasChildren = boolean('Add content above title?', true);
        const children = hasChildren ? <Button href="#">Header action link</Button> : undefined;
        const showNotifications = boolean('Show notifications?', false);

        return (
            <PageHeader
                iconCls={text('Icon class name', 'fa fa-spinner fa-pulse')}
                showNotifications={showNotifications}
                title={text('Title', 'Loading...')}
            >
                {children}
            </PageHeader>
        );
    });
