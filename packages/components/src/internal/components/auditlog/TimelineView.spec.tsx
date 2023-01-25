import React from 'react';

import { shallow, mount } from 'enzyme';

import { TIMELINE_DATA } from '../../../test/data/constants';

import { TimelineView } from './TimelineView';
import { TimelineEventModel } from './models';
import {TEST_USER_APP_ADMIN, TEST_USER_READER} from "../../userFixtures";

const events: TimelineEventModel[] = [];
TIMELINE_DATA.forEach(event => events.push(TimelineEventModel.create(event, 'UTC')));

describe('<TimelineView />', () => {
    test('Disable selection', () => {
        const wrapper = shallow(
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={true}
                onEventSelection={jest.fn()}
                selectedEvent={null}
                selectedEntityConnectionInfo={null}
                user={TEST_USER_APP_ADMIN}
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
                selectedEntityConnectionInfo={null}
                user={TEST_USER_READER}
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
                selectedEntityConnectionInfo={[{ firstEvent: events[1], lastEvent: events[5], isCompleted: true }]}
                user={TEST_USER_APP_ADMIN}
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
                selectedEntityConnectionInfo={[{ firstEvent: events[2], lastEvent: events[7], isCompleted: false }]}
                user={TEST_USER_APP_ADMIN}
            />
        );

        expect(wrapper.find('.timeline-info-icon')).toHaveLength(0);
        expect(wrapper).toMatchSnapshot();
    });

    test('with getInfoBubbleContent', () => {
        const getInfoBubbleContent = (event: TimelineEventModel) => {
            return {
                title: 'info',
                content: <span>hello</span>,
            };
        };
        const wrapper = mount(
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={true}
                onEventSelection={jest.fn()}
                selectedEvent={events[7]}
                selectedEntityConnectionInfo={null}
                getInfoBubbleContent={getInfoBubbleContent}
                user={TEST_USER_APP_ADMIN}
            />
        );

        expect(wrapper.find('.timeline-info-icon')).toHaveLength(8);

        wrapper.unmount();
    });
});
