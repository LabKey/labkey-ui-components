import React from 'react';

import { shallow } from 'enzyme';

import { TIMELINE_DATA } from '../../../test/data/constants';

import { TEST_USER_APP_ADMIN } from '../../userFixtures';
import { mountWithAppServerContext } from '../../test/enzymeTestHelpers';
import { UserLink } from '../user/UserLink';

import { TimelineEventModel } from './models';
import { TimelineView } from './TimelineView';

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
        const wrapper = mountWithAppServerContext(
            <TimelineView
                events={events}
                showRecentFirst={false}
                selectionDisabled={true}
                onEventSelection={jest.fn()}
                selectedEvent={events[7]}
                selectedEntityConnectionInfo={null}
                getInfoBubbleContent={getInfoBubbleContent}
            />,
            {},
            { user: TEST_USER_APP_ADMIN }
        );

        expect(wrapper.find('.timeline-info-icon')).toHaveLength(8);
        expect(wrapper.find(UserLink)).toHaveLength(8);

        // test unknown user display
        expect(wrapper.find(UserLink).first().prop('userDisplayValue')).toBe('Vader');
        expect(wrapper.find(UserLink).first().prop('unknown')).toBeFalsy();
        expect(wrapper.find(UserLink).last().prop('userDisplayValue')).toBeUndefined();
        expect(wrapper.find(UserLink).last().prop('unknown')).toBeTruthy();

        wrapper.unmount();
    });
});
