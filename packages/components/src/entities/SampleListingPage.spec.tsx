import React from 'react';
import { MenuItem } from 'react-bootstrap';
import { ReactWrapper } from 'enzyme';
import { PermissionTypes } from '@labkey/api';
import { List } from 'immutable';

import { makeTestActions, makeTestQueryModel } from '../public/QueryModel/testUtils';
import { QueryInfo } from '../public/QueryInfo';
import { SchemaQuery } from '../public/SchemaQuery';

import { SHARED_CONTAINER_PATH } from '../internal/constants';
import { TEST_USER_AUTHOR, TEST_USER_EDITOR, TEST_USER_FOLDER_ADMIN, TEST_USER_GUEST } from '../internal/userFixtures';

import { createMockWithRouterProps } from '../internal/mockUtils';
import { ProductMenuModel } from '../internal/components/navigation/model';
import { TEST_PROJECT_CONTAINER } from '../test/data/constants';
import { LoadingState } from '../public/LoadingState';

import { mountWithAppServerContext, waitForLifecycle } from '../internal/testHelpers';

import { NotFound } from '../internal/components/base/NotFound';
import { LoadingPage } from '../internal/components/base/LoadingPage';
import { getTestAPIWrapper } from '../internal/APIWrapper';
import { getSecurityTestAPIWrapper } from '../internal/components/security/APIWrapper';

import { User } from '../internal/components/base/models/User';

import { initBrowserHistoryState } from '../internal/util/global';

import { ManageDropdownButton } from '../internal/components/buttons/ManageDropdownButton';

import { Container } from '../internal/components/base/models/Container';

import { DesignerDetailPanel } from '../internal/components/domainproperties/DesignerDetailPanel';

import { PrintLabelsModal } from '../internal/components/labels/PrintLabelsModal';

import { ColorIcon } from '../internal/components/base/ColorIcon';

import { SampleTypeAppContext } from '../internal/AppContext';

import { SampleTypeBasePage } from './SampleTypeBasePage';
import {
    getIsSharedModel,
    hasPermissions,
    SampleListingPageBody,
    SampleListingPageBodyProps,
} from './SampleListingPage';

import { SampleTypeInsightsPanel } from './SampleTypeInsightsPanel';
import { SamplesTabbedGridPanel } from './SamplesTabbedGridPanel';
import { SampleSetDeleteModal } from './SampleSetDeleteModal';

const SQ = new SchemaQuery('schema', 'query');

beforeAll(() => {
    initBrowserHistoryState();
});

describe('getIsSharedModel', () => {
    test('without folder path', () => {
        let queryModel = makeTestQueryModel(SQ, new QueryInfo(), { 1: {} }, [1], 1);
        expect(getIsSharedModel(queryModel)).toBeFalsy();
        queryModel = makeTestQueryModel(SQ, new QueryInfo(), { 1: { 'Folder/Path': undefined } }, [1], 1);
        expect(getIsSharedModel(queryModel)).toBeFalsy();
        queryModel = makeTestQueryModel(SQ, new QueryInfo(), { 1: { 'Folder/Path': { value: undefined } } }, [1], 1);
        expect(getIsSharedModel(queryModel)).toBeFalsy();
    });

    test('with folder path', () => {
        let queryModel = makeTestQueryModel(
            SQ,
            new QueryInfo(),
            { 1: { 'Folder/Path': { value: '/Project' } } },
            [1],
            1
        );
        expect(getIsSharedModel(queryModel)).toBeFalsy();
        queryModel = makeTestQueryModel(
            SQ,
            new QueryInfo(),
            { 1: { 'Folder/Path': { value: SHARED_CONTAINER_PATH } } },
            [1],
            1
        );
        expect(getIsSharedModel(queryModel)).toBeTruthy();
    });
});

describe('hasPermissions', () => {
    test('not shared container', () => {
        expect(hasPermissions(TEST_USER_AUTHOR, [PermissionTypes.Insert, PermissionTypes.Update])).toBeFalsy();
        expect(hasPermissions(TEST_USER_EDITOR, [PermissionTypes.Insert, PermissionTypes.Update])).toBeTruthy();
        expect(hasPermissions(TEST_USER_EDITOR, [PermissionTypes.Insert, PermissionTypes.Update], false)).toBeTruthy();
        expect(
            hasPermissions(
                TEST_USER_EDITOR,
                [PermissionTypes.Insert, PermissionTypes.Update],
                false,
                List.of(PermissionTypes.Insert)
            )
        ).toBeTruthy();
    });

    test('shared container', () => {
        expect(
            hasPermissions(
                TEST_USER_AUTHOR,
                [PermissionTypes.Insert, PermissionTypes.Update],
                true,
                List.of(PermissionTypes.Insert)
            )
        ).toBeFalsy();
        expect(
            hasPermissions(
                TEST_USER_AUTHOR,
                [PermissionTypes.Insert, PermissionTypes.Update],
                true,
                List.of(PermissionTypes.Insert, PermissionTypes.Update)
            )
        ).toBeTruthy();
        expect(
            hasPermissions(
                TEST_USER_EDITOR,
                [PermissionTypes.Insert, PermissionTypes.Update],
                true,
                List.of(PermissionTypes.Insert)
            )
        ).toBeFalsy();
        expect(
            hasPermissions(
                TEST_USER_EDITOR,
                [PermissionTypes.Insert, PermissionTypes.Update],
                true,
                List.of(PermissionTypes.Insert, PermissionTypes.Update)
            )
        ).toBeTruthy();
        expect(hasPermissions(TEST_USER_EDITOR, [PermissionTypes.Insert, PermissionTypes.Update], true)).toBeFalsy();
    });
});

describe('SampleListingPageBody', () => {
    const DEFAULT_CONTEXT = { user: TEST_USER_FOLDER_ADMIN, container: TEST_PROJECT_CONTAINER };
    const SAMPLE_TYPE_APP_CONTEXT = {
        getSamplesEditableGridProps: (user: User) => {},
    } as SampleTypeAppContext;
    const API_APP_CONTEXT = getTestAPIWrapper(jest.fn, {
        security: getSecurityTestAPIWrapper(jest.fn, {
            fetchContainers: () =>
                Promise.resolve([
                    {
                        ...TEST_PROJECT_CONTAINER,
                        effectivePermissions: [PermissionTypes.CanSeeAuditLog, PermissionTypes.DesignSampleSet],
                    } as Container,
                ]),
        }),
    });

    const QUERY_MODEL = makeTestQueryModel(
        SQ,
        new QueryInfo(),
        {
            1: {
                'Folder/Path': { value: TEST_PROJECT_CONTAINER.id },
            },
        },
        [1],
        1,
        'samples-listing'
    ).mutate({ queryInfoLoadingState: LoadingState.LOADED, rowsLoadingState: LoadingState.LOADED });

    function getDefaultProps(): SampleListingPageBodyProps {
        return {
            ...createMockWithRouterProps(jest.fn),
            actions: makeTestActions(jest.fn),
            queryModels: { 'samples-listing': QUERY_MODEL, 'samples-details': QUERY_MODEL },
            menu: new ProductMenuModel(),
            sampleListModelId: 'samples-listing',
            navigate: jest.fn(),
            params: { sampleType: 'Blood' },
            getIsDirty: jest.fn(),
            setIsDirty: jest.fn(),
        };
    }

    function validate(wrapper: ReactWrapper, menuItemCount = 15): void {
        expect(wrapper.find(NotFound)).toHaveLength(0);
        expect(wrapper.find(LoadingPage)).toHaveLength(0);
        expect(wrapper.find(SampleTypeBasePage)).toHaveLength(1);
        expect(wrapper.find(DesignerDetailPanel)).toHaveLength(1);
        expect(wrapper.find(SampleTypeInsightsPanel)).toHaveLength(1);
        expect(wrapper.find(SamplesTabbedGridPanel)).toHaveLength(1);
        expect(wrapper.find(SampleSetDeleteModal)).toHaveLength(0);
        expect(wrapper.find(PrintLabelsModal)).toHaveLength(0);
        expect(wrapper.find(ManageDropdownButton)).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(menuItemCount);
    }

    test('default props', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleListingPageBody {...getDefaultProps()} />,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper, 100);
        validate(wrapper);
        expect(wrapper.find(SampleTypeBasePage).prop('title')).toBe('Sample Type - Overview');
        expect(wrapper.find(ColorIcon)).toHaveLength(0);
        wrapper.unmount();
    });

    test('queryInfo title', async () => {
        const queryModel = QUERY_MODEL.mutate({ queryInfo: new QueryInfo({ title: 'Test title' }) });
        const wrapper = mountWithAppServerContext(
            <SampleListingPageBody
                {...getDefaultProps()}
                queryModels={{ 'samples-listing': queryModel, 'samples-details': QUERY_MODEL }}
            />,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper, 100);
        validate(wrapper);
        expect(wrapper.find(SampleTypeBasePage).prop('title')).toBe('Test title');
        wrapper.unmount();
    });

    test('ColorIcon', async () => {
        const queryModel = QUERY_MODEL.mutate({
            rows: {
                1: {
                    'Folder/Path': { value: TEST_PROJECT_CONTAINER.id },
                    LabelColor: { value: 'BLUE' },
                },
            },
        });
        const wrapper = mountWithAppServerContext(
            <SampleListingPageBody
                {...getDefaultProps()}
                queryModels={{ 'samples-listing': QUERY_MODEL, 'samples-details': queryModel }}
            />,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );

        await waitForLifecycle(wrapper, 100);
        validate(wrapper);
        expect(wrapper.find(ColorIcon)).toHaveLength(1);
        wrapper.unmount();
    });

    test('without perm for audit', async () => {
        const appContext = getTestAPIWrapper(jest.fn, {
            security: getSecurityTestAPIWrapper(jest.fn, {
                fetchContainers: () =>
                    Promise.resolve([
                        {
                            ...TEST_PROJECT_CONTAINER,
                            effectivePermissions: [PermissionTypes.DesignSampleSet],
                        } as Container,
                    ]),
            }),
        });

        const wrapper = mountWithAppServerContext(
            <SampleListingPageBody {...getDefaultProps()} />,
            { api: appContext, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper, 100);
        validate(wrapper, 14);
        wrapper.unmount();
    });

    test('without perm for design sample set', async () => {
        const appContext = getTestAPIWrapper(jest.fn, {
            security: getSecurityTestAPIWrapper(jest.fn, {
                fetchContainers: () =>
                    Promise.resolve([
                        {
                            ...TEST_PROJECT_CONTAINER,
                            effectivePermissions: [PermissionTypes.CanSeeAuditLog],
                        } as Container,
                    ]),
            }),
        });

        const wrapper = mountWithAppServerContext(
            <SampleListingPageBody {...getDefaultProps()} />,
            { api: appContext, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            DEFAULT_CONTEXT
        );
        await waitForLifecycle(wrapper, 100);
        validate(wrapper, 13);
        wrapper.unmount();
    });

    test('guest cannot PrintLabels', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleListingPageBody {...getDefaultProps()} />,
            { api: API_APP_CONTEXT, sampleType: SAMPLE_TYPE_APP_CONTEXT },
            { user: TEST_USER_GUEST, container: TEST_PROJECT_CONTAINER }
        );
        await waitForLifecycle(wrapper, 100);
        validate(wrapper, 11);
        wrapper.unmount();
    });
});
