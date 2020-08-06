/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs,boolean } from '@storybook/addon-knobs';

import './stories.scss';
import {List} from "immutable";
import {TIMELINE_DATA} from "../test/data/constants";
import {TimelineEventModel, TimelineView} from "..";

let events = List<TimelineEventModel>();
TIMELINE_DATA.forEach((event) => events = events.push(TimelineEventModel.create(event, 'UTC')));

storiesOf('Timeline', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        return (
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={boolean('selectionDisabled', false)}
                onEventSelection={(event) => console.log('selected')}
                selectedEvent={boolean('hasSelection', true) ? events.get(1) : null}
                showUserLinks={boolean('showUserLinks', true)}
                selectedEntityInfo={null}
            />
        );
    })
    .add('with selection, completed entity', () => {
        return (
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={false}
                onEventSelection={(event) => console.log('selected')}
                selectedEvent={events.get(1)}
                showUserLinks={true}
                selectedEntityInfo={{firstEvent: events.get(1), lastEvent: events.get(5), isCompleted: true}}
            />
        );
    })
    .add('with selection, open entity', () => {
        return (
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={false}
                onEventSelection={(event) => console.log('selected')}
                selectedEvent={events.get(7)}
                showUserLinks={boolean('showUserLinks', true)}
                selectedEntityInfo={{firstEvent: events.get(2), lastEvent: events.get(7), isCompleted: false}}
            />
        );
    });

