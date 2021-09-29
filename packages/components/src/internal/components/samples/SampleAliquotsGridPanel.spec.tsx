import React from 'react';

import {
    App,
    EntityDeleteModal,
    LoadingSpinner,
    LoadingState,
    QueryInfo,
    SampleAliquotsGridPanel,
    SchemaQuery,
    SCHEMAS,
} from '../../..';

import { mountWithServerContext } from '../../testHelpers';
import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';

import { SampleAliquotsGridPanelImpl } from './SampleAliquotsGridPanel';

describe('SampleAliquotsGridPanel', () => {
    const SCHEMA_QUERY = SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'SampleTypeName');
    const DEFAULT_CONTEXT = { user: App.TEST_USER_EDITOR };

    const DEFAULT_PROPS = {
        actions: makeTestActions(jest.fn),
        onSampleChangeInvalidate: jest.fn(),
        queryModels: {
            model: makeTestQueryModel(SCHEMA_QUERY, new QueryInfo(), {}, [], 0, 'model'),
        },
        sampleLsid: 'lsidValue',
        schemaQuery: SCHEMA_QUERY,
        user: App.TEST_USER_READER,
    };

    test('with storageButton node', () => {
        const DummyButton = () => <div className="dummyButton"> foo </div>;

        const wrapper = mountWithServerContext(
            <SampleAliquotsGridPanelImpl storageButton={DummyButton} {...DEFAULT_PROPS} />,
            DEFAULT_CONTEXT
        );
        expect(wrapper.find(DummyButton).exists()).toEqual(true);
        wrapper.unmount();
    });

    test('loading', () => {
        const props = DEFAULT_PROPS;
        const model = props.queryModels.model.mutate({ queryInfoLoadingState: LoadingState.LOADING });

        const wrapper = mountWithServerContext(
            <SampleAliquotsGridPanelImpl {...props} queryModels={{ model }} />,
            DEFAULT_CONTEXT
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        wrapper.unmount();
    });

    test('show confirm delete', () => {
        const wrapper = mountWithServerContext(<SampleAliquotsGridPanelImpl {...DEFAULT_PROPS} />, DEFAULT_CONTEXT);
        wrapper.setState({ showConfirmDelete: true });
        expect(wrapper.find(EntityDeleteModal).exists()).toEqual(true);
        wrapper.unmount();
    });
});
