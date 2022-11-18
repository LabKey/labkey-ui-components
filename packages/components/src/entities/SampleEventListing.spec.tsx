import React from 'react';
import renderer from 'react-test-renderer';
import { shallow } from 'enzyme';

import { TimelineEventModel } from '../internal/components/auditlog/models';

import DUMMY_TIMELINE from '../test/data/SampleTimeline.json';

import { SampleEventListing } from './SampleEventListing';
import { TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT } from '../internal/productFixtures';

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
        const tree = renderer.create(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                showUserLinks={true}
                onEventSelection={jest.fn()}
                events={events}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('Without view user link perm', () => {
        const tree = renderer.create(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                showUserLinks={false}
                onEventSelection={jest.fn()}
                events={events}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('Sort by latest', () => {
        const comp = shallow(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                showUserLinks={true}
                onEventSelection={jest.fn()}
                events={events}
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
                showUserLinks={true}
                onEventSelection={jest.fn()}
                events={events}
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
        const tree = renderer.create(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                showUserLinks={true}
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={registrationEvent}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('With selected sample update event', () => {
        const tree = renderer.create(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                showUserLinks={true}
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={sampleUpdateEvent}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('With selected assay upload event', () => {
        const tree = renderer.create(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                showUserLinks={true}
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={assayDataUploadEvent}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('With selected assay re-import event', () => {
        const tree = renderer.create(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                showUserLinks={true}
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={assayReimportEvent}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('With selected job that is completed', () => {
        LABKEY.moduleContext = {
            ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
        };
        const tree = renderer.create(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                showUserLinks={true}
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={jobCompleted}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('With selected job that is completed and with filter by date', () => {
        const comp = shallow(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                showUserLinks={true}
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={jobCompleted}
            />
        );

        comp.instance().setState({ filterExpanded: true, filterStartDate: new Date('2020-04-08 00:00:00.000 UTC') });
        comp.update();
        comp.find('.timeline-filter-apply-btn').last().simulate('click');
        comp.update();
        expect(comp).toMatchSnapshot();
    });

    test('With selected job that is not completed and has no related job events', () => {
        const tree = renderer.create(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                showUserLinks={true}
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={jobNotCompletedNoRelated}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('With selected job that is not completed but has related job events', () => {
        const tree = renderer.create(
            <SampleEventListing
                sampleId={86873}
                sampleName="S-20200404-1"
                showUserLinks={true}
                onEventSelection={jest.fn()}
                events={events}
                selectedEvent={jobNotCompleteWithRelated}
            />
        );
        expect(tree).toMatchSnapshot();
    });
});
