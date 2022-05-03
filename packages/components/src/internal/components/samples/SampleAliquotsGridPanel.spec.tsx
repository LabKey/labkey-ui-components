import React from 'react';

import {
    App,
    EntityDeleteModal,
    LoadingSpinner,
    LoadingState,
    ManageDropdownButton,
    QueryInfo,
    ResponsiveMenuButtonGroup,
    SampleAliquotsGridPanel,
    SchemaQuery,
    SCHEMAS,
} from '../../..';

import { mountWithServerContext } from '../../testHelpers';
import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';

import { SampleAliquotsGridPanelImpl } from './SampleAliquotsGridPanel';
import { TEST_USER_READER, TEST_USER_STORAGE_EDITOR } from '../../userFixtures';

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

    test('check buttons with permissions', () => {
        const DummyButton1 = () => <div className="storage-button-test"> foo </div>;
        const DummyButton2 = () => <div className="jobs-button-test"> bar </div>;

        const wrapper = mountWithServerContext(
            <SampleAliquotsGridPanelImpl
                {...DEFAULT_PROPS}
                user={TEST_USER_STORAGE_EDITOR}
                lineageUpdateAllowed
                storageButton={DummyButton1}
                jobsButton={DummyButton2}
            />,
            { user: TEST_USER_STORAGE_EDITOR }
        );
        expect(wrapper.find(ResponsiveMenuButtonGroup)).toHaveLength(1);
        const items = wrapper.find(ResponsiveMenuButtonGroup).prop('items');
        expect(items.length).toBe(4);
        wrapper.unmount();
    });

    test('check buttons without permissions', () => {
        const DummyButton1 = () => <div className="storage-button-test"> foo </div>;
        const DummyButton2 = () => <div className="jobs-button-test"> bar </div>;

        const wrapper = mountWithServerContext(
            <SampleAliquotsGridPanelImpl
                {...DEFAULT_PROPS}
                user={TEST_USER_READER}
                lineageUpdateAllowed
                storageButton={DummyButton1}
                jobsButton={DummyButton2}
            />,
            { user: TEST_USER_READER }
        );
        expect(wrapper.find(ResponsiveMenuButtonGroup)).toHaveLength(0);
        wrapper.unmount();
    });

    test('loading', () => {
        const props = DEFAULT_PROPS;
        const model = props.queryModels.model.mutate({ queryInfoLoadingState: LoadingState.LOADING });

        const wrapper = mountWithServerContext(
            <SampleAliquotsGridPanelImpl {...props} queryModels={{ model }} lineageUpdateAllowed={true} />,
            DEFAULT_CONTEXT
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        wrapper.unmount();
    });

    test('show confirm delete', () => {
        const wrapper = mountWithServerContext(
            <SampleAliquotsGridPanelImpl {...DEFAULT_PROPS} lineageUpdateAllowed={true} />,
            DEFAULT_CONTEXT
        );
        wrapper.setState({ showConfirmDelete: true });
        expect(wrapper.find(EntityDeleteModal).exists()).toEqual(true);
        wrapper.unmount();
    });

    test('lineage update not allowed', () => {
        const wrapper = mountWithServerContext(
            <SampleAliquotsGridPanelImpl {...DEFAULT_PROPS} lineageUpdateAllowed={false} />,
            DEFAULT_CONTEXT
        );
        expect(wrapper.find(ManageDropdownButton).exists()).toBeFalsy();
    });
});
