/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Button } from 'react-bootstrap';
import { fromJS } from 'immutable';
import { Meta, Story } from '@storybook/react/types-6-0';

import { UserDetailHeader, User } from '..';

import { ICON_URL } from './mock';
import { disableControls } from './storyUtils';

export default {
    title: 'Components/UserDetailHeader',
    component: UserDetailHeader,
    argTypes: {
        renderButtons: disableControls(),
    },
} as Meta;

export const UserDetailHeaderStory: Story = storyProps => (
    <UserDetailHeader
        {...(storyProps as any)}
        user={new User(storyProps.user ?? {})}
        userProperties={fromJS(storyProps.userProperties ?? {})}
    />
);

UserDetailHeaderStory.storyName = 'UserDetailHeader';

UserDetailHeaderStory.args = {
    dateFormat: 'yyyy-MM-DD',
    description: 'Testing with custom description',
    renderButtons: () => <Button className="pull-right">Test Button</Button>,
    user: new User({ avatar: ICON_URL, isAdmin: true }).toJS(),
    userProperties: { lastlogin: '2019-12-02 01:02:03' },
    title: 'Custom User Title',
};
