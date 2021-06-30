import React from 'react';

import renderer from 'react-test-renderer';

import { sleep } from '../../testHelpers';
import { initUnitTestMocks } from '../../testHelperMocks';
import { initPipelineStatusDetailsMocks } from '../../mock';

import { initNotificationsState } from '../../..';

import { PipelineStatusDetailPage } from './PipelineStatusDetailPage';

beforeAll(() => {
    initUnitTestMocks([initPipelineStatusDetailsMocks]);
    initNotificationsState();
});

describe('<PipelineStatusDetailPage>', () => {
    test('Completed job, no warn, no error', async () => {
        const wrapper = renderer.create(<PipelineStatusDetailPage rowId={1} />);
        await sleep();

        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });

    test('Failed job, with error', async () => {
        const wrapper = renderer.create(<PipelineStatusDetailPage rowId={2} />);
        await sleep();

        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });

    test('Running job, with warning', async () => {
        const wrapper = renderer.create(<PipelineStatusDetailPage rowId={3} />);
        await sleep();

        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });
});
