import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Alert, Container, LoadingSpinner } from '../../..';
import { LKS_PRODUCT_ID } from '../../app/constants';

import {
    getSelectedProject,
    getSelectedProduct,
    getProductProjectsMap,
    ProductNavigationMenuImpl,
} from './ProductNavigationMenu';
import { ProductNavigationHeader } from './ProductNavigationHeader';
import { ProductAppsDrawer } from './ProductAppsDrawer';
import { ProductSectionsDrawer } from './ProductSectionsDrawer';
import { ProductProjectsDrawer } from './ProductProjectsDrawer';
import { ProductLKSDrawer } from './ProductLKSDrawer';
import { ProductModel } from './models';

const TEST_PRODUCTS = [
    new ProductModel({ productId: 'a', productName: 'A', moduleName: 'modA' }),
    new ProductModel({ productId: 'b', productName: 'B', moduleName: 'modB' }),
    new ProductModel({ productId: 'c', productName: 'C', moduleName: 'modC' }),
];

const TEST_PRODUCT_PROJECT_MAP = {
    a: [],
    b: [new Container({ title: 'P1' })],
    c: [new Container({ title: 'P2' }), new Container({ title: 'P3' })],
};

const DEFAULT_PROPS = {
    error: undefined,
    products: TEST_PRODUCTS,
    projects: [],
    productProjectMap: TEST_PRODUCT_PROJECT_MAP,
    tabs: [],
    selectedProductId: undefined,
    selectedProject: undefined,
    onSelection: jest.fn,
};

describe('ProductNavigationMenu', () => {
    function validate(wrapper: ReactWrapper, rendered = true, wide = false, componentCounts?: Record<string, number>) {
        const count = rendered ? 1 : 0;
        expect(wrapper.find('.product-navigation-container')).toHaveLength(count);
        expect(wrapper.find('.navbar-icon-connector')).toHaveLength(count);
        expect(wrapper.find(ProductNavigationHeader)).toHaveLength(count);
        expect(wrapper.find('.product-navigation-listing')).toHaveLength(count);
        expect(wrapper.find('.wider')).toHaveLength(wide ? 1 : 0);

        expect(wrapper.find(ProductAppsDrawer)).toHaveLength(componentCounts?.ProductAppsDrawer ?? 0);
        expect(wrapper.find(ProductLKSDrawer)).toHaveLength(componentCounts?.ProductLKSDrawer ?? 0);
        expect(wrapper.find(ProductProjectsDrawer)).toHaveLength(componentCounts?.ProductProjectsDrawer ?? 0);
        expect(wrapper.find(ProductSectionsDrawer)).toHaveLength(componentCounts?.ProductSectionsDrawer ?? 0);
    }

    test('error', () => {
        const wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} error="Test error" />);
        validate(wrapper, false);
        expect(wrapper.find(Alert).text()).toBe('Test error');
        wrapper.unmount();
    });

    test('loading', () => {
        let wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} products={undefined} />);
        validate(wrapper, false);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        wrapper.unmount();

        wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} projects={undefined} />);
        validate(wrapper, false);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        wrapper.unmount();

        wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} tabs={undefined} />);
        validate(wrapper, false);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        wrapper.unmount();
    });

    test('ProductNavigationHeader props', () => {
        const wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId="a" />);
        validate(wrapper, true, true, { ProductProjectsDrawer: 1 });
        expect(wrapper.find(ProductNavigationHeader).prop('title')).toBe('A');
        expect(wrapper.find(ProductNavigationHeader).prop('productId')).toBe('a');
        wrapper.unmount();
    });

    test('showProductDrawer', () => {
        const wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={undefined} />);
        validate(wrapper, true, true, { ProductAppsDrawer: 1 });
        wrapper.unmount();
    });

    test('showLKSDrawer', () => {
        const wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={LKS_PRODUCT_ID} />);
        validate(wrapper, true, false, { ProductLKSDrawer: 1 });
        wrapper.unmount();
    });

    test('product with single project', () => {
        const wrapper = mount(
            <ProductNavigationMenuImpl
                {...DEFAULT_PROPS}
                selectedProductId="b"
                selectedProject={TEST_PRODUCT_PROJECT_MAP['b'][0]}
            />
        );
        validate(wrapper, true, false, { ProductSectionsDrawer: 1 });
        expect(wrapper.find(ProductNavigationHeader).prop('title')).toBe('P1');
        wrapper.unmount();
    });

    test('product with multiple projects, none selected', () => {
        const wrapper = mount(
            <ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId="c" selectedProject={undefined} />
        );
        validate(wrapper, true, false, { ProductProjectsDrawer: 1 });
        expect(wrapper.find(ProductNavigationHeader).prop('title')).toBe('C');
        wrapper.unmount();
    });

    test('product with multiple projects, with one selected', () => {
        const wrapper = mount(
            <ProductNavigationMenuImpl
                {...DEFAULT_PROPS}
                selectedProductId="c"
                selectedProject={TEST_PRODUCT_PROJECT_MAP['c'][1]}
            />
        );
        validate(wrapper, true, false, { ProductSectionsDrawer: 1 });
        expect(wrapper.find(ProductNavigationHeader).prop('title')).toBe('P3');
        wrapper.unmount();
    });

    test('footer', () => {
        let wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={undefined} />);
        expect(wrapper.find('.product-navigation-footer')).toHaveLength(1);
        expect(wrapper.find('.product-navigation-footer').text()).toBe('More LabKey Solutions');
        wrapper.unmount();

        wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId="a" />);
        expect(wrapper.find('.product-navigation-footer')).toHaveLength(0);
        wrapper.unmount();
    });

    test('getSelectedProject', () => {
        const project = TEST_PRODUCT_PROJECT_MAP['b'][0];
        expect(getSelectedProject(undefined, TEST_PRODUCT_PROJECT_MAP, project)).toBe(project);
        expect(getSelectedProject('b', TEST_PRODUCT_PROJECT_MAP, undefined)).toBe(project);
        expect(getSelectedProject('a', TEST_PRODUCT_PROJECT_MAP, undefined)).toBe(undefined);
        expect(getSelectedProject('c', TEST_PRODUCT_PROJECT_MAP, undefined)).toBe(undefined);
        expect(getSelectedProject(undefined, TEST_PRODUCT_PROJECT_MAP, undefined)).toBe(undefined);
    });

    test('getSelectedProduct', () => {
        expect(getSelectedProduct(TEST_PRODUCTS, 'a')).toBe(TEST_PRODUCTS[0]);
        expect(getSelectedProduct(TEST_PRODUCTS, 'b')).toBe(TEST_PRODUCTS[1]);
        expect(getSelectedProduct(TEST_PRODUCTS, 'c')).toBe(TEST_PRODUCTS[2]);
        expect(getSelectedProduct(TEST_PRODUCTS, 'd')).toBe(undefined);
        expect(getSelectedProduct(TEST_PRODUCTS, undefined)).toBe(undefined);
        expect(getSelectedProduct(undefined, 'a')).toBe(undefined);
        expect(getSelectedProduct([], 'a')).toBe(undefined);
    });

    test('getProductProjectsMap', () => {
        const TEST_PROJECTS = [
            new Container({ id: 1, activeModules: [] }),
            new Container({ id: 2, activeModules: ['modA'] }),
            new Container({ id: 3, activeModules: ['modA', 'modB'] }),
            new Container({ id: 4, activeModules: ['modB'] }),
            new Container({ id: 5, activeModules: ['modD'] }),
        ];

        expect(getProductProjectsMap(undefined, undefined)).toStrictEqual({});
        expect(getProductProjectsMap(TEST_PRODUCTS, undefined)).toStrictEqual({});
        expect(getProductProjectsMap(undefined, TEST_PROJECTS)).toStrictEqual({});

        const mapping = getProductProjectsMap(TEST_PRODUCTS, TEST_PROJECTS);
        expect(mapping['a']).toStrictEqual([TEST_PROJECTS[1], TEST_PROJECTS[2]]);
        expect(mapping['b']).toStrictEqual([TEST_PROJECTS[3]]);
        expect(mapping['c']).toStrictEqual([]);
        expect(mapping['d']).toBe(undefined);
    });
});
