import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { List } from 'immutable';

import { Alert, Container, MenuSectionModel } from "../../..";
import { FREEZERS_KEY, WORKFLOW_KEY } from "../../app/constants";

import { getProductSectionUrl, parseProductMenuSectionResponse, ProductSectionsDrawerImpl } from './ProductSectionsDrawer';
import { ProductClickableItem } from "./ProductClickableItem";
import { ProductModel, ProductSectionModel } from "./models";

const DEFAULT_PROPS = {
    error: undefined,
    sections: [],
};

const TEST_SECTIONS = [
    new ProductSectionModel({ key: 'a', label: 'A' }),
    new ProductSectionModel({ key: 'b', label: 'B' }),
    new ProductSectionModel({ key: 'c', label: 'C' }),
];

const TEST_PRODUCT = new ProductModel({ productId: 'a', productName: 'A' });
const TEST_PROJECT = new Container({ id: '1', path: '/test' });

describe('ProductSectionsDrawer', () => {
    function validate(wrapper: ReactWrapper, count: number, hasError = false) {
        expect(wrapper.find('.menu-transition-left')).toHaveLength(!hasError ? 1 : 0);
        expect(wrapper.find(ProductClickableItem)).toHaveLength(count);
        expect(wrapper.find(Alert)).toHaveLength(hasError ? 1 : 0);
    }

    test('error', () => {
        const wrapper = mount(<ProductSectionsDrawerImpl {...DEFAULT_PROPS} error={'Test error'} />);
        validate(wrapper, 0, true);
        expect(wrapper.find(Alert).text()).toBe('Test error');
        wrapper.unmount();
    });

    test('with sections', () => {
        const wrapper = mount(<ProductSectionsDrawerImpl {...DEFAULT_PROPS} sections={TEST_SECTIONS} />);
        validate(wrapper, TEST_SECTIONS.length, false);
        TEST_SECTIONS.forEach((section, index) => {
            const item = wrapper.find(ProductClickableItem).at(index);
            expect(item.prop('id')).toBe(section.key);
            expect(item.text()).toBe(section.label);
        });
        wrapper.unmount();
    });

    test('getProductSectionUrl', () => {
        expect(getProductSectionUrl('id', 'key', '/test', false))
            .toBe('/labkey/id/test/app.view#/key');
        expect(getProductSectionUrl('id', 'key', '/test', true))
            .toBe('/labkey/id/test/app.view#/key');

        // note ActionURL.getController() is '' for this jest test
        expect(getProductSectionUrl('', 'key', '/test', true))
            .toBe('#/key');
    });

    test('parseProductMenuSectionResponse, no modelSections', () => {
        const sections = parseProductMenuSectionResponse(List<MenuSectionModel>(), TEST_PRODUCT, TEST_PROJECT, false);
        expect(sections).toHaveLength(1);
        expect(sections[0].key).toBe('home');
        expect(sections[0].label).toBe('Dashboard');
        expect(sections[0].url).toBe('/labkey/a/test/app.view#/home');
    });

    test('parseProductMenuSectionResponse, with modelSections to skip', () => {
        const modelSections = List<MenuSectionModel>([
            new MenuSectionModel({ key: 's1', productId: 'a', label: 'S1' }),
            new MenuSectionModel({ key: 's2', productId: 'a', label: 'S2' }),
            new MenuSectionModel({ key: 'user', productId: 'a', label: 'User' }),
            new MenuSectionModel({ key: 'biologicsWorkflow', productId: 'a', label: 'Workflow' }),
            new MenuSectionModel({ key: 's3', productId: 'a', label: 'S3' }),
        ]);

        const sections = parseProductMenuSectionResponse(modelSections, TEST_PRODUCT, TEST_PROJECT, false);
        expect(sections).toHaveLength(4);
        expect(sections[0].key).toBe('home');
        expect(sections[1].key).toBe('s1');
        expect(sections[1].label).toBe('S1');
        expect(sections[1].url).toBe('/labkey/a/test/app.view#/s1');
        expect(sections[2].key).toBe('s2');
        expect(sections[2].label).toBe('S2');
        expect(sections[2].url).toBe('/labkey/a/test/app.view#/s2');
        expect(sections[3].key).toBe('s3');
        expect(sections[3].label).toBe('S3');
        expect(sections[3].url).toBe('/labkey/a/test/app.view#/s3');
    });

    test('parseProductMenuSectionResponse, LKSM sorting', () => {
        const modelSections = List<MenuSectionModel>([
            new MenuSectionModel({ key: 's1', productId: 'a', label: 'S1' }),
            new MenuSectionModel({ key: WORKFLOW_KEY, productId: 'a', label: 'Workflow' }),
            new MenuSectionModel({ key: FREEZERS_KEY, productId: 'a', label: 'Storage' }),
        ]);

        const sections = parseProductMenuSectionResponse(modelSections, TEST_PRODUCT, TEST_PROJECT, false);
        expect(sections).toHaveLength(4);
        expect(sections[0].key).toBe('home');
        expect(sections[1].key).toBe('s1');
        expect(sections[2].key).toBe(FREEZERS_KEY);
        expect(sections[3].key).toBe(WORKFLOW_KEY);
    });
});
