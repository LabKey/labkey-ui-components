import React from 'react';
import { ReactWrapper } from 'enzyme';

import { ProductMenuModel } from '../internal/components/navigation/model';
import { makeTestActions, makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';

import { mountWithAppServerContext, waitForLifecycle } from '../internal/testHelpers';
import { TEST_USER_EDITOR } from '../internal/userFixtures';

import { Page } from '../internal/components/base/Page';
import { NotFound } from '../internal/components/base/NotFound';

import { QueryInfo } from '../public/QueryInfo';
import { LoadingState } from '../public/LoadingState';
import { LoadingPage } from '../internal/components/base/LoadingPage';
import { getTestAPIWrapper } from '../internal/APIWrapper';
import { getSecurityTestAPIWrapper } from '../internal/components/security/APIWrapper';
import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../test/data/constants';

import { SampleDetailPageBody } from './SampleDetailPage';
import { SampleTypeAppContext } from './SampleTypeAppContext';
import { SampleHeader } from './SampleHeader';
import { Notifications } from '../internal/components/notifications/Notifications';
import { SampleOverviewPanel } from './SampleOverviewPanel';

describe('SampleDetailPage', () => {
    const QUERY_MODEL = makeTestQueryModel(
        SchemaQuery.create('schema', 'query'),
        new QueryInfo(),
        {
            1: {
                RowId: { value: 1 },
                Name: { value: 'S1' },
                IsAliquot: { value: false },
                Folder: { value: TEST_PROJECT_CONTAINER.id },
            },
        },
        [1],
        1,
        'test-model-id'
    ).mutate({ queryInfoLoadingState: LoadingState.LOADED, rowsLoadingState: LoadingState.LOADED });
    const DEFAULT_PROPS = {
        actions: makeTestActions(),
        queryModels: { 'test-model-id': QUERY_MODEL },
        menu: new ProductMenuModel(),
        modelId: 'test-model-id',
        navigate: jest.fn(),
        params: { sampleType: 'blood' },
        title: 'Test title',
    };
    const DEFAULT_CONTEXT = { user: TEST_USER_EDITOR, container: TEST_PROJECT_CONTAINER };
    const SAMPLE_TYPE_APP_CONTEXT = {
        SampleStorageMenuComponent: null,
    } as SampleTypeAppContext;
    const API_APP_CONTEXT = getTestAPIWrapper(jest.fn, {
        security: getSecurityTestAPIWrapper(jest.fn, {
            fetchContainers: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER]),
        }),
    });

    function validate(wrapper: ReactWrapper, notFound = false): void {
        expect(wrapper.find(Page)).toHaveLength(1);
        expect(wrapper.find(SampleHeader)).toHaveLength(notFound ? 0 : 1);
        expect(wrapper.find(Notifications)).toHaveLength(1);
        expect(wrapper.find(LoadingPage)).toHaveLength(0);
        expect(wrapper.find(NotFound)).toHaveLength(notFound ? 1 : 0);
    }

    test('default props', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleDetailPageBody {...DEFAULT_PROPS} />,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(Page).prop('title')).toBe('S1 - Test title');
        expect(wrapper.find(SampleHeader).prop('showDescription')).toBe(true);
        expect(wrapper.find(SampleHeader).prop('isCrossFolder')).toBe(false);
        expect(wrapper.find(SampleHeader).prop('StorageMenu')).toBe(null);
        expect(wrapper.find(SampleOverviewPanel)).toHaveLength(0);
        wrapper.unmount();
    });

    test('isCrossFolder', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleDetailPageBody {...DEFAULT_PROPS} />,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            { user: TEST_USER_EDITOR, container: TEST_FOLDER_CONTAINER }
        );
        await waitForLifecycle(wrapper, 1000);
        validate(wrapper);
        expect(wrapper.find(SampleHeader).prop('isCrossFolder')).toBe(true);
        wrapper.unmount();
    });

    test('NotFound', async () => {
        const queryModel = makeTestQueryModel(SchemaQuery.create('schema', 'query'), new QueryInfo(), {}, [], 0).mutate({ queryInfoLoadingState: LoadingState.LOADED, rowsLoadingState: LoadingState.LOADED });
        const wrapper = mountWithAppServerContext(
            <SampleDetailPageBody {...DEFAULT_PROPS} queryModels={{ 'test-model-id': queryModel }} />,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper);
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('isMedia', async () => {
        const queryModel = QUERY_MODEL.mutate({ queryInfo: new QueryInfo({ isMedia: true, name: 'MediaName' }) });
        const wrapper = mountWithAppServerContext(
            <SampleDetailPageBody {...DEFAULT_PROPS} queryModels={{ 'test-model-id': queryModel }} />,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(SampleHeader).prop('StorageMenu')).toBe(undefined);
        wrapper.unmount();
    });

    test('render children', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleDetailPageBody {...DEFAULT_PROPS}>
                <div id="render-child-id">testing</div>
            </SampleDetailPageBody>,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find('#render-child-id')).toHaveLength(1);
        wrapper.unmount();
    });
});
