import React from 'react';
import renderer from 'react-test-renderer';
import { shallow } from 'enzyme';

import { TimelineEventModel } from '../internal/components/auditlog/models';

import DUMMY_TIMELINE from '../test/data/SampleTimeline.json';

import { TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT } from '../internal/productFixtures';

import { SampleEventListing } from './SampleEventListing';
import {TEST_USER_APP_ADMIN, TEST_USER_READER} from "../internal/userFixtures";

beforeAll(() => {
    LABKEY.container = {
        formats: {
            dateFormat: 'yyyy-MM-dd',
            dateTimeFormat: 'yyyy-MM-dd HH:mm',
            numberFormat: null,
        },
    };
});

describe('<SampleEventListing/>', () => {
    const dummyData = DUMMY_TIMELINE;
    const events: TimelineEventModel[] = [];
    if (dummyData['events']) {
        (dummyData['events'] as []).forEach(event => events.push(TimelineEventModel.create(event, 'UTC')));
    }

    const registrationEvent = events[0],
        sampleUpdateEvent = events[2],
        jobCompleted = events[6],
        jobNotCompleteWithRelated = events[4],
        jobNotCompletedNoRelated = events[8],
        assayDataUploadEvent = events[3],
        assayReimportEvent = events[7];

    test('Without selected event', () => {
        const tree = shallow(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                onEventSelection={jest.fn()}
                events={events}
                user={TEST_USER_APP_ADMIN}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('Without view user link perm', () => {
        const tree = shallow(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                onEventSelection={jest.fn()}
                events={events}
                user={TEST_USER_READER}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('Sort by latest', () => {
        const comp = shallow(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                onEventSelection={jest.fn()}
                events={events}
                user={TEST_USER_APP_ADMIN}
            />
        );

        comp.instance().setState({ showRecentFirst: true });
        comp.update();
        expect(comp).toMatchSnapshot();
    });

    test('Filter by event type and date', () => {
        LABKEY.moduleContext = {
            ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
        };
        const comp = shallow(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                onEventSelection={jest.fn()}
                events={events}
                user={TEST_USER_APP_ADMIN}
            />
        );

        comp.instance().setState({
            filterExpanded: true,
            includeJobEvent: true,
            filterStartDate: new Date('2020-04-09 00:00:00.000 UTC'),
        });
        comp.update();
        comp.find('.timeline-filter-apply-btn').last().simulate('click');
        comp.update();
        expect(comp).toMatchSnapshot();
    });

    test('With selected sample registration event', () => {
        const tree = shallow(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={registrationEvent}
                user={TEST_USER_APP_ADMIN}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('With selected sample update event', () => {
        const tree = shallow(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={sampleUpdateEvent}
                user={TEST_USER_APP_ADMIN}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('With selected assay upload event', () => {
        const tree = shallow(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={assayDataUploadEvent}
                user={TEST_USER_APP_ADMIN}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('With selected assay re-import event', () => {
        const tree = shallow(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={assayReimportEvent}
                user={TEST_USER_APP_ADMIN}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('With selected job that is completed', () => {
        LABKEY.moduleContext = {
            ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
        };
        const tree = shallow(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={jobCompleted}
                user={TEST_USER_APP_ADMIN}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('With selected job that is completed and with filter by date', () => {
        const comp = shallow(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={jobCompleted}
                user={TEST_USER_APP_ADMIN}
            />
        );

        comp.instance().setState({ filterExpanded: true, filterStartDate: new Date('2020-04-08 00:00:00.000 UTC') });
        comp.update();
        comp.find('.timeline-filter-apply-btn').last().simulate('click');
        comp.update();
        expect(comp).toMatchSnapshot();
    });

    test('With selected job that is not completed and has no related job events', () => {
        const tree = shallow(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={jobNotCompletedNoRelated}
                user={TEST_USER_APP_ADMIN}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('With selected job that is not completed but has related job events', () => {
        const tree = shallow(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={jobNotCompleteWithRelated}
                user={TEST_USER_APP_ADMIN}
            />
        );
        expect(tree).toMatchSnapshot();
    });
});
