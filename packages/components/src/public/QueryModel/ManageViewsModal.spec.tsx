import React from 'react';

import { ViewInfo } from '../../internal/ViewInfo';

import { mountWithAppServerContext, waitForLifecycle } from '../../internal/testHelpers';
import { LoadingSpinner } from '../../internal/components/base/LoadingSpinner';
import { TEST_USER_PROJECT_ADMIN, TEST_USER_READER } from '../../internal/userFixtures';

import { getTestAPIWrapper } from '../../internal/APIWrapper';
import { getQueryTestAPIWrapper } from '../../internal/query/APIWrapper';

import { ManageViewsModal, ViewLabel } from './ManageViewsModal';

export const getQueryAPI = (views: ViewInfo[]) => {
    return getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getGridViews: jest.fn().mockResolvedValue(views),
        }),
    });
};

describe('ManageViewsModal', () => {
    const SYSTEM_DEFAULT_VIEW = ViewInfo.create({
        columns: [],
        filters: [],
        default: true,
        saved: false, // cannot be reverted
        name: '',
    });

    const DEFAULT_VIEW = ViewInfo.create({
        columns: [],
        filters: [],
        default: true,
        saved: true, // can be reverted
        name: '',
    });

    const VIEW_1 = ViewInfo.create({
        columns: [],
        filters: [],
        default: false,
        label: 'View 1',
        name: 'View1',
    });

    const SESSION_VIEW = ViewInfo.create({
        columns: [],
        filters: [],
        default: false,
        label: 'View 2',
        name: 'View2',
        session: true,
    });

    const SHARED_VIEW = ViewInfo.create({
        columns: [],
        filters: [],
        default: false,
        label: 'View 3',
        name: 'View3',
        shared: true,
    });

    const INHERITED_VIEW = ViewInfo.create({
        columns: [],
        filers: [],
        default: false,
        label: "View 4",
        name: 'View4',
        shared: false,
        inherit: true
    });

    const SHARED_AND_INHERITED_VIEW = ViewInfo.create({
        columns: [],
        filers: [],
        default: false,
        label: "View 5",
        name: 'View5',
        shared: true,
        inherit: true
    });

    test('no views', async () => {
        const wrapper = mountWithAppServerContext(
            <ManageViewsModal onDone={jest.fn()} currentView={null} schemaQuery={null} />,
            {
                api: getQueryAPI([]),
            },
            {
                user: TEST_USER_READER,
            }
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        const rows = wrapper.find('.row');
        expect(rows.length).toBe(0);

        wrapper.unmount();
    });

    test('multiple saved views: default, named, shared and session view', async () => {
        const wrapper = mountWithAppServerContext(
            <ManageViewsModal onDone={jest.fn()} currentView={null} schemaQuery={null} />,
            {
                api: getQueryAPI([DEFAULT_VIEW, VIEW_1, SESSION_VIEW, SHARED_VIEW]),
            },
            {
                user: TEST_USER_PROJECT_ADMIN,
            }
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        expect(wrapper.find('ModalTitle').text()).toBe('Manage Saved Views');

        const rows = wrapper.find('.row');
        expect(rows.length).toBe(4);

        const labels = wrapper.find(ViewLabel);
        expect(labels.length).toBe(4);
        expect(labels.at(0).text()).toBe('Default View');
        expect(rows.at(0).find('.fa-pencil').length).toBe(0);
        expect(rows.at(0).find('.fa-trash-o').length).toBe(0);
        expect(rows.at(0).find('.clickable-text').length).toBe(1);
        expect(rows.at(0).find('.clickable-text').text()).toBe('Revert');

        expect(labels.at(1).text()).toBe('View 1');
        expect(rows.at(1).find('.fa-pencil').length).toBe(1);
        expect(rows.at(1).find('.fa-trash-o').length).toBe(1);
        expect(rows.at(1).find('.clickable-text').length).toBe(1);
        expect(rows.at(1).find('.clickable-text').text()).toBe('Make default');

        expect(labels.at(2).text()).toBe('View 2 (edited)');
        expect(rows.at(2).find('.fa-pencil').length).toBe(0);
        expect(rows.at(2).find('.fa-trash-o').length).toBe(0);
        expect(rows.at(2).find('.clickable-text').length).toBe(1);
        expect(rows.at(2).find('.clickable-text').text()).toBe('Make default');

        expect(labels.at(3).text()).toBe('View 3 (shared)');
        expect(rows.at(3).find('.fa-pencil').length).toBe(1);
        expect(rows.at(3).find('.fa-trash-o').length).toBe(1);
        expect(rows.at(0).find('.gray-text').length).toBe(0);
        expect(rows.at(3).find('.clickable-text').length).toBe(1);
        expect(rows.at(3).find('.clickable-text').text()).toBe('Make default');

        const findButton = wrapper.find('button.btn-default');
        expect(findButton.text()).toEqual('Done');

        wrapper.unmount();
    });

    test('system default view', async () => {
        const wrapper = mountWithAppServerContext(
            <ManageViewsModal onDone={jest.fn()} currentView={null} schemaQuery={null} />,
            {
                api: getQueryAPI([SYSTEM_DEFAULT_VIEW, VIEW_1, SESSION_VIEW, SHARED_VIEW]),
            },
            {
                user: TEST_USER_PROJECT_ADMIN,
            }
        );
        await waitForLifecycle(wrapper);

        const rows = wrapper.find('.row');
        expect(rows.length).toBe(4);
        const labels = wrapper.find(ViewLabel);
        expect(labels).toHaveLength(4);
        expect(labels.at(0).text()).toBe('Default View');
        expect(rows.at(0).find('.fa-pencil').length).toBe(0);
        expect(rows.at(0).find('.fa-trash-o').length).toBe(0);
        expect(rows.at(0).find('.clickable-text').length).toBe(0);
        expect(rows.at(0).find('.gray-text').length).toBe(1);
        expect(rows.at(0).find('.gray-text').text()).toBe('Revert');

        wrapper.unmount();
    });

    test('multiple saved views: no admin permission', async () => {
        const wrapper = mountWithAppServerContext(
            <ManageViewsModal onDone={jest.fn()} currentView={null} schemaQuery={null} />,
            {
                api: getQueryAPI([DEFAULT_VIEW, VIEW_1, SESSION_VIEW, SHARED_VIEW]),
            },
            {
                user: TEST_USER_READER,
            }
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        expect(wrapper.find('ModalTitle').text()).toBe('Manage Saved Views');

        const rows = wrapper.find('.row');
        expect(rows.length).toBe(4);
        const labels = wrapper.find(ViewLabel);
        expect(labels).toHaveLength(4);
        expect(labels.at(0).text()).toBe('Default View');
        expect(rows.at(0).find('.fa-pencil').length).toBe(0);
        expect(rows.at(0).find('.fa-trash-o').length).toBe(0);
        expect(rows.at(0).find('.clickable-text').length).toBe(0);

        expect(labels.at(1).text()).toBe('View 1');
        expect(rows.at(1).find('.fa-pencil').length).toBe(1);
        expect(rows.at(1).find('.fa-trash-o').length).toBe(1);
        expect(rows.at(1).find('.clickable-text').length).toBe(0);

        expect(labels.at(2).text()).toBe('View 2 (edited)');
        expect(rows.at(2).find('.fa-pencil').length).toBe(0);
        expect(rows.at(2).find('.fa-trash-o').length).toBe(0);
        expect(rows.at(2).find('.clickable-text').length).toBe(0);

        expect(labels.at(3).text()).toBe('View 3 (shared)');
        expect(rows.at(3).find('.fa-pencil').length).toBe(0);
        expect(rows.at(3).find('.fa-trash-o').length).toBe(0);
        expect(rows.at(3).find('.clickable-text').length).toBe(0);

        const findButton = wrapper.find('button.btn-default');
        expect(findButton.text()).toEqual('Done');

        wrapper.unmount();
    });
});
