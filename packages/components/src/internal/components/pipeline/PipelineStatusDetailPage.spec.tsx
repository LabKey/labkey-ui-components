import React from 'react';

import { mountWithServerContext, waitForLifecycle } from '../../testHelpers';
import { initUnitTestMocks } from '../../../test/testHelperMocks';
import { initPipelineStatusDetailsMocks } from '../../../test/mock';

import { initNotificationsState } from '../../..';

import { PipelineStatusDetailPage } from './PipelineStatusDetailPage';

beforeAll(() => {
    initUnitTestMocks([initPipelineStatusDetailsMocks]);
    initNotificationsState();
});

describe('<PipelineStatusDetailPage>', () => {
    test('Completed job, no warn, no error', async () => {
        const wrapper = mountWithServerContext(<PipelineStatusDetailPage rowId={1} />, undefined);
        await waitForLifecycle(wrapper);
        expect(wrapper.debug({ verbose: false })).toMatchSnapshot();
    });

    test('Failed job, with error', async () => {
        const wrapper = mountWithServerContext(<PipelineStatusDetailPage rowId={2} />, undefined);
        await waitForLifecycle(wrapper);
        expect(wrapper.debug({ verbose: false })).toMatchSnapshot();
    });

    test('Running job, with warning', async () => {
        const wrapper = mountWithServerContext(<PipelineStatusDetailPage rowId={3} />, undefined);
        await waitForLifecycle(wrapper);

        expect(wrapper.debug({ verbose: false })).toMatchSnapshot();
    });
});
