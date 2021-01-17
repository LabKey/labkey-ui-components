import { storiesOf } from '@storybook/react';
import { number, withKnobs } from '@storybook/addon-knobs';

import React from 'react';

import { ServerActivityList } from '../internal/components/notifications/ServerActivityList';
import { DONE_AND_READ, DONE_NOT_READ, IN_PROGRESS, UNREAD_WITH_ERROR } from '../test/data/notificationData';

storiesOf('ServerActivityList', module)
    .addDecorator(withKnobs)
    .add('with data', () => {
        const activityData = [
            DONE_NOT_READ,
            DONE_AND_READ,
            IN_PROGRESS,
            UNREAD_WITH_ERROR
        ];

        return (
            <ServerActivityList
                serverActivity={{ data: activityData, totalRows: 4, unreadCount: 1, inProgressCount: 1 }}
                onViewAll={() => {}}
                maxRows={number('Maximum shown', 3)}
                onRead={() => {}}
                onShowErrorDetail={() => {}}
            />
        );
    })
    .add("without data", () => {
        return (
            <ServerActivityList
                serverActivity={{ data: [], totalRows: 0, unreadCount: 0, inProgressCount: 0 }}
                onViewAll={() => {}}
                maxRows={number('Maximum shown', 3)}
                onRead={() => {}}
                onShowErrorDetail={() => {}}
            />
        );
    });
