import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Container } from "../../..";
import { BIOLOGICS_PRODUCT_ID, SAMPLE_MANAGER_PRODUCT_ID } from "../../app/constants";

import { DEFAULT_ICON_ALT_URL, DEFAULT_ICON_URL, getProductSubtitle, ProductAppsDrawer } from './ProductAppsDrawer';
import { ProductAppMenuItem } from "./ProductAppMenuItem";
import { ProductModel } from "./models";

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

    test('productProjectMap', () => {
        const productProjectMap = {
            [SAMPLE_MANAGER_PRODUCT_ID]: [],
            [BIOLOGICS_PRODUCT_ID]: [new Container({title: 'P1'})],
            other: [new Container({title: 'P2'}), new Container({title: 'P3'})],
        };

        const wrapper = mount(
            <ProductAppsDrawer
                {...DEFAULT_PROPS}
                products={TEST_PRODUCTS}
                productProjectMap={productProjectMap}
            />
        );
        validate(wrapper, 4);
        expect(wrapper.find(ProductAppMenuItem).at(1).prop('subtitle')).toBe('No Projects');
        expect(wrapper.find(ProductAppMenuItem).at(2).prop('subtitle')).toBe('P1');
        expect(wrapper.find(ProductAppMenuItem).at(3).prop('subtitle')).toBe('2 Projects');
        wrapper.unmount();
    });

    test('iconUrl and iconUrlAlt', () => {
        const wrapper = mount(<ProductAppsDrawer {...DEFAULT_PROPS} products={TEST_PRODUCTS} />);
        validate(wrapper, 4);
        expect(wrapper.find(ProductAppMenuItem).at(1).prop('iconUrl')).toBe('/labkey/sampleManagement/images/LK-SampleManager-Badge-COLOR.svg');
        expect(wrapper.find(ProductAppMenuItem).at(2).prop('iconUrl')).toBe('/labkey/biologics/images/lk-bio-logo-badge-color.svg');
        expect(wrapper.find(ProductAppMenuItem).at(3).prop('iconUrl')).toBe(DEFAULT_ICON_URL);
        expect(wrapper.find(ProductAppMenuItem).at(1).prop('iconUrlAlt')).toBe('/labkey/sampleManagement/images/LK-SampleManager-Badge-WHITE.svg');
        expect(wrapper.find(ProductAppMenuItem).at(2).prop('iconUrlAlt')).toBe('/labkey/biologics/images/lk-bio-logo-badge.svg');
        expect(wrapper.find(ProductAppMenuItem).at(3).prop('iconUrlAlt')).toBe(DEFAULT_ICON_ALT_URL);
        wrapper.unmount();
    });

    test('getProductSubtitle', () => {
        expect(getProductSubtitle(undefined)).toBe('No Projects');
        expect(getProductSubtitle([])).toBe('No Projects');
        expect(getProductSubtitle([
            new Container({title: 'P1'})
        ])).toBe('P1');
        expect(getProductSubtitle([
            new Container({title: 'P1'}),
            new Container({title: 'P2'})
        ])).toBe('2 Projects');
    });
});
