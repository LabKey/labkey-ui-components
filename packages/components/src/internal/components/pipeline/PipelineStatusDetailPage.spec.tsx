import React from 'react';

import pipelineStatusDetails from '../../../test/data/pipelineStatusDetails.json';
import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';

import { PipelineStatusDetailModel } from './model';

import { PipelineStatusDetailPage } from './PipelineStatusDetailPage';

const fetch = (id) => {
    const json = pipelineStatusDetails.find(detail => {
        return detail.rowId === id;
    });
    const model = PipelineStatusDetailModel.fromJSON(json.data);
    return Promise.resolve(model);
};

describe('<PipelineStatusDetailPage>', () => {
    test('Completed job, no warn, no error', async () => {
        const wrapper = mountWithAppServerContext(<PipelineStatusDetailPage fetchPipelineStatusDetail={fetch} rowId={1} />, {}, {});
        await waitForLifecycle(wrapper);
        expect(wrapper.debug({ verbose: false })).toMatchSnapshot();
    });

    test('Failed job, with error', async () => {
        const wrapper = mountWithAppServerContext(<PipelineStatusDetailPage fetchPipelineStatusDetail={fetch} rowId={2} />, {}, {});
        await waitForLifecycle(wrapper);
        expect(wrapper.debug({ verbose: false })).toMatchSnapshot();
    });

    test('Running job, with warning', async () => {
        const wrapper = mountWithAppServerContext(<PipelineStatusDetailPage fetchPipelineStatusDetail={fetch} rowId={3} />, {}, {});
        await waitForLifecycle(wrapper);

        expect(wrapper.debug({ verbose: false })).toMatchSnapshot();
    });
});
