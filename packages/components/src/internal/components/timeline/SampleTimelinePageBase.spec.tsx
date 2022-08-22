import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { App, makeTestActions, makeTestQueryModel, sleep, waitForLifecycle } from '../../../index';

import SampleTimelineJson from '../../../test/data/SampleTimeline.json';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getSamplesTestAPIWrapper } from '../samples/APIWrapper';

import { TimelineEventModel } from '../auditlog/models';
import { SampleStateType } from '../samples/constants';

import { SampleTimelinePageBaseImpl } from './SampleTimelinePageBase';

describe('<SampleTimelinePageBase/>', () => {
    const dummyData = SampleTimelineJson;
    const events: TimelineEventModel[] = [];
    if (dummyData['events']) {
        (dummyData['events'] as []).forEach(event => events.push(TimelineEventModel.create(event, 'UTC')));
    }

    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {
            samples: getSamplesTestAPIWrapper(jest.fn, {
                getTimelineEvents: (sampleId, timezone) => Promise.resolve(dummyData),
            }),
        }),
        queryModels: {},
        actions: makeTestActions(),
        sampleSet: 'Samples',
        sampleId: 86873,
        sampleName: 'S-20200404-1',
        user: App.TEST_USER_FOLDER_ADMIN,
        skipAuditDetailUserLoading: true,
        timezoneAbbr: 'UTC',
        sampleStatus: {
            label: 'Available for Testing',
            statusType: SampleStateType.Available,
            description: 'Description for testing',
        },
        sampleJobsGidId: 'test',
    };

    // const component = (
    //     <SampleTimelinePageBaseImpl
    //         api={getTestAPIWrapper(jest.fn, {
    //             samples: getSamplesTestAPIWrapper(jest.fn, {
    //                 getTimelineEvents: (sampleId, timezone) =>
    //                     Promise.resolve(dummyData),
    //             }),
    //         })}
    //         queryModels={{}}
    //         actions={makeTestActions()}
    //         sampleSet={'Samples'}
    //         sampleId={86873}
    //         sampleName={'S-20200404-1'}
    //         user={App.TEST_USER_FOLDER_ADMIN}
    //         skipAuditDetailUserLoading={true}
    //         timezoneAbbr={'UTC'}
    //         sampleStatus={{label: 'Available for Testing', statusType: SampleStateType.Available, description: 'Description for testing'}}
    //         sampleJobsGidId={'test'}
    //     />
    // );

    const registrationEvent = events[0],
        sampleUpdateEvent = events[2],
        jobCompleted = events[6],
        assayReimportEvent = events[7];

    test('Without selected event', async () => {
        const tree = mount(<SampleTimelinePageBaseImpl {...DEFAULT_PROPS} />);
        await sleep();
        expect(tree).toMatchSnapshot();
    });

    test('With selected sample registration event', async () => {
        const tree = mount(<SampleTimelinePageBaseImpl {...DEFAULT_PROPS} />);
        await sleep();
        expect(tree).toMatchSnapshot();
        tree.unmount();
    });

    test('With selected sample update event', async () => {
        const tree = mount(<SampleTimelinePageBaseImpl {...DEFAULT_PROPS} initialSelectedEvent={sampleUpdateEvent} />);
        await sleep();
        expect(tree).toMatchSnapshot();
        tree.unmount();
    });

    test('With selected assay re-import event', async () => {
        const tree = mount(<SampleTimelinePageBaseImpl {...DEFAULT_PROPS} initialSelectedEvent={assayReimportEvent} />);
        await sleep();
        expect(tree).toMatchSnapshot();
        tree.unmount();
    });

    test('With selected job', async () => {
        const tree = mount(<SampleTimelinePageBaseImpl {...DEFAULT_PROPS} initialSelectedEvent={jobCompleted} />);
        // await sleep();
        // await sleep();
        // await waitForLifecycle(tree);
        await waitForLifecycle(tree);
        // await sleep();
        expect(tree).toMatchSnapshot();
        tree.unmount();
    });
});
