import React from 'react';

import { shallow, mount } from 'enzyme';

import { TIMELINE_DATA } from '../../../test/data/constants';

import { TimelineView } from './TimelineView';
import { TimelineEventModel } from './models';

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
                showUserLinks={true}
                selectedEntityConnectionInfo={null}
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
                selectedEntityConnectionInfo={null}
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
                selectedEntityConnectionInfo={[{ firstEvent: events[1], lastEvent: events[5], isCompleted: true }]}
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
                showUserLinks={true}
                selectedEntityConnectionInfo={[{ firstEvent: events[2], lastEvent: events[7], isCompleted: false }]}
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
                showUserLinks={true}
                selectedEntityConnectionInfo={null}
                getInfoBubbleContent={getInfoBubbleContent}
            />
        );

        expect(wrapper.find('.timeline-info-icon')).toHaveLength(8);

        wrapper.unmount();
    });
});
