import React from 'react';

import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { initUnitTestMocks } from '../../../test/testHelperMocks';
import { initPipelineStatusDetailsMocks } from '../../../test/mock';

import { PipelineStatusDetailPage } from './PipelineStatusDetailPage';

beforeAll(() => {
    initUnitTestMocks([initPipelineStatusDetailsMocks]);
});

describe('<PipelineStatusDetailPage>', () => {
    test('Completed job, no warn, no error', async () => {
        const wrapper = mountWithAppServerContext(<PipelineStatusDetailPage rowId={1} />, {}, {});
        await waitForLifecycle(wrapper);
        expect(wrapper.debug({ verbose: false })).toMatchSnapshot();
    });

    test('Failed job, with error', async () => {
        const wrapper = mountWithAppServerContext(<PipelineStatusDetailPage rowId={2} />, {}, {});
        await waitForLifecycle(wrapper);
        expect(wrapper.debug({ verbose: false })).toMatchSnapshot();
    });

    test('Running job, with warning', async () => {
        const wrapper = mountWithAppServerContext(<PipelineStatusDetailPage rowId={3} />, {}, {});
        await waitForLifecycle(wrapper);

        expect(wrapper.debug({ verbose: false })).toMatchSnapshot();
    });
});
