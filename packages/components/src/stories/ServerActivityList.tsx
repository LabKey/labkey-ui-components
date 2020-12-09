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
                activityData={activityData}
                onViewAll={() => {}}
                maxListingSize={number('Maximum shown', 3)}
            />
        );
    })
    .add("without data", () => {
        return (
            <ServerActivityList
                activityData={[]}
                onViewAll={() => {}}
                maxListingSize={number('Maximum shown', 3)}
            />
        );
    });
