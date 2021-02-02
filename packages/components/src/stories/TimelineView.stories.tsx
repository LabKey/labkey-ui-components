/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { TimelineEventModel, TimelineView } from '..';

import { TIMELINE_DATA } from '../test/data/constants';

import { disableControls } from './storyUtils';

const events = TIMELINE_DATA.map(evt => TimelineEventModel.create(evt, 'UTC'));

export default {
    title: 'Components/TimelineView',
    component: TimelineView,
    argTypes: {
        events: disableControls(),
        onEventSelection: { action: 'eventSelection', ...disableControls() },
        selectedEvent: disableControls(),
        selectedEntityConnectionInfo: disableControls(),
    },
} as Meta;

export const TimelineViewStory: Story = storyProps => (
    <TimelineView
        {...(storyProps as any)}
        selectedEvent={storyProps.hasSelection ? storyProps.selectedEvent : undefined}
    />
);

TimelineViewStory.storyName = 'TimelineView';

TimelineViewStory.args = {
    events,
    selectedEntityConnectionInfo: [{ firstEvent: events[1], lastEvent: events[6], isCompleted: true }],
    selectedEvent: events[7],
    selectionDisabled: false,
    showRecentFirst: false,
    showUserLinks: true,

    // Story specific props
    hasSelection: true,
};
