import {initUnitTestMocks, sleep} from "../../testHelpers";
import React from "react";
import {PipelineStatusDetailPage} from "./PipelineStatusDetailPage";
import {initNotificationsState} from "../../..";
import renderer from "react-test-renderer";

beforeAll(() => {
    initUnitTestMocks(undefined, undefined, true);
    initNotificationsState();
});

describe('<PipelineStatusDetailPage>', () => {
    test('Completed job, no warn, no error', async () => {
        const wrapper = renderer.create(
            <PipelineStatusDetailPage
                rowId={1}
            />
        );
        await sleep();

        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });

    test('Failed job, with error', async () => {
        const wrapper = renderer.create(
            <PipelineStatusDetailPage
                rowId={2}
            />
        );
        await sleep();

        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });

    test('Running job, with warning', async () => {
        const wrapper = renderer.create(
            <PipelineStatusDetailPage
                rowId={3}
            />
        );
        await sleep();

        expect(wrapper).toMatchSnapshot();
        wrapper.unmount();
    });

})
