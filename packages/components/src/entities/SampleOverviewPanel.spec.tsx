import React from 'react';
import { ReactWrapper } from 'enzyme';

import { makeTestActions, makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';

import { mountWithAppServerContext, waitForLifecycle } from '../internal/testHelpers';
import { TEST_USER_EDITOR } from '../internal/userFixtures';

import { QueryInfo } from '../public/QueryInfo';
import { LoadingState } from '../public/LoadingState';
import { TEST_PROJECT_CONTAINER } from '../test/data/constants';

import { User } from '../internal/components/base/models/User';

import { SampleTypeAppContext } from '../internal/AppContext';
import { SampleOverviewPanel } from './SampleOverviewPanel';
import { SampleAliquotsSummary } from './SampleAliquotsSummary';
import { SampleDetailEditing } from './SampleDetailEditing';

const SQ = SchemaQuery.create('schema', 'query');
const ROW = {
    Folder: { value: TEST_PROJECT_CONTAINER.id },
    RowId: { value: 1 },
    Name: { value: 'S1' },
    LSID: { value: 'S1-LSID' },
    RootMaterialLSID: { value: 'S1-RootMaterialLSID' },
    IsAliquot: { value: false },
    'AliquotedFromLSID/Name': { value: undefined },
};
const QUERY_MODEL = makeTestQueryModel(
    SQ,
    new QueryInfo({ schemaQuery: SQ }),
    {
        1: ROW,
    },
    [1],
    1,
    'test-model-id'
).mutate({ queryInfoLoadingState: LoadingState.LOADED, rowsLoadingState: LoadingState.LOADED });
const DEFAULT_PROPS = {
    SampleStorageLocationComponent: undefined,
    actionChangeCount: 0,
    actions: makeTestActions(),
    canUpdate: true,
    onDetailUpdate: jest.fn(),
    sampleContainer: TEST_PROJECT_CONTAINER,
    sampleModel: QUERY_MODEL,
    user: TEST_USER_EDITOR,
};
const DEFAULT_CONTEXT = { user: TEST_USER_EDITOR, container: TEST_PROJECT_CONTAINER };
const SAMPLE_TYPE_APP_CONTEXT = {
    getWorkflowGridQueryConfigs: (visibleTabs: string[], gridPrefix: string, user: User) => {
        return {};
    },
} as SampleTypeAppContext;

describe('SampleOverviewPanel', () => {
    function validate(wrapper: ReactWrapper, isMedia = false, isAliquot = false): void {
        expect(wrapper.find('.row')).toHaveLength(isMedia ? 1 : 2);
        expect(wrapper.find(SampleAliquotsSummary)).toHaveLength(!isMedia && !isAliquot ? 1 : 0);
        expect(wrapper.find(SampleDetailEditing)).toHaveLength(1);
    }

    test('default props', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleOverviewPanel {...DEFAULT_PROPS} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper, 1000);
        validate(wrapper);
        expect(wrapper.find(SampleDetailEditing).prop('canUpdate')).toBe(true);
        wrapper.unmount();
    });

    test('isMedia', async () => {
        const queryModel = QUERY_MODEL.mutate({ queryInfo: new QueryInfo({ isMedia: true, name: 'MediaName' }) });
        const wrapper = mountWithAppServerContext(
            <SampleOverviewPanel {...DEFAULT_PROPS} sampleModel={queryModel} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper, 1000);
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('canUpdate false', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleOverviewPanel {...DEFAULT_PROPS} canUpdate={false} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper, 1000);
        validate(wrapper);
        expect(wrapper.find(SampleDetailEditing).prop('canUpdate')).toBe(false);
        wrapper.unmount();
    });

    test('isAliquot', async () => {
        const queryModel = makeTestQueryModel(
            SQ,
            new QueryInfo({ schemaQuery: SQ }),
            {
                1: {
                    ...ROW,
                    IsAliquot: { value: true },
                    'AliquotedFromLSID/Name': { value: 'S-Parent' },
                },
            },
            [1],
            1,
            'test-model-id'
        ).mutate({ queryInfoLoadingState: LoadingState.LOADED, rowsLoadingState: LoadingState.LOADED });

        const wrapper = mountWithAppServerContext(
            <SampleOverviewPanel {...DEFAULT_PROPS} sampleModel={queryModel} />,
            { sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper, 1000);
        validate(wrapper, false, true);
        wrapper.unmount();
    });
});
