import React from 'react';

import { shallow } from 'enzyme';

import { boolean } from '@storybook/addon-knobs';

import { TIMELINE_DATA } from '../../test/data/constants';

import { TimelineView } from './TimelineView';
import { TimelineEventModel } from './models';

let events : TimelineEventModel[] = [];
TIMELINE_DATA.forEach((event) => events.push(TimelineEventModel.create(event, 'UTC')));

describe('<TimelineView />', () => {
    test('Disable selection', () => {
        const wrapper = shallow(
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={true}
                onEventSelection={jest.fn()}
                selectedEvent={null}
                showUserLinks={true}
                selectedEntityInfo={null}
            />
        );

        expect(wrapper).toMatchSnapshot();
    });

    test('Hide user link', () => {
        const wrapper = shallow(
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={true}
                onEventSelection={jest.fn()}
                selectedEvent={null}
                showUserLinks={false}
                selectedEntityInfo={null}
            />
        );

        expect(wrapper).toMatchSnapshot();
    });

    test('with selection, completed entity', () => {
        const wrapper = shallow(
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={true}
                onEventSelection={jest.fn()}
                selectedEvent={events[1]}
                showUserLinks={true}
                selectedEntityInfo={{ firstEvent: events[1], lastEvent: events[5], isCompleted: true }}
            />
        );

        expect(wrapper).toMatchSnapshot();
    });

    test('with selection, open entity', () => {
        const wrapper = shallow(
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={true}
                onEventSelection={jest.fn()}
                selectedEvent={events[7]}
                showUserLinks={boolean('showUserLinks', true)}
                selectedEntityInfo={{ firstEvent: events[2], lastEvent: events[7], isCompleted: false }}
            />
        );

        expect(wrapper).toMatchSnapshot();
    });
});
