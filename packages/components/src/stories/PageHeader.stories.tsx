/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';
import { Button } from 'react-bootstrap';

import { NotificationItemModel, Persistence, createNotification, PageHeader } from '..';
import { notificationInit } from '../test/setupUtils';

import { disableControls } from './storyUtils';

export default {
    title: 'Components/PageHeader',
    component: PageHeader,
    argTypes: {
        user: disableControls(),
    },
} as Meta;

notificationInit();

createNotification(
    new NotificationItemModel({
        id: 'login_seesion_notice',
        message: 'A login session notification (from PageHeader story)',
        persistence: Persistence.LOGIN_SESSION,
    })
);

export const PageHeaderStory: Story = props => {
    const { withContent, ...rest } = props;
    return <PageHeader {...rest}>{withContent && <Button href="#">Header action link</Button>}</PageHeader>;
};

PageHeaderStory.storyName = 'PageHeader';

PageHeaderStory.args = {
    withContent: true,
};
