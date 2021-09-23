import React from "react";
import { shallow } from 'enzyme';
import {
    App,
    LoadingSpinner,
    LoadingState,
    QueryInfo,
    QueryModel,
    SampleAliquotsGridPanel,
    SchemaQuery
} from "../../../index";
import {mountWithServerContext} from "../../testHelpers";

//IN PROGRESS
describe('<SampleAliquotsGridPanel/>', () => {
    const SAMPLE_TYPE_NAME = 'SampleTypeName';
    let model = new QueryModel({ schemaQuery: SchemaQuery.create('samples', SAMPLE_TYPE_NAME) });
    const queryInfo = QueryInfo.create({ schemaName: 'samples', name: SAMPLE_TYPE_NAME, queryLabel: SAMPLE_TYPE_NAME });
    model = model.mutate({
        queryInfo,
        rows: {
            '0': {
                RowId: { value: 0 },
                Data: { value: 100 },
            },
        },
        orderedRows: ['0'],
        queryInfoLoadingState: LoadingState.LOADED,
        rowsLoadingState: LoadingState.LOADED,
        chartsLoadingState: LoadingState.LOADED
    });

    const DEFAULT_PROPS = {
        sampleLsid: 'urn:lsid:labkey.com:Sample.87.NewestSampleType:seven',
        schemaQuery: SchemaQuery.create('samples', 'name'),
        user: App.TEST_USER_READER,
        onSampleChangeInvalidate: jest.fn(),
        queryModels: {['modelid']: model },
        actions: {
            loadCharts: jest.fn(),
            loadModel: jest.fn(),
            addModel: jest.fn()
        }
    };
    const DEFAULT_CONTEXT = {user: App.TEST_USER_READER};


    // todo
    test('with storageButton node', () => {
        const wrapper = shallow(<SampleAliquotsGridPanel {...DEFAULT_PROPS}/>);
        wrapper.unmount();
    });

    test('loading spinner', () => {
        const loadingProps = {...DEFAULT_PROPS, queryModels: [false]}

        const wrapper = mountWithServerContext(<SampleAliquotsGridPanel {...loadingProps}/>, DEFAULT_CONTEXT);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);

        wrapper.unmount();
    });

    // can't do it :(
    test('show confirm delete', () => {
        const wrapper = mountWithServerContext(<SampleAliquotsGridPanel {...DEFAULT_PROPS}/>, DEFAULT_CONTEXT);
        wrapper.setState({ showConfirmDelete: true });
        wrapper.update();
        wrapper.instance().forceUpdate();

        wrapper.instance().setState({ showConfirmDelete: true }, () => {
            wrapper.instance().forceUpdate();
            console.log(wrapper.debug());

        });
        wrapper.unmount();
    });
});
