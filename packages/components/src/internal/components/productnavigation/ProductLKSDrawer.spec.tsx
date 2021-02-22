import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Container } from '../../..';
import { TEST_USER_FOLDER_ADMIN, TEST_USER_EDITOR } from '../../../test/data/users';

import { isProjectAvailable, getProjectBeginUrl, ProductLKSDrawer } from './ProductLKSDrawer';
import { ProductClickableItem } from './ProductClickableItem';
import { ContainerTabModel } from './models';

const DEFAULT_PROPS = {
    projects: [],
    tabs: [],
};

const PROJECT_HOME = new Container({ id: 'home', name: 'home' });
const PROJECT_TEST = new Container({ id: 'test', name: 'test' });

const VISIBLE_TAB_1 = new ContainerTabModel({ id: 'tab1', text: 'Tab 1', disabled: false });
const VISIBLE_TAB_2 = new ContainerTabModel({ id: 'tab2', text: 'Tab 2', disabled: false });
const DISABLED_TAB = new ContainerTabModel({ id: 'tab3', text: 'Tab 3', disabled: true });

beforeEach(() => {
    LABKEY.homeContainer = 'home';
    LABKEY.container = {};
});

describe('ProductLKSDrawer', () => {
    function validate(wrapper: ReactWrapper, containerItemCount: number, tabItemCount = 0) {
        expect(wrapper.find('.menu-transition-left')).toHaveLength(1);
        expect(wrapper.find('.container-item')).toHaveLength(containerItemCount);
        expect(wrapper.find('.container-icon')).toHaveLength(containerItemCount);
        expect(wrapper.find('.container-tabs')).toHaveLength(1);
        expect(wrapper.find(ProductClickableItem)).toHaveLength(tabItemCount);
        if (tabItemCount <= 1) {
            expect(wrapper.find('.empty').text()).toContain('No tabs have been added to this folder.');
        }
    }

    test('no items or tabs, admin', () => {
        LABKEY.user = TEST_USER_FOLDER_ADMIN;
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} />);
        validate(wrapper, 0, 0);
        expect(wrapper.find('.how-to')).toHaveLength(1);
        wrapper.unmount();
    });

    test('no items or tabs, non admin', () => {
        LABKEY.user = TEST_USER_EDITOR;
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} />);
        validate(wrapper, 0, 0);
        expect(wrapper.find('.how-to')).toHaveLength(0);
        wrapper.unmount();
    });

    test('no visibleTabs, only 1 not disabled', () => {
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} tabs={[VISIBLE_TAB_1, DISABLED_TAB]} />);
        validate(wrapper, 0, 0);
        wrapper.unmount();
    });

    test('visibleTabs', () => {
        const wrapper = mount(
            <ProductLKSDrawer {...DEFAULT_PROPS} tabs={[VISIBLE_TAB_1, VISIBLE_TAB_2, DISABLED_TAB]} />
        );
        validate(wrapper, 0, 2);
        expect(wrapper.find(ProductClickableItem).at(0).prop('id')).toBe('tab1');
        expect(wrapper.find(ProductClickableItem).at(1).prop('id')).toBe('tab2');
        expect(wrapper.find(ProductClickableItem).at(0).text()).toBe('Tab 1');
        expect(wrapper.find(ProductClickableItem).at(1).text()).toBe('Tab 2');
        wrapper.unmount();
    });

    test('showHome', () => {
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} projects={[PROJECT_HOME, PROJECT_TEST]} />);
        validate(wrapper, 1);
        expect(wrapper.find('.container-item').prop('href')).toBe('/labkey/project/home/begin.view');
        expect(wrapper.find('.container-item').text()).toBe('LabKey Home');
        wrapper.unmount();
    });

    test('in home project', () => {
        LABKEY.project.id = 'home';
        LABKEY.project.name = 'home';
        LABKEY.project.title = 'Home';
        LABKEY.container.id = 'home';
        LABKEY.container.path = '/home';
        LABKEY.container.title = 'Home';
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} projects={[PROJECT_HOME, PROJECT_TEST]} />);
        validate(wrapper, 1);
        expect(wrapper.find('.container-item').prop('href')).toBe('/labkey/project/home/begin.view');
        expect(wrapper.find('.container-item').text()).toBe('LabKey Home');
        wrapper.unmount();
    });

    test('not in home project', () => {
        LABKEY.project.id = 'test';
        LABKEY.project.name = 'test';
        LABKEY.project.title = 'Test project';
        LABKEY.container.id = 'test';
        LABKEY.container.path = '/test';
        LABKEY.container.title = 'Test project';
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} projects={[PROJECT_HOME, PROJECT_TEST]} />);
        validate(wrapper, 2);
        expect(wrapper.find('.container-item').last().prop('href')).toBe('/labkey/project/test/begin.view');
        expect(wrapper.find('.container-item').last().text()).toBe('Test project');
        wrapper.unmount();
    });

    test('in home project subfolder', () => {
        LABKEY.project.id = 'home';
        LABKEY.project.name = 'home';
        LABKEY.project.title = 'Home';
        LABKEY.container.id = 'testSub';
        LABKEY.container.path = '/home/testSub';
        LABKEY.container.title = 'Test subfolder';
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} projects={[PROJECT_HOME, PROJECT_TEST]} />);
        validate(wrapper, 2);
        expect(wrapper.find('.container-item').last().prop('href')).toBe('/labkey/project/home/testSub/begin.view');
        expect(wrapper.find('.container-item').last().text()).toBe('Test subfolder');
        wrapper.unmount();
    });

    test('in other project subfolder', () => {
        LABKEY.project.id = 'test';
        LABKEY.project.name = 'test';
        LABKEY.project.title = 'Test';
        LABKEY.container.id = 'testSub';
        LABKEY.container.path = '/test/testSub';
        LABKEY.container.title = 'Test subfolder';
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} projects={[PROJECT_HOME, PROJECT_TEST]} />);
        validate(wrapper, 3);
        expect(wrapper.find('.container-item').last().prop('href')).toBe('/labkey/project/test/testSub/begin.view');
        expect(wrapper.find('.container-item').last().text()).toBe('Test subfolder');
        wrapper.unmount();
    });

    test('isProjectAvailable', () => {
        expect(isProjectAvailable(undefined)).toBeFalsy();
        expect(isProjectAvailable([])).toBeFalsy();
        expect(isProjectAvailable([PROJECT_HOME, PROJECT_TEST])).toBeFalsy();
        expect(isProjectAvailable([PROJECT_HOME, PROJECT_TEST], 'bogus')).toBeFalsy();
        expect(isProjectAvailable([PROJECT_HOME, PROJECT_TEST], undefined, 'bogus')).toBeFalsy();

        expect(isProjectAvailable([PROJECT_HOME, PROJECT_TEST], 'home')).toBeTruthy();
        expect(isProjectAvailable([PROJECT_HOME, PROJECT_TEST], 'test')).toBeTruthy();
        expect(isProjectAvailable([PROJECT_HOME, PROJECT_TEST], undefined, 'home')).toBeTruthy();
        expect(isProjectAvailable([PROJECT_HOME, PROJECT_TEST], undefined, 'test')).toBeTruthy();
    });

    test('getProjectBeginUrl', () => {
        expect(getProjectBeginUrl(undefined)).toBe('/labkey/project/begin.view');
        expect(getProjectBeginUrl('test')).toBe('/labkey/project/test/begin.view');
    });
});
