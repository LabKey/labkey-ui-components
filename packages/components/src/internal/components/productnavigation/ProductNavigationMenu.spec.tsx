import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { LKS_PRODUCT_ID } from '../../app/constants';

import { Alert } from '../base/Alert';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { getSelectedProduct, ProductNavigationMenuImpl } from './ProductNavigationMenu';
import { ProductNavigationHeader } from './ProductNavigationHeader';
import { ProductAppsDrawer } from './ProductAppsDrawer';
import { ProductSectionsDrawer } from './ProductSectionsDrawer';
import { ProductLKSDrawer } from './ProductLKSDrawer';
import { ProductModel } from './models';

const TEST_PRODUCTS = [
    new ProductModel({ productId: 'a', productName: 'A', moduleName: 'modA' }),
    new ProductModel({ productId: 'b', productName: 'B', moduleName: 'modB' }),
    new ProductModel({ productId: 'c', productName: 'C', moduleName: 'modC' }),
];

const DEFAULT_PROPS = {
    error: undefined,
    products: TEST_PRODUCTS,
    disableLKSContainerLink: false,
    homeVisible: true,
    menuRef: undefined,
    onSelection: jest.fn,
    selectedProductId: undefined,
    selectedProject: undefined,
    tabs: [],
};

describe('ProductNavigationMenu', () => {
    function validate(wrapper: ReactWrapper, rendered = true, wide = false, componentCounts?: Record<string, number>) {
        const count = rendered ? 1 : 0;
        expect(wrapper.find('.product-navigation-listing')).toHaveLength(count);
        expect(wrapper.find('.wider')).toHaveLength(wide ? 1 : 0);

        expect(wrapper.find(ProductAppsDrawer)).toHaveLength(componentCounts?.ProductAppsDrawer ?? 0);
        expect(wrapper.find(ProductLKSDrawer)).toHaveLength(componentCounts?.ProductLKSDrawer ?? 0);
        expect(wrapper.find(ProductSectionsDrawer)).toHaveLength(componentCounts?.ProductSectionsDrawer ?? 0);
    }

    test('error', () => {
        const wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} error="Test error" />);
        validate(wrapper, false, true);
        expect(wrapper.find(Alert).text()).toBe('Test error');
        wrapper.unmount();
    });

    test('loading', () => {
        let wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} products={undefined} />);
        validate(wrapper, false, true);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        wrapper.unmount();

        wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} tabs={undefined} />);
        validate(wrapper, false, true);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        wrapper.unmount();
    });

    test('ProductNavigationHeader props', () => {
        const wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId="a" />);
        validate(wrapper, true, false, { ProductSectionsDrawer: 1 });
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

    test('non-premium footer', () => {
        let wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={undefined} />);
        expect(wrapper.find('.product-navigation-footer')).toHaveLength(1);
        expect(wrapper.find('.product-navigation-footer').text()).toBe('More LabKey Solutions');
        wrapper.unmount();

        wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId="a" />);
        expect(wrapper.find('.product-navigation-footer')).toHaveLength(0);
        wrapper.unmount();

        LABKEY.user = {
            isRootAdmin: true,
        };
        wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={undefined} />);
        expect(wrapper.find('.product-navigation-footer')).toHaveLength(1);
        expect(wrapper.find('.product-navigation-footer').text()).toBe('More LabKey Solutions');
        wrapper.unmount();
    });

    test('premium footer', () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['samplemanagement', 'study', 'premium'],
            },
        };
        LABKEY.user = {
            isRootAdmin: true,
        };
        let wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={undefined} />);
        let footer = wrapper.find('.product-navigation-footer');
        expect(footer).toHaveLength(1);
        let links = footer.find('a');
        expect(links).toHaveLength(2);
        expect(links.at(0).text()).toBe('Menu Settings');
        expect(links.at(1).text()).toBe('More LabKey Solutions');
        wrapper.unmount();

        LABKEY.user = {
            isRootAdmin: false,
        };
        wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={undefined} />);
        footer = wrapper.find('.product-navigation-footer');
        expect(footer).toHaveLength(1);
        links = footer.find('a');
        expect(footer.find('a')).toHaveLength(1);
        expect(links.at(0).text()).toBe('More LabKey Solutions');
        wrapper.unmount();

        LABKEY.user = {
            isAdmin: false,
        };
        wrapper = mount(<ProductNavigationMenuImpl {...DEFAULT_PROPS} selectedProductId={undefined} />);
        footer = wrapper.find('.product-navigation-footer');
        expect(footer).toHaveLength(1);
        links = footer.find('a');
        expect(footer.find('a')).toHaveLength(1);
        expect(links.at(0).text()).toBe('More LabKey Solutions');
        wrapper.unmount();
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
});
