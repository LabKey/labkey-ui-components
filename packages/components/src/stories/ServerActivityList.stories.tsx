/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React, { useMemo } from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { ServerActivityList } from '../internal/components/notifications/ServerActivityList';
import { DONE_AND_READ, DONE_NOT_READ, IN_PROGRESS, UNREAD_WITH_ERROR } from '../test/data/notificationData';
import { disableControls } from './storyUtils';

export default {
    title: 'Components/ServerActivityList',
    component: ServerActivityList,
    argTypes: {
        onRead: { action: 'read', ...disableControls() },
        onViewAll: { action: 'read', ...disableControls() },
        serverActivity: disableControls(),
    },
} as Meta;

const activityData = [DONE_NOT_READ, DONE_AND_READ, IN_PROGRESS, UNREAD_WITH_ERROR];

export const ServerActivityListStory: Story = props => {
    const serverActivity = useMemo(() => {
        if (props.withData) {
            return { data: activityData, totalRows: 4, unreadCount: 1, inProgressCount: 1 };
        }
        return { data: [], totalRows: 0, unreadCount: 0, inProgressCount: 0 };
    }, [props.withData]);

    return <ServerActivityList {...(props as any)} serverActivity={serverActivity} />;
};

ServerActivityListStory.storyName = 'ServerActivityList';

ServerActivityListStory.args = {
    maxRows: 3,
    withData: true,
};
