import React from 'react';

import { ReactWrapper, shallow, ShallowWrapper } from 'enzyme';

import SampleTimelineJson from '../test/data/SampleTimeline.json';

import { getTestAPIWrapper } from '../internal/APIWrapper';
import { getSamplesTestAPIWrapper } from '../internal/components/samples/APIWrapper';

import { TimelineEventModel } from '../internal/components/auditlog/models';
import { SampleStateType } from '../internal/components/samples/constants';

import { mountWithServerContext, waitForLifecycle } from '../internal/testHelpers';

import { makeTestActions } from '../public/QueryModel/testUtils';
import { TEST_USER_FOLDER_ADMIN } from '../internal/userFixtures';

import { AuditDetails } from '../internal/components/auditlog/AuditDetails';

import { UserLink } from '../internal/components/user/UserLink';
import { SampleStatusTag } from '../internal/components/samples/SampleStatusTag';

import { SampleEventListing } from './SampleEventListing';
import { SampleTimelinePageBaseImpl, SampleTimelinePageBaseImplProps } from './SampleTimelinePageBase';

describe('SampleTimelinePageBase', () => {
    const SAMPLE_NAME = 'S-20200404-1';
    const dummyData = SampleTimelineJson;
    const events: TimelineEventModel[] = [];
    if (dummyData['events']) {
        (dummyData['events'] as []).forEach(event => events.push(TimelineEventModel.create(event, 'UTC')));
    }

    function defaultProps(): SampleTimelinePageBaseImplProps {
        return {
            actions: makeTestActions(jest.fn),
            api: getTestAPIWrapper(jest.fn, {
                samples: getSamplesTestAPIWrapper(jest.fn, {
                    getTimelineEvents: jest.fn().mockResolvedValue(events),
                }),
            }),
            queryModels: {},
            sampleSet: 'Samples',
            sampleId: 86873,
            sampleName: SAMPLE_NAME,
            sampleStatus: {
                label: 'Available for Testing',
                statusType: SampleStateType.Available,
                description: 'Description for testing',
            },
            timezoneAbbr: 'UTC',
            user: TEST_USER_FOLDER_ADMIN,
        };
    }

    const registrationEvent = events[0],
        assayReimportEvent = events[7];

    function verifyEventTimelinePanel(wrapper: ReactWrapper, selectedEvent) {
        const eventTimelinePanel = wrapper.find('.panel-body').at(0);
        expect(eventTimelinePanel.find('.timeline-title').hostNodes().text()).toBe('Event Timeline for ' + SAMPLE_NAME);
        expect(wrapper.find(SampleEventListing)).toHaveLength(1);
        expect(wrapper.find(SampleEventListing).prop('selectedEvent')).toBe(selectedEvent);
        expect(wrapper.find('.timeline-event-row')).toHaveLength(events.length);
    }

    function verifyCurrentStatusPanel(wrapper: ReactWrapper) {
        const currentStatusPanel = wrapper.find('.panel-body').at(1);
        expect(currentStatusPanel.find('.row')).toHaveLength(6);
        expect(currentStatusPanel.find('.row').at(0).text()).toBe('Registered ByVader');
        expect(currentStatusPanel.find('.row').at(1).text()).toBe('Registration Date2020-04-04 21:57');
        expect(currentStatusPanel.find('.row').at(2).text()).toBe('Sample Status');
        expect(currentStatusPanel.find('.row').at(3).text()).toBe('Last EventAdded to job');
        expect(currentStatusPanel.find('.row').at(4).text()).toBe('Last Event Handled ByTest Lab User');
        expect(currentStatusPanel.find('.row').at(5).text()).toBe('Last Event Date2020-04-10 02:57');

        expect(currentStatusPanel.find(UserLink)).toHaveLength(2);
        expect(currentStatusPanel.find(SampleStatusTag)).toHaveLength(1);
    }

    test('Without selected event', async () => {
        const wrapper = mountWithServerContext(<SampleTimelinePageBaseImpl {...defaultProps()} />, {
            user: TEST_USER_FOLDER_ADMIN,
        });
        await waitForLifecycle(wrapper);

        verifyEventTimelinePanel(wrapper, undefined);
        verifyCurrentStatusPanel(wrapper);

        expect(wrapper.find(AuditDetails)).toHaveLength(1);
        expect(wrapper.find(AuditDetails).prop('rowId')).toBeUndefined();
        expect(wrapper.find(AuditDetails).prop('summary')).toBeUndefined();
        expect(wrapper.find(AuditDetails).prop('gridData')).toBeUndefined();
        expect(wrapper.find(AuditDetails).prop('changeDetails')).toBeUndefined();

        wrapper.unmount();
    });

    test('With selected sample registration event', async () => {
        const wrapper = mountWithServerContext(
            <SampleTimelinePageBaseImpl {...defaultProps()} initialSelectedEvent={registrationEvent} />,
            { user: TEST_USER_FOLDER_ADMIN }
        );
        await waitForLifecycle(wrapper);

        verifyEventTimelinePanel(wrapper, registrationEvent);
        verifyCurrentStatusPanel(wrapper);

        expect(wrapper.find(AuditDetails)).toHaveLength(1);
        expect(wrapper.find(AuditDetails).prop('rowId')).toBe(registrationEvent.rowId);
        expect(wrapper.find(AuditDetails).prop('summary')).toBe('Sample Registered');

        wrapper.unmount();
    });

    test('With selected assay re-import event', async () => {
        const wrapper = mountWithServerContext(
            <SampleTimelinePageBaseImpl {...defaultProps()} initialSelectedEvent={assayReimportEvent} />,
            { user: TEST_USER_FOLDER_ADMIN }
        );
        await waitForLifecycle(wrapper);

        verifyEventTimelinePanel(wrapper, assayReimportEvent);
        verifyCurrentStatusPanel(wrapper);

        expect(wrapper.find(AuditDetails)).toHaveLength(1);
        expect(wrapper.find(AuditDetails).prop('rowId')).toBe(assayReimportEvent.rowId);
        expect(wrapper.find(AuditDetails).prop('summary')).toBe('Assay Data Re-Import Run');

        wrapper.unmount();
    });
});
