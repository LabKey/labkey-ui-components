import React from 'react';

import SampleTimelineJson from '../test/data/SampleTimeline.json';

import { getTestAPIWrapper } from '../internal/APIWrapper';
import { getSamplesTestAPIWrapper } from '../internal/components/samples/APIWrapper';

import { TimelineEventModel } from '../internal/components/auditlog/models';
import { SampleStateType } from '../internal/components/samples/constants';

import {mountWithServerContext, waitForLifecycle} from '../internal/testHelpers';

import { makeTestActions } from '../public/QueryModel/testUtils';
import { TEST_USER_FOLDER_ADMIN } from '../internal/userFixtures';

import { SampleTimelinePageBaseImpl } from './SampleTimelinePageBase';
import {AuditDetails} from "../internal/components/auditlog/AuditDetails";
import {SampleEventListing} from "./SampleEventListing";

describe('<SampleTimelinePageBase/>', () => {
    const dummyData = SampleTimelineJson;
    const events: TimelineEventModel[] = [];
    if (dummyData['events']) {
        (dummyData['events'] as []).forEach(event => events.push(TimelineEventModel.create(event, 'UTC')));
    }

    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {
            samples: getSamplesTestAPIWrapper(jest.fn, {
                getTimelineEvents: () => Promise.resolve(events),
            }),
        }),
        queryModels: {},
        actions: makeTestActions(),
        sampleSet: 'Samples',
        sampleId: 86873,
        sampleName: 'S-20200404-1',
        user: TEST_USER_FOLDER_ADMIN,
        skipAuditDetailUserLoading: true,
        timezoneAbbr: 'UTC',
        sampleStatus: {
            label: 'Available for Testing',
            statusType: SampleStateType.Available,
            description: 'Description for testing',
        },
        sampleJobsGidId: 'test',
    };

    const registrationEvent = events[0],
        assayReimportEvent = events[7];

    test('Without selected event', async () => {
        const wrapper = mountWithServerContext(
            <SampleTimelinePageBaseImpl {...DEFAULT_PROPS} />,
            { user: TEST_USER_FOLDER_ADMIN }
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find(SampleEventListing)).toHaveLength(1);
        expect(wrapper.find(SampleEventListing).prop('selectedEvent')).toBeUndefined();
        expect(wrapper.find(AuditDetails)).toHaveLength(1);
        expect(wrapper.find(AuditDetails).prop('rowId')).toBeUndefined();
        expect(wrapper.find(AuditDetails).prop('summary')).toBeUndefined();
        expect(wrapper.find(AuditDetails).prop('gridData')).toBeUndefined();
        expect(wrapper.find(AuditDetails).prop('changeDetails')).toBeUndefined();

        wrapper.unmount();
    });

    test('With selected sample registration event', async () => {
        const wrapper = mountWithServerContext(
            <SampleTimelinePageBaseImpl {...DEFAULT_PROPS} initialSelectedEvent={registrationEvent} />,
            { user: TEST_USER_FOLDER_ADMIN }
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find(SampleEventListing)).toHaveLength(1);
        expect(wrapper.find(SampleEventListing).prop('selectedEvent')).toBe(registrationEvent);
        expect(wrapper.find(AuditDetails)).toHaveLength(1);
        expect(wrapper.find(AuditDetails).prop('rowId')).toBe(registrationEvent.rowId);
        expect(wrapper.find(AuditDetails).prop('summary')).toBe('Sample Registered');

        wrapper.unmount();
    });

    test('With selected assay re-import event', async () => {
        const wrapper = mountWithServerContext(
            <SampleTimelinePageBaseImpl {...DEFAULT_PROPS} initialSelectedEvent={assayReimportEvent} />,
            { user: TEST_USER_FOLDER_ADMIN }
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find(SampleEventListing)).toHaveLength(1);
        expect(wrapper.find(SampleEventListing).prop('selectedEvent')).toBe(assayReimportEvent);
        expect(wrapper.find(AuditDetails)).toHaveLength(1);
        expect(wrapper.find(AuditDetails).prop('rowId')).toBe(assayReimportEvent.rowId);
        expect(wrapper.find(AuditDetails).prop('summary')).toBe('Assay Data Re-Import Run');

        wrapper.unmount();
    });
});
