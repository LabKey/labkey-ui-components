import React from 'react';
import { ReactWrapper } from 'enzyme';

import { PermissionTypes } from '@labkey/api';

import { ProductMenuModel } from '../internal/components/navigation/model';
import { makeTestActions, makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';

import { mountWithAppServerContext, waitForLifecycle } from '../internal/testHelpers';
import { TEST_USER_EDITOR } from '../internal/userFixtures';
import { createMockWithRouterProps } from '../internal/mockUtils';

import { Page } from '../internal/components/base/Page';
import { NotFound } from '../internal/components/base/NotFound';

import { QueryInfo } from '../public/QueryInfo';
import { LoadingState } from '../public/LoadingState';
import { LoadingPage } from '../internal/components/base/LoadingPage';
import { getTestAPIWrapper } from '../internal/APIWrapper';
import { getSecurityTestAPIWrapper } from '../internal/components/security/APIWrapper';
import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../test/data/constants';

import { Notifications } from '../internal/components/notifications/Notifications';

import { InsufficientPermissionsAlert } from '../internal/components/permissions/InsufficientPermissionsAlert';

import { Container } from '../internal/components/base/models/Container';

import { GENERAL_ASSAY_PROVIDER_NAME } from '../internal/components/assay/constants';

import { SampleDetailPage, SampleDetailPageBody, SampleDetailPageBodyProps } from './SampleDetailPage';
import { SampleTypeAppContext } from './SampleTypeAppContext';
import { SampleHeader } from './SampleHeader';
import { SampleOverviewPanel } from './SampleOverviewPanel';
import { SampleAliquotsPage } from './SampleAliquotsPage';
import { SampleAliquotsGridPanel } from './SampleAliquotsGridPanel';
import { SampleAssaysPage } from './SampleAssaysPage';
import { SampleAssayDetail } from './SampleAssayDetail';

import { SampleLineagePage, SampleLineagePanel } from './SampleLineagePage';

const QUERY_MODEL = makeTestQueryModel(
    SchemaQuery.create('schema', 'query'),
    new QueryInfo(),
    {
        1: {
            RowId: { value: 1 },
            Name: { value: 'S1' },
            LSID: { value: 'S1-LSID' },
            RootMaterialLSID: { value: 'S1-RootMaterialLSID' },
            IsAliquot: { value: false },
            Folder: { value: TEST_PROJECT_CONTAINER.id },
        },
    },
    [1],
    1,
    'sample-detail|samples/blood|1'
).mutate({ queryInfoLoadingState: LoadingState.LOADED, rowsLoadingState: LoadingState.LOADED });
function getDefaultProps(): SampleDetailPageBodyProps {
    return {
        ...createMockWithRouterProps(jest.fn),
        actions: makeTestActions(),
        queryModels: { 'sample-detail|samples/blood|1': QUERY_MODEL },
        menu: new ProductMenuModel(),
        modelId: 'sample-detail|samples/blood|1',
        navigate: jest.fn(),
        params: { sampleType: 'blood', id: '1' },
    };
}
const DEFAULT_CONTEXT = { user: TEST_USER_EDITOR, container: TEST_PROJECT_CONTAINER };

const SAMPLE_TYPE_APP_CONTEXT = {
    SampleStorageMenuComponent: null,
    assayProviderType: GENERAL_ASSAY_PROVIDER_NAME,
    lineagePagePermissions: [PermissionTypes.DesignDataClass],
} as SampleTypeAppContext;
const API_APP_CONTEXT = getTestAPIWrapper(jest.fn, {
    security: getSecurityTestAPIWrapper(jest.fn, {
        fetchContainers: () => Promise.resolve([TEST_PROJECT_CONTAINER]),
    }),
});
const API_APP_CONTEXT_READASSAY = getTestAPIWrapper(jest.fn, {
    security: getSecurityTestAPIWrapper(jest.fn, {
        fetchContainers: () =>
            Promise.resolve([
                {
                    ...TEST_PROJECT_CONTAINER,
                    effectivePermissions: [PermissionTypes.ReadAssay],
                } as Container,
            ]),
    }),
});
const API_APP_CONTEXT_DESIGNDATACLASS = getTestAPIWrapper(jest.fn, {
    security: getSecurityTestAPIWrapper(jest.fn, {
        fetchContainers: () =>
            Promise.resolve([
                {
                    ...TEST_PROJECT_CONTAINER,
                    effectivePermissions: [PermissionTypes.DesignDataClass],
                } as Container,
            ]),
    }),
});

describe('SampleDetailPage', () => {
    function validate(wrapper: ReactWrapper, notFound = false): void {
        expect(wrapper.find(Page)).toHaveLength(1);
        expect(wrapper.find(SampleHeader)).toHaveLength(notFound ? 0 : 1);
        expect(wrapper.find(Notifications)).toHaveLength(1);
        expect(wrapper.find(LoadingPage)).toHaveLength(0);
        expect(wrapper.find(NotFound)).toHaveLength(notFound ? 1 : 0);
    }

    test('default props', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleDetailPageBody {...getDefaultProps()} />,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper);
        validate(wrapper);
        expect(wrapper.find(Page).prop('title')).toBe('S1 - undefined');
        expect(wrapper.find(SampleHeader).prop('showDescription')).toBe(true);
        expect(wrapper.find(SampleHeader).prop('isCrossFolder')).toBe(false);
        expect(wrapper.find(SampleHeader).prop('StorageMenu')).toBe(null);
        expect(wrapper.find(SampleOverviewPanel)).toHaveLength(0);
        wrapper.unmount();
    });

    test('isCrossFolder', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleDetailPageBody {...getDefaultProps()} />,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            { user: TEST_USER_EDITOR, container: TEST_FOLDER_CONTAINER }
        );
        await waitForLifecycle(wrapper, 1000);
        validate(wrapper);
        expect(wrapper.find(SampleHeader).prop('isCrossFolder')).toBe(true);
        wrapper.unmount();
    });

    test('NotFound', async () => {
        const queryModel = makeTestQueryModel(SchemaQuery.create('schema', 'query'), new QueryInfo(), {}, [], 0).mutate(
            { queryInfoLoadingState: LoadingState.LOADED, rowsLoadingState: LoadingState.LOADED }
        );
        const wrapper = mountWithAppServerContext(
            <SampleDetailPageBody
                {...getDefaultProps()}
                queryModels={{ 'sample-detail|samples/blood|1': queryModel }}
            />,
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
            <SampleDetailPageBody
                {...getDefaultProps()}
                queryModels={{ 'sample-detail|samples/blood|1': queryModel }}
            />,
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
            <SampleDetailPageBody {...getDefaultProps()}>
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

describe('SampleAliquotsPage', () => {
    test('default props', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleAliquotsPage {...getDefaultProps()} />,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(SampleDetailPage)).toHaveLength(1);
        expect(wrapper.find(SampleDetailPage).prop('title')).toBe('Aliquots');
        expect(wrapper.find(SampleAliquotsGridPanel)).toHaveLength(1);
        const props = wrapper.find(SampleAliquotsGridPanel).props();
        expect(props.sampleId).toBe(1);
        expect(props.sampleLsid).toBe('S1-LSID');
        expect(props.rootLsid).toBe('S1-RootMaterialLSID');
        wrapper.unmount();
    });

    test('title', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleAliquotsPage {...getDefaultProps()} title="Test title" />,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(SampleDetailPage)).toHaveLength(1);
        expect(wrapper.find(SampleDetailPage).prop('title')).toBe('Test title');
        wrapper.unmount();
    });
});

describe('SampleAssaysPage', () => {
    test('default props', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleAssaysPage {...getDefaultProps()} />,
            { api: API_APP_CONTEXT_READASSAY, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(SampleDetailPage)).toHaveLength(1);
        expect(wrapper.find(SampleDetailPage).prop('title')).toBe('Sample Assay Results');
        expect(wrapper.find(InsufficientPermissionsAlert)).toHaveLength(0);
        expect(wrapper.find(SampleAssayDetail)).toHaveLength(1);
        const props = wrapper.find(SampleAssayDetail).props();
        expect(props.sampleId).toBe(1);
        expect(props.showAliquotViewSelector).toBe(true);
        expect(props.exportPrefix).toBe('S1');
        wrapper.unmount();
    });

    test('title', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleAssaysPage {...getDefaultProps()} title="Test title" />,
            { api: API_APP_CONTEXT_READASSAY, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(SampleDetailPage)).toHaveLength(1);
        expect(wrapper.find(SampleDetailPage).prop('title')).toBe('Test title');
        wrapper.unmount();
    });

    test('insufficient permissions', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleAssaysPage {...getDefaultProps()} />,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(SampleDetailPage)).toHaveLength(1);
        expect(wrapper.find(InsufficientPermissionsAlert)).toHaveLength(1);
        expect(wrapper.find(SampleAssayDetail)).toHaveLength(0);
        wrapper.unmount();
    });
});

describe('SampleLineagePage', () => {
    test('default props', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleLineagePage {...getDefaultProps()} />,
            { api: API_APP_CONTEXT_DESIGNDATACLASS, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(SampleDetailPage)).toHaveLength(1);
        expect(wrapper.find(SampleDetailPage).prop('title')).toBe('Sample Lineage');
        expect(wrapper.find(InsufficientPermissionsAlert)).toHaveLength(0);
        expect(wrapper.find(SampleLineagePanel)).toHaveLength(1);
        const props = wrapper.find(SampleLineagePanel).props();
        expect(props.sampleID).toBe('S1');
        expect(props.sampleLsid).toBe('S1-LSID');
        wrapper.unmount();
    });

    test('title', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleLineagePage {...getDefaultProps()} title="Test title" />,
            { api: API_APP_CONTEXT_DESIGNDATACLASS, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(SampleDetailPage)).toHaveLength(1);
        expect(wrapper.find(SampleDetailPage).prop('title')).toBe('Test title');
        wrapper.unmount();
    });

    test('insufficient permissions', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleLineagePage {...getDefaultProps()} />,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(SampleDetailPage)).toHaveLength(1);
        expect(wrapper.find(InsufficientPermissionsAlert)).toHaveLength(1);
        expect(wrapper.find(SampleLineagePanel)).toHaveLength(0);
        wrapper.unmount();
    });
});
