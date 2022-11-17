import React from 'react';

import { mountWithAppServerContext } from '../internal/testHelpers';
import { makeTestActions, makeTestQueryModel } from '../public/QueryModel/testUtils';

import { TEST_USER_EDITOR, TEST_USER_READER, TEST_USER_STORAGE_EDITOR } from '../internal/userFixtures';

import { SchemaQuery } from '../public/SchemaQuery';
import { SCHEMAS } from '../internal/schemas';
import { QueryInfo } from '../public/QueryInfo';
import { ResponsiveMenuButtonGroup } from '../internal/components/buttons/ResponsiveMenuButtonGroup';
import { LoadingState } from '../public/LoadingState';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { ManageDropdownButton } from '../internal/components/buttons/ManageDropdownButton';

import { TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT, TEST_LKSM_STARTER_MODULE_CONTEXT } from '../internal/productFixtures';

import { EntityDeleteModal } from './EntityDeleteModal';

import { SampleAliquotsGridPanelImpl } from './SampleAliquotsGridPanel';
import { SampleTypeAppContext } from './SampleTypeAppContext';

beforeEach(() => {
    LABKEY.moduleContext = { ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT };
});

const MODEL_ID = 'aliquot-model';

describe('SampleAliquotsGridPanel', () => {
    const SCHEMA_QUERY = SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, 'SampleTypeName');
    const DEFAULT_CONTEXT = { user: TEST_USER_EDITOR };
    const SAMPLE_TYPE_APP_CONTEXT = {} as SampleTypeAppContext;

    const DEFAULT_PROPS = {
        actions: makeTestActions(jest.fn),
        onSampleChangeInvalidate: jest.fn(),
        queryModels: {
            [MODEL_ID]: makeTestQueryModel(SCHEMA_QUERY, new QueryInfo(), {}, [], 0, MODEL_ID),
        },
        sampleLsid: 'lsidValue',
        schemaQuery: SCHEMA_QUERY,
        user: TEST_USER_READER,
    };

    test('check buttons with permissions', () => {
        const DummyButton1 = () => <div className="storage-button-test"> foo </div>;
        const DummyButton2 = () => <div className="jobs-button-test"> bar </div>;

        const wrapper = mountWithAppServerContext(
            <SampleAliquotsGridPanelImpl {...DEFAULT_PROPS} user={TEST_USER_STORAGE_EDITOR} lineageUpdateAllowed />,
            {
                sampleType: {
                    ...SAMPLE_TYPE_APP_CONTEXT,
                    SampleStorageButtonComponent: DummyButton1,
                    JobsButtonComponent: DummyButton2,
                },
            },
            { user: TEST_USER_STORAGE_EDITOR }
        );
        expect(wrapper.find(ResponsiveMenuButtonGroup)).toHaveLength(1);
        const items = wrapper.find(ResponsiveMenuButtonGroup).prop('items');
        expect(items.length).toBe(5);
        wrapper.unmount();
    });

    test('LKSM Starter, without assay', () => {
        LABKEY.moduleContext = { ...TEST_LKSM_STARTER_MODULE_CONTEXT };

        const DummyButton1 = () => <div className="storage-button-test"> foo </div>;
        const DummyButton2 = () => <div className="jobs-button-test"> bar </div>;

        const wrapper = mountWithAppServerContext(
            <SampleAliquotsGridPanelImpl {...DEFAULT_PROPS} user={TEST_USER_STORAGE_EDITOR} lineageUpdateAllowed />,
            {
                sampleType: {
                    ...SAMPLE_TYPE_APP_CONTEXT,
                    SampleStorageButtonComponent: DummyButton1,
                    JobsButtonComponent: DummyButton2,
                },
            },
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

        const wrapper = mountWithAppServerContext(
            <SampleAliquotsGridPanelImpl {...DEFAULT_PROPS} user={TEST_USER_READER} lineageUpdateAllowed />,
            {
                sampleType: {
                    ...SAMPLE_TYPE_APP_CONTEXT,
                    SampleStorageButtonComponent: DummyButton1,
                    JobsButtonComponent: DummyButton2,
                },
            },
            { user: TEST_USER_READER }
        );
        expect(wrapper.find(ResponsiveMenuButtonGroup)).toHaveLength(0);
        wrapper.unmount();
    });

    test('loading', () => {
        const props = DEFAULT_PROPS;
        const model = props.queryModels[MODEL_ID].mutate({ queryInfoLoadingState: LoadingState.LOADING });

        const wrapper = mountWithAppServerContext(
            <SampleAliquotsGridPanelImpl {...props} queryModels={{ [MODEL_ID]:model }} lineageUpdateAllowed={true} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        wrapper.unmount();
    });

    test('show confirm delete', () => {
        const wrapper = mountWithAppServerContext(
            <SampleAliquotsGridPanelImpl {...DEFAULT_PROPS} lineageUpdateAllowed={true} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        wrapper.setState({ showConfirmDelete: true });
        expect(wrapper.find(EntityDeleteModal).exists()).toEqual(true);
        wrapper.unmount();
    });

    test('lineage update not allowed', () => {
        const wrapper = mountWithAppServerContext(
            <SampleAliquotsGridPanelImpl {...DEFAULT_PROPS} lineageUpdateAllowed={false} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        expect(wrapper.find(ManageDropdownButton).exists()).toBeFalsy();
    });
});
