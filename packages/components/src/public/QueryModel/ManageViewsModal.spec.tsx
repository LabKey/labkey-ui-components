import React from 'react';

import { mount } from 'enzyme';

import { ViewInfo } from '../../internal/ViewInfo';

import { mountWithAppServerContext, waitForLifecycle } from '../../internal/test/enzymeTestHelpers';
import { LoadingSpinner } from '../../internal/components/base/LoadingSpinner';
import { TEST_USER_PROJECT_ADMIN, TEST_USER_READER } from '../../internal/userFixtures';

import { getTestAPIWrapper } from '../../internal/APIWrapper';
import { getQueryTestAPIWrapper } from '../../internal/query/APIWrapper';

import { ManageViewsModal, ViewLabel } from './ManageViewsModal';

const getQueryAPI = (views: ViewInfo[]) => {
    return getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            getGridViews: jest.fn().mockResolvedValue(views),
        }),
    });
};

const SYSTEM_DEFAULT_VIEW = ViewInfo.fromJson({
    default: true,
    saved: false, // cannot be reverted
});

const SYSTEM_DETAIL_VIEW = ViewInfo.fromJson({
    saved: false, // cannot be reverted
    name: ViewInfo.DETAIL_NAME,
});

const SHARED_DEFAULT_VIEW = ViewInfo.fromJson({
    default: true,
    saved: true, // can be reverted
    shared: true,
});

const MY_DEFAULT_VIEW = ViewInfo.fromJson({
    default: true,
    saved: true, // can be reverted
});

const VIEW_1 = ViewInfo.fromJson({
    default: false,
    label: 'View 1',
    name: 'View1',
});

const SESSION_VIEW = ViewInfo.fromJson({
    default: false,
    label: 'View 2',
    name: 'View2',
    session: true,
});

const SHARED_VIEW = ViewInfo.fromJson({
    default: false,
    label: 'View 3',
    name: 'View3',
    shared: true,
});

describe('ViewLabel', () => {
    test('default view', () => {
        const wrapper = mount(<ViewLabel view={SYSTEM_DEFAULT_VIEW} />);
        expect(wrapper.text()).toBe('Default View');
        wrapper.unmount();
    });

    test('own default view', () => {
        const wrapper = mount(<ViewLabel view={MY_DEFAULT_VIEW} />);
        expect(wrapper.text()).toBe('My Default View');
        wrapper.unmount();
    });

    test('shared default view', () => {
        const wrapper = mount(<ViewLabel view={SHARED_DEFAULT_VIEW} />);
        expect(wrapper.text()).toBe('Default View (shared)');
        wrapper.unmount();
    });

    test('default view, edited', () => {
        const wrapper = mount(<ViewLabel view={ViewInfo.fromJson({ default: true, session: true })} />);
        expect(wrapper.text()).toBe('Default View (edited)');
        wrapper.unmount();
    });

    test('shared view', () => {
        const wrapper = mount(<ViewLabel view={SHARED_VIEW} />);
        expect(wrapper.text()).toBe('View 3 (shared)');
        wrapper.unmount();
    });

    test('shared view, edited', () => {
        const wrapper = mount(
            <ViewLabel
                view={ViewInfo.fromJson({
                    label: 'View 3',
                    name: 'View3',
                    session: true,
                })}
            />
        );
        expect(wrapper.text()).toBe('View 3 (edited)');
        wrapper.unmount();
    });

    test('inherited view', () => {
        const wrapper = mount(
            <ViewLabel
                view={ViewInfo.fromJson({
                    label: 'View 4',
                    name: 'View4',
                    shared: false,
                    inherit: true,
                })}
            />
        );
        expect(wrapper.text()).toBe('View 4 (inherited)');
        wrapper.unmount();
    });

    test('inherited view, edited', () => {
        const wrapper = mount(
            <ViewLabel
                view={ViewInfo.fromJson({
                    label: 'View 4',
                    name: 'View4',
                    shared: false,
                    inherit: true,
                    session: true,
                })}
            />
        );
        expect(wrapper.text()).toBe('View 4 (edited)');
        wrapper.unmount();
    });

    test('shared, inherited view', () => {
        const wrapper = mount(
            <ViewLabel
                view={ViewInfo.fromJson({
                    label: 'View 5',
                    name: 'View5',
                    shared: true,
                    inherit: true,
                })}
            />
        );
        expect(wrapper.text()).toBe('View 5 (inherited, shared)');
        wrapper.unmount();
    });

    test('edited, shared, inherited view', () => {
        const wrapper = mount(
            <ViewLabel
                view={ViewInfo.fromJson({
                    label: 'View 5',
                    name: 'View5',
                    shared: true,
                    inherit: true,
                    session: true,
                })}
            />
        );
        expect(wrapper.text()).toBe('View 5 (edited)');
        wrapper.unmount();
    });
});

describe('ManageViewsModal', () => {
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
                api: getQueryAPI([SHARED_DEFAULT_VIEW, VIEW_1, SESSION_VIEW, SHARED_VIEW]),
            },
            {
                user: TEST_USER_PROJECT_ADMIN,
            }
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        expect(wrapper.find('.modal-title').text()).toBe('Manage Saved Views');

        const rows = wrapper.find('.row');
        expect(rows.length).toBe(4);

        const labels = wrapper.find(ViewLabel);
        expect(labels.length).toBe(4);
        expect(labels.at(0).text()).toBe('Default View (shared)');
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
                api: getQueryAPI([SYSTEM_DEFAULT_VIEW, SYSTEM_DETAIL_VIEW, VIEW_1, SESSION_VIEW, SHARED_VIEW]),
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
                api: getQueryAPI([MY_DEFAULT_VIEW, VIEW_1, SESSION_VIEW, SHARED_VIEW]),
            },
            {
                user: TEST_USER_READER,
            }
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        expect(wrapper.find('.modal-title').text()).toBe('Manage Saved Views');

        const rows = wrapper.find('.row');
        expect(rows.length).toBe(4);
        const labels = wrapper.find(ViewLabel);
        expect(labels).toHaveLength(4);
        expect(labels.at(0).text()).toBe('My Default View');
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
