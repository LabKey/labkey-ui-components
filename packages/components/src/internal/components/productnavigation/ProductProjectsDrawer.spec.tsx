import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Alert, Container } from "../../..";

import { ProductModel } from "./models";
import { ProductProjectsDrawer } from './ProductProjectsDrawer';
import { ProductClickableItem } from "./ProductClickableItem";

const DEFAULT_PROPS = {
    product: new ProductModel({ productId: 'a', productName: 'A' }),
    projects: [],
    onClick: jest.fn,
};

const TEST_PROJECTS = [
    new Container({ id: '1', title: 'P1' }),
    new Container({ id: '2', title: 'P2' }),
    new Container({ id: '3', title: 'P3' }),
];

beforeEach(() => {
    LABKEY.user.isRootAdmin = false;
});

describe('ProductProjectsDrawer', () => {
    function validate(wrapper: ReactWrapper, projectCount: number, isEmpty = false) {
        expect(wrapper.find('.menu-transition-left')).toHaveLength(1);
        expect(wrapper.find(ProductClickableItem)).toHaveLength(projectCount);
        expect(wrapper.find('.nav-icon')).toHaveLength(projectCount);
        expect(wrapper.find('.fa-chevron-right')).toHaveLength(projectCount);
        expect(wrapper.find('.product-empty')).toHaveLength(isEmpty ? 1 : 0);
    }

    test('no project, non root admin', () => {
        const wrapper = mount(<ProductProjectsDrawer {...DEFAULT_PROPS} />);
        validate(wrapper, 0, true);
        expect(wrapper.find(Alert).text()).toBe('No available A projects on this server.');
        expect(wrapper.find('.start-project')).toHaveLength(0);
        expect(wrapper.find('.learn-more').text()).toBe('Learn more about A');
        wrapper.unmount();
    });

    test('no project, root admin', () => {
        LABKEY.user.isRootAdmin = true;
        const wrapper = mount(<ProductProjectsDrawer {...DEFAULT_PROPS} />);
        validate(wrapper, 0, true);
        expect(wrapper.find(Alert).text()).toBe('No available A projects on this server.');
        expect(wrapper.find('.start-project')).toHaveLength(1);
        expect(wrapper.find('.start-project').prop('href')).toBe('/labkey/admin/createFolder.view?folderType=A&returnUrl=%2F');
        expect(wrapper.find('.start-project').text()).toBe('Start a A project');
        expect(wrapper.find('.learn-more').text()).toBe('Learn more about A');
        wrapper.unmount();
    });

    test('with projects', () => {
        const wrapper = mount(<ProductProjectsDrawer {...DEFAULT_PROPS} projects={TEST_PROJECTS} />);
        validate(wrapper, TEST_PROJECTS.length, false);
        TEST_PROJECTS.forEach((project, index) => {
            const item = wrapper.find(ProductClickableItem).at(index);
            expect(item.prop('id')).toBe(project.id);
            expect(item.find('div').last().text()).toBe(project.title);
        });
        wrapper.unmount();
    });
});
