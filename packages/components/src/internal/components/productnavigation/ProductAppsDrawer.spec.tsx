import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { BIOLOGICS_PRODUCT_ID, SAMPLE_MANAGER_PRODUCT_ID } from '../../app/constants';

import { DEFAULT_ICON_ALT_URL, DEFAULT_ICON_URL, ProductAppsDrawer } from './ProductAppsDrawer';
import { ProductAppMenuItem } from './ProductAppMenuItem';
import { ProductModel } from './models';
import {
    BIOLOGICS_ALT_PRODUCT_ICON, BIOLOGICS_DISABLED_PRODUCT_ICON,
    BIOLOGICS_PRODUCT_ICON,
    SAMPLE_MANAGER_ALT_PRODUCT_ICON, SAMPLE_MANAGER_DISABLED_PRODUCT_ICON,
    SAMPLE_MANAGER_PRODUCT_ICON
} from './constants';

const DEFAULT_PROPS = {
    products: [],
    productProjectMap: {},
    onClick: jest.fn,
};

const TEST_PRODUCTS = [
    new ProductModel({ productId: SAMPLE_MANAGER_PRODUCT_ID, productName: 'LKSM Name' }),
    new ProductModel({ productId: BIOLOGICS_PRODUCT_ID, productName: 'LKB Name' }),
    new ProductModel({ productId: 'other', productName: 'Other Name' }),
];

describe('ProductAppsDrawer', () => {
    function validate(wrapper: ReactWrapper, count: number) {
        expect(wrapper.find(ProductAppMenuItem)).toHaveLength(count);

        const lksProduct = wrapper.find(ProductAppMenuItem).first();
        expect(lksProduct.prop('iconUrl')).toBe(DEFAULT_ICON_URL);
        expect(lksProduct.prop('iconUrlAlt')).toBe(DEFAULT_ICON_ALT_URL);
        expect(lksProduct.prop('title')).toBe('LabKey Server');
    }

    test('no additional products', () => {
        const wrapper = mount(<ProductAppsDrawer {...DEFAULT_PROPS} />);
        validate(wrapper, 1);
        wrapper.unmount();
    });

    test('project title', () => {
        let wrapper = mount(<ProductAppsDrawer {...DEFAULT_PROPS} />);
        validate(wrapper, 1);
        expect(wrapper.find(ProductAppMenuItem).first().prop('subtitle')).toBe('Root');
        wrapper.unmount();

        LABKEY.project.title = 'Test project title';
        wrapper = mount(<ProductAppsDrawer {...DEFAULT_PROPS} />);
        validate(wrapper, 1);
        expect(wrapper.find(ProductAppMenuItem).first().prop('subtitle')).toBe('Test project title');
        wrapper.unmount();
    });

    test('products', () => {
        const wrapper = mount(<ProductAppsDrawer {...DEFAULT_PROPS} products={TEST_PRODUCTS} />);
        validate(wrapper, 4);
        TEST_PRODUCTS.forEach((product, index) => {
            const item = wrapper.find(ProductAppMenuItem).at(index + 1);
            expect(item.prop('title')).toBe(product.productName);
        });
        wrapper.unmount();
    });

    test('iconUrl and iconUrlAlt, sm disabled', () => {
        LABKEY.moduleContext = {
            samplemanagement: {},
            biologics: {}
        }
        // create them after setting the module context to properly set the disabled flags
        const products = [
            new ProductModel({ productId: SAMPLE_MANAGER_PRODUCT_ID, productName: 'LKSM Name' }),
            new ProductModel({ productId: BIOLOGICS_PRODUCT_ID, productName: 'LKB Name' }),
            new ProductModel({ productId: 'other', productName: 'Other Name' }),
        ]
        const wrapper = mount(<ProductAppsDrawer {...DEFAULT_PROPS} products={products} />);
        validate(wrapper, 4);
        expect(wrapper.find(ProductAppMenuItem).at(1).prop('iconUrl')).toBe(
            '/labkey/sampleManagement/images/' + SAMPLE_MANAGER_DISABLED_PRODUCT_ICON
        );
        expect(wrapper.find(ProductAppMenuItem).at(2).prop('iconUrl')).toBe(
            '/labkey/biologics/images/' + BIOLOGICS_PRODUCT_ICON
        );
        expect(wrapper.find(ProductAppMenuItem).at(3).prop('iconUrl')).toBe(DEFAULT_ICON_URL);
        expect(wrapper.find(ProductAppMenuItem).at(1).prop('iconUrlAlt')).toBe(
            '/labkey/sampleManagement/images/' +  SAMPLE_MANAGER_DISABLED_PRODUCT_ICON
        );
        expect(wrapper.find(ProductAppMenuItem).at(2).prop('iconUrlAlt')).toBe(
            '/labkey/biologics/images/' + BIOLOGICS_ALT_PRODUCT_ICON
        );
        expect(wrapper.find(ProductAppMenuItem).at(3).prop('iconUrlAlt')).toBe(DEFAULT_ICON_URL);

        wrapper.unmount();
    });

    test("iconUrl, only sample manager", () => {
        LABKEY.moduleContext = {
            samplemanagement: {},
        };
        // create them after setting the module context to properly set the disabled flags
        const products = [
            new ProductModel({ productId: SAMPLE_MANAGER_PRODUCT_ID, productName: 'LKSM Name' }),
            new ProductModel({ productId: BIOLOGICS_PRODUCT_ID, productName: 'LKB Name' }),
            new ProductModel({ productId: 'other', productName: 'Other Name' }),
        ]
        const wrapper = mount(<ProductAppsDrawer {...DEFAULT_PROPS} products={products} />);
        validate(wrapper, 4);
        expect(wrapper.find(ProductAppMenuItem).at(1).prop('iconUrl')).toBe(
            '/labkey/sampleManagement/images/' + SAMPLE_MANAGER_PRODUCT_ICON
        );
        expect(wrapper.find(ProductAppMenuItem).at(2).prop('iconUrl')).toBe(
            '/labkey/biologics/images/' + BIOLOGICS_DISABLED_PRODUCT_ICON
        );
        expect(wrapper.find(ProductAppMenuItem).at(3).prop('iconUrl')).toBe(DEFAULT_ICON_URL);
    });

    test("iconUrl, all enabled", () => {
        LABKEY.moduleContext = {
            samplemanagement: {},
            biologics: {
                isBiologicsSampleManagerNavEnabled: true
            }
        };
        // create them after setting the module context to properly set the disabled flags
        const products = [
            new ProductModel({ productId: SAMPLE_MANAGER_PRODUCT_ID, productName: 'LKSM Name' }),
            new ProductModel({ productId: BIOLOGICS_PRODUCT_ID, productName: 'LKB Name' }),
            new ProductModel({ productId: 'other', productName: 'Other Name' }),
        ]
        const wrapper = mount(<ProductAppsDrawer {...DEFAULT_PROPS} products={products} />);
        validate(wrapper, 4);
        expect(wrapper.find(ProductAppMenuItem).at(1).prop('iconUrl')).toBe(
            '/labkey/sampleManagement/images/' + SAMPLE_MANAGER_PRODUCT_ICON
        );
        expect(wrapper.find(ProductAppMenuItem).at(2).prop('iconUrl')).toBe(
            '/labkey/biologics/images/' + BIOLOGICS_PRODUCT_ICON
        );
        expect(wrapper.find(ProductAppMenuItem).at(3).prop('iconUrl')).toBe(DEFAULT_ICON_URL);
    });

});
