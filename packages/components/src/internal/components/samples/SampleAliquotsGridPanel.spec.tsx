import React from 'react';

import {
    App,
    LoadingSpinner,
    LoadingState,
    QueryInfo,
    QueryModel,
    SampleAliquotsGridPanel,
    SchemaQuery,
} from '../../../index';
import { mountWithServerContext } from '../../testHelpers';

describe('<SampleAliquotsGridPanel/>', () => {
    const SAMPLE_TYPE_NAME = 'SampleTypeName';
    const DEFAULT_CONTEXT = { user: App.TEST_USER_EDITOR };

    const queryInfo = QueryInfo.create({ schemaName: 'samples', name: SAMPLE_TYPE_NAME, queryLabel: SAMPLE_TYPE_NAME });
    let model = new QueryModel({ schemaQuery: SchemaQuery.create('samples', SAMPLE_TYPE_NAME) });
    model = model.mutate({
        queryInfo,
        queryInfoLoadingState: LoadingState.LOADED,
        rowsLoadingState: LoadingState.LOADED,
        chartsLoadingState: LoadingState.LOADED,
    });

    const DEFAULT_PROPS = {
        sampleLsid: 'lsidValue',
        schemaQuery: SchemaQuery.create('samples', SAMPLE_TYPE_NAME),
        user: App.TEST_USER_READER,
        onSampleChangeInvalidate: jest.fn(),
        queryModels: { modelid: model },
        actions: {
            loadCharts: jest.fn(),
            loadModel: jest.fn(),
            addModel: jest.fn(),
        },
    };

    test('with storageButton node', () => {
        const DummyButton = () => {
            return <div className="dummyButton"> foo </div>;
        };

        const wrapper = mountWithServerContext(
            <SampleAliquotsGridPanel storageButton={DummyButton} {...DEFAULT_PROPS} />,
            DEFAULT_CONTEXT
        );
        expect(wrapper.find(DummyButton).exists()).toEqual(true);
        wrapper.unmount();
    });

    test('loading spinner', () => {
        const loadingProps = { ...DEFAULT_PROPS, queryModels: [false] };

        const wrapper = mountWithServerContext(<SampleAliquotsGridPanel {...loadingProps} />, DEFAULT_CONTEXT);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);

        wrapper.unmount();
    });

    // Temp comment: :(
    // test('show confirm delete', () => {
    //     const wrapper = mountWithServerContext(<SampleAliquotsGridPanel {...DEFAULT_PROPS} />, DEFAULT_CONTEXT);
    //     wrapper.setState({ showConfirmDelete: true });
    //     wrapper.update();
    //     wrapper.instance().forceUpdate();
    //
    //     wrapper.instance().setState({ showConfirmDelete: true }, () => {
    //         wrapper.instance().forceUpdate();
    //         console.log(wrapper.debug());
    //     });
    //     wrapper.unmount();
    // });
});
