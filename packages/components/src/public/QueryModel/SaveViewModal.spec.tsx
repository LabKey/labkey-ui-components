import React from 'react';

import { mount } from 'enzyme';

import { ViewInfo } from '../../internal/ViewInfo';

import { mountWithServerContext } from '../../internal/test/enzymeTestHelpers';
import {
    TEST_USER_APP_ADMIN,
    TEST_USER_EDITOR,
    TEST_USER_PROJECT_ADMIN,
    TEST_USER_READER
} from '../../internal/userFixtures';

import { SaveViewModal, ViewNameInput } from './SaveViewModal';

describe('SaveViewModal', () => {
    const DEFAULT_PROPS = {
        gridLabel: 'Blood Samples',
        onCancel: jest.fn(),
        onConfirmSave: jest.fn(),
    };

    const DEFAULT_VIEW = ViewInfo.fromJson({
        default: true,
        inherit: true,
    });

    const VIEW_1 = ViewInfo.fromJson({
        label: 'View 1',
        name: 'View1',
        inherit: false,
    });

    const VIEW_2 = ViewInfo.fromJson({
        label: 'View 2',
        name: 'View2',
        inherit: true,
    });

    const moduleContext = {
        query: {
            isProductProjectsEnabled: true,
        },
    };

    test('current view is default', () => {
        const wrapper = mountWithServerContext(<SaveViewModal {...DEFAULT_PROPS} currentView={DEFAULT_VIEW} />, {
            user: TEST_USER_APP_ADMIN,
            container: {
                path: '/home',
                type: 'project',
            },
            moduleContext,
        });

        expect(wrapper.find('.modal-title').text()).toBe('Save Grid View');
        expect(wrapper.find('.modal-body').text()).toContain(
            'Columns, sort order, and filters will be saved. Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(wrapper.find('input[name="gridViewName"]')).toHaveLength(0);
        expect(wrapper.find('input[id="defaultView"]').prop('checked')).toBeTruthy();
        expect(wrapper.find('input[id="customView"]').prop('checked')).toBeFalsy();
        expect(wrapper.find('input[name="setInherit"]').prop('checked')).toBe(true);
        expect(wrapper.find('input[name="setShared"]')).toHaveLength(0);

        wrapper.unmount();
    });

    test('current view is a customized view', () => {
        const wrapper = mountWithServerContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_1} />, {
            user: TEST_USER_PROJECT_ADMIN,
            container: {
                path: '/home',
                type: 'project',
            },
            moduleContext,
        });

        expect(wrapper.find('.modal-title').text()).toBe('Save Grid View');
        expect(wrapper.find('.modal-body').text()).toContain(
            'Columns, sort order, and filters will be saved. Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(wrapper.find('input[name="gridViewName"]').prop('value')).toBe('View1');
        expect(wrapper.find('input[id="defaultView"]').prop('checked')).toBeFalsy();
        expect(wrapper.find('input[id="customView"]').prop('checked')).toBeTruthy();
        expect(wrapper.find('input[name="setInherit"]').prop('checked')).toBe(false);
        expect(wrapper.find('input[name="setShared"]').prop('checked')).toBe(false);

        wrapper.unmount();
    });

    test('customized view in subfolder', () => {
        const wrapper = mountWithServerContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_1} />, {
            user: TEST_USER_PROJECT_ADMIN,
            container: {
                path: '/home/folderA',
                type: 'folder',
            },
            moduleContext,
        });

        expect(wrapper.find('.modal-title').text()).toBe('Save Grid View');
        expect(wrapper.find('.modal-body').text()).toContain(
            'Columns, sort order, and filters will be saved. Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(wrapper.find('input[name="gridViewName"]').prop('value')).toBe('View1');
        expect(wrapper.find('input[id="defaultView"]').prop('checked')).toBeFalsy();
        expect(wrapper.find('input[id="customView"]').prop('checked')).toBeTruthy();
        expect(wrapper.find('input[name="setInherit"]')).toHaveLength(0);
        expect(wrapper.find('input[name="setShared"]').prop('checked')).toBe(false);

        wrapper.unmount();
    });

    test('no admin perm, but shared view perm', () => {
        const wrapper = mountWithServerContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_2} />, {
            user: TEST_USER_EDITOR,
            container: {
                path: '/home',
                type: 'project',
            },
            moduleContext,
        });

        expect(wrapper.find('.modal-title').text()).toBe('Save Grid View');
        expect(wrapper.find('.modal-body').text()).toContain(
            'Columns, sort order, and filters will be saved. Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(wrapper.find('input[name="gridViewName"]').prop('value')).toBe('View2');
        expect(wrapper.find('input[name="setDefaultView"]').length).toEqual(0);
        expect(wrapper.find('input[name="setInherit"]').prop('checked')).toBe(true);
        expect(wrapper.find('input[name="setShared"]').prop('checked')).toBe(false);

        wrapper.unmount();
    });

    test('no shared view perm', () => {
        const wrapper = mountWithServerContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_2} />, {
            user: TEST_USER_READER,
            container: {
                path: '/home',
                type: 'project',
            },
            moduleContext,
        });

        expect(wrapper.find('.modal-title').text()).toBe('Save Grid View');
        expect(wrapper.find('.modal-body').text()).toContain(
            'Columns, sort order, and filters will be saved. Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(wrapper.find('input[name="gridViewName"]').prop('value')).toBe('View2');
        expect(wrapper.find('input[name="setDefaultView"]')).toHaveLength(0);
        expect(wrapper.find('input[name="setInherit"]')).toHaveLength(0);
        expect(wrapper.find('input[name="setShared"]')).toHaveLength(0);

        wrapper.unmount();
    });
});

describe('ViewNameInput', () => {
    test('default view', () => {
        const wrapper = mount(
            <ViewNameInput view={ViewInfo.fromJson({ default: true, name: 'default' })} onBlur={jest.fn()} />
        );
        const input = wrapper.find('input');
        expect(input.prop('value')).toBe('');
        const warning = wrapper.find('.text-danger');
        expect(warning.exists()).toBe(false);
    });

    test('hidden view', () => {
        const wrapper = mount(
            <ViewNameInput
                view={ViewInfo.fromJson({ default: false, name: 'Sample Finder', hidden: true })}
                onBlur={jest.fn()}
            />
        );
        const input = wrapper.find('input');
        expect(input.prop('value')).toBe('');
        const warning = wrapper.find('.text-danger');
        expect(warning.exists()).toBe(false);
    });

    test('valid named view', () => {
        const wrapper = mount(
            <ViewNameInput view={ViewInfo.fromJson({ default: false, name: 'Save Me' })} onBlur={jest.fn()} />
        );
        const input = wrapper.find('input');
        expect(input.prop('value')).toBe('Save Me');
        let warning = wrapper.find('.text-danger');
        expect(warning.exists()).toBe(false);
        input.simulate('change', { target: { value: 'Save Me 2' } });
        warning = wrapper.find('.text-danger');
        expect(warning.exists()).toBe(false);
        input.simulate('blur');
        expect(warning.exists()).toBe(false);
    });

    test('invalid named view', () => {
        const wrapper = mount(
            <ViewNameInput
                view={ViewInfo.fromJson({ default: false, name: 'Save Me' })}
                onBlur={jest.fn()}
                maxLength={10}
            />
        );
        const input = wrapper.find('input');
        input.simulate('change', { target: { value: '12345 78901' } });
        input.simulate('blur');
        const warning = wrapper.find('.text-danger');
        expect(warning.exists()).toBe(true);
        expect(warning.text()).toBe('Current length: 11; maximum length: 10');
    });
});
