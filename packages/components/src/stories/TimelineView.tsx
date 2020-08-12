/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, boolean } from '@storybook/addon-knobs';

import './stories.scss';
import { TIMELINE_DATA } from '../test/data/constants';
import { TimelineEventModel, TimelineView } from '..';

const events: TimelineEventModel[] = [];
TIMELINE_DATA.forEach(event => events.push(TimelineEventModel.create(event, 'UTC')));

storiesOf('Timeline', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        return (
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={boolean('selectionDisabled', false)}
                onEventSelection={event => console.log('selected')}
                selectedEvent={boolean('hasSelection', true) ? events[1] : null}
                showUserLinks={boolean('showUserLinks', true)}
                selectedEntityConnectionInfo={null}
            />
        );
    })
    .add('with selection, completed entity', () => {
        return (
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={false}
                onEventSelection={event => console.log('selected')}
                selectedEvent={events[1]}
                showUserLinks={true}
                selectedEntityConnectionInfo={[{ firstEvent: events[1], lastEvent: events[6], isCompleted: true }]}
            />
        );
    })
    .add('with selection, open entity', () => {
        return (
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={false}
                onEventSelection={event => console.log('selected')}
                selectedEvent={events[7]}
                showUserLinks={boolean('showUserLinks', true)}
                selectedEntityConnectionInfo={[{ firstEvent: events[2], lastEvent: events[7], isCompleted: false }]}
            />
        );
    });
