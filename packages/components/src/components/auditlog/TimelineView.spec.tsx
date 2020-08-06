import React from 'react';

import { shallow } from 'enzyme';

import { List } from 'immutable';

import { boolean } from '@storybook/addon-knobs';

import { TIMELINE_DATA } from '../../test/data/constants';

import { TimelineView } from './TimelineView';
import { TimelineEventModel } from './models';

let events = List<TimelineEventModel>();
TIMELINE_DATA.forEach(event => (events = events.push(TimelineEventModel.create(event, 'UTC'))));

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
                selectedEvent={events.get(1)}
                showUserLinks={true}
                selectedEntityInfo={{ firstEvent: events.get(1), lastEvent: events.get(5), isCompleted: true }}
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
                selectedEvent={events.get(7)}
                showUserLinks={boolean('showUserLinks', true)}
                selectedEntityInfo={{ firstEvent: events.get(2), lastEvent: events.get(7), isCompleted: false }}
            />
        );

        expect(wrapper).toMatchSnapshot();
    });
});
