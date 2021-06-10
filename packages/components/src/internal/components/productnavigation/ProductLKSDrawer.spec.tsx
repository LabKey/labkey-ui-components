import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { TEST_USER_EDITOR, TEST_USER_FOLDER_ADMIN } from '../../../test/data/users';

import { getProjectBeginUrl, ProductLKSDrawer } from './ProductLKSDrawer';
import { ProductClickableItem } from './ProductClickableItem';
import { ContainerTabModel } from './models';

const DEFAULT_PROPS = {
    showHome: true,
    tabs: [],
};

const VISIBLE_TAB_1 = new ContainerTabModel({ id: 'tab1', text: 'Tab 1', disabled: false });
const VISIBLE_TAB_2 = new ContainerTabModel({ id: 'tab2', text: 'Tab 2', disabled: false });
const DISABLED_TAB = new ContainerTabModel({ id: 'tab3', text: 'Tab 3', disabled: true });

beforeEach(() => {
    LABKEY.homeContainer = 'home';
    LABKEY.project.id = 'test';
    LABKEY.project.name = 'test';
    LABKEY.project.title = 'Test project';
    LABKEY.container.id = 'test';
    LABKEY.container.path = '/test';
    LABKEY.container.title = 'Test project';
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

    test('home not available, no tabs, admin', () => {
        LABKEY.user = TEST_USER_FOLDER_ADMIN;
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} showHome={false} />);
        validate(wrapper, 1, 0);
        expect(wrapper.find('.how-to')).toHaveLength(1);
        wrapper.unmount();
    });

    test('home not available, no tabs, non admin', () => {
        LABKEY.user = TEST_USER_EDITOR;
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} showHome={false} />);
        validate(wrapper, 1, 0);
        expect(wrapper.find('.how-to')).toHaveLength(0);
        wrapper.unmount();
    });

    test('no visibleTabs, only 1 not disabled', () => {
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} tabs={[VISIBLE_TAB_1, DISABLED_TAB]} />);
        validate(wrapper, 2, 0);
        wrapper.unmount();
    });

    test('visibleTabs', () => {
        const wrapper = mount(
            <ProductLKSDrawer {...DEFAULT_PROPS} tabs={[VISIBLE_TAB_1, VISIBLE_TAB_2, DISABLED_TAB]} />
        );
        validate(wrapper, 2, 2);
        expect(wrapper.find(ProductClickableItem).at(0).prop('id')).toBe('tab1');
        expect(wrapper.find(ProductClickableItem).at(1).prop('id')).toBe('tab2');
        expect(wrapper.find(ProductClickableItem).at(0).text()).toBe('Tab 1');
        expect(wrapper.find(ProductClickableItem).at(1).text()).toBe('Tab 2');
        wrapper.unmount();
    });

    test('showHome', () => {
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} showHome={true} />);
        validate(wrapper, 2);
        expect(wrapper.find('.container-item').first().text()).toBe('LabKey Home');
        expect(wrapper.find('.container-item').last().text()).toBe(LABKEY.container.title);
        wrapper.unmount();
    });

    test('disableContainer link', () => {
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} disableLKSContainerLink={true} showHome={true} />);
        validate(wrapper, 2);
        expect(wrapper.find('.container-item').first().text()).toBe('LabKey Home');
        expect(wrapper.find('.container-item').last().text()).toBe(LABKEY.container.title);
        expect(wrapper.find('.container-item').last().prop('onClick')).toBeFalsy();
        wrapper.unmount();
    });

    test('in home project', () => {
        LABKEY.project.id = 'home';
        LABKEY.project.name = 'home';
        LABKEY.project.title = 'Home';
        LABKEY.container.id = 'home';
        LABKEY.container.path = '/home';
        LABKEY.container.title = 'Home';
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} disableLKSContainerLink={true} showHome={true} />);
        validate(wrapper, 1);
        expect(wrapper.find('.container-item').first().text()).toBe('LabKey Home');
        expect(wrapper.find('.container-item').first().prop('onClick')).toBeFalsy();

        wrapper.unmount();
    });

    test('in home project subfolder link enabled', () => {
        LABKEY.project.id = 'home';
        LABKEY.project.name = 'home';
        LABKEY.project.title = 'Home';
        LABKEY.container.id = 'testSub';
        LABKEY.container.path = '/home/testSub';
        LABKEY.container.title = 'Test subfolder';
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} showHome={true} />);
        validate(wrapper, 2);
        expect(wrapper.find('.container-item').first().text()).toBe('LabKey Home');
        expect(wrapper.find('.container-item').first().prop('onClick')).toBeTruthy();
        expect(wrapper.find('.container-item').last().text()).toBe('Test subfolder');
        expect(wrapper.find('.container-item').last().prop('onClick')).toBeTruthy();
        wrapper.unmount();
    });

    test('in other project subfolder', () => {
        LABKEY.project.id = 'test';
        LABKEY.project.name = 'test';
        LABKEY.project.title = 'Test';
        LABKEY.container.id = 'testSub';
        LABKEY.container.path = '/test/testSub';
        LABKEY.container.title = 'Test subfolder';
        const wrapper = mount(<ProductLKSDrawer {...DEFAULT_PROPS} showHome={true} />);
        validate(wrapper, 2);
        expect(wrapper.find('.container-item').last().text()).toBe('Test subfolder');
        expect(wrapper.find('.container-item').last().prop('onClick')).toBeTruthy();
        wrapper.unmount();
    });

    test('getProjectBeginUrl', () => {
        LABKEY.container = {};
        expect(getProjectBeginUrl(undefined)).toBe('/labkey/project/begin.view');
        expect(getProjectBeginUrl('test')).toBe('/labkey/project/test/begin.view');
    });
});
