import React from 'react';

import { ModalBody } from 'react-bootstrap';

import { ViewInfo } from '../../internal/ViewInfo';

import { mountWithServerContext } from '../../internal/testHelpers';
import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR, TEST_USER_PROJECT_ADMIN } from '../../internal/userFixtures';

import { SaveViewModal } from './SaveViewModal';

beforeAll(() => {
    LABKEY.moduleContext = {
        query: {
            isSubfolderDataEnabled: true,
        },
    };
});

describe('SaveViewModal', () => {
    const DEFAULT_PROPS = {
        gridLabel: 'Blood Samples',
        onCancel: jest.fn(),
        onConfirmSave: jest.fn(),
    };

    const DEFAULT_VIEW = ViewInfo.create({
        columns: [],
        filters: [],
        default: true,
        name: '',
        inherit: true,
    });

    const VIEW_1 = ViewInfo.create({
        columns: [],
        filters: [],
        default: false,
        label: 'View 1',
        name: 'View1',
        inherit: false,
    });

    const VIEW_2 = ViewInfo.create({
        columns: [],
        filters: [],
        default: false,
        label: 'View 2',
        name: 'View2',
        inherit: true,
    });

    const moduleContext = {
        query: {
            isSubfolderDataEnabled: true,
        },
    };

    test('current view is default', async () => {
        const wrapper = mountWithServerContext(<SaveViewModal {...DEFAULT_PROPS} currentView={DEFAULT_VIEW} />, {
            user: TEST_USER_APP_ADMIN,
            moduleContext,
        });

        expect(wrapper.find('ModalTitle').text()).toBe('Save Grid View');
        expect(wrapper.find(ModalBody).text()).toContain(
            'Sort order and filters are not saved as part of custom grid views. Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(wrapper.find('input[name="gridViewName"]').prop('value')).toBe('');
        expect(wrapper.find('input[name="setDefaultView"]').prop('checked')).toBe(true);
        expect(wrapper.find('input[name="setInherit"]').prop('checked')).toBe(true);

        wrapper.unmount();
    });

    test('current view is a customized view', async () => {
        const wrapper = mountWithServerContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_1} />, {
            user: TEST_USER_PROJECT_ADMIN,
            moduleContext,
        });

        expect(wrapper.find('ModalTitle').text()).toBe('Save Grid View');
        expect(wrapper.find(ModalBody).text()).toContain(
            'Sort order and filters are not saved as part of custom grid views. Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(wrapper.find('input[name="gridViewName"]').prop('value')).toBe('View1');
        expect(wrapper.find('input[name="setDefaultView"]').prop('checked')).toBe(false);
        expect(wrapper.find('input[name="setInherit"]').prop('checked')).toBe(false);

        wrapper.unmount();
    });

    test('no admin perm', async () => {
        const wrapper = mountWithServerContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_2} />, {
            user: TEST_USER_EDITOR,
            moduleContext,
        });

        expect(wrapper.find('ModalTitle').text()).toBe('Save Grid View');
        expect(wrapper.find(ModalBody).text()).toContain(
            'Sort order and filters are not saved as part of custom grid views. Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(wrapper.find('input[name="gridViewName"]').prop('value')).toBe('View2');
        expect(wrapper.find('input[name="setDefaultView"]').length).toEqual(0);
        expect(wrapper.find('input[name="setInherit"]').prop('checked')).toBe(true);

        wrapper.unmount();
    });
});
