import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { BIOLOGICS_APP_PROPERTIES, LIMS_APP_PROPERTIES, SAMPLE_MANAGER_APP_PROPERTIES, } from '../../app/constants';

import { DEFAULT_ICON_ALT_URL, DEFAULT_ICON_URL, ProductAppsDrawer } from './ProductAppsDrawer';
import { ProductAppMenuItem } from './ProductAppMenuItem';
import { ProductModel } from './models';
import { BIOLOGICS_ALT_PRODUCT_ICON, BIOLOGICS_PRODUCT_ICON, SAMPLE_MANAGER_PRODUCT_ICON, } from './constants';

const DEFAULT_PROPS = {
    products: [],
    onClick: jest.fn,
};

describe('ProductAppsDrawer', () => {
    function validate(wrapper: ReactWrapper, count: number): void {
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

    test('iconUrl and iconUrlAlt, lkb', () => {
        LABKEY.moduleContext = {
            samplemanagement: {},
            biologics: {},
        };
        // create them after setting the module context to properly set the disabled flags
        const products = [
            new ProductModel({ productId: SAMPLE_MANAGER_APP_PROPERTIES.productId, productName: 'LKSM Name' }),
            new ProductModel({ productId: BIOLOGICS_APP_PROPERTIES.productId, productName: 'LKB Name' }),
            new ProductModel({ productId: LIMS_APP_PROPERTIES.productId, productName: 'LIMS Name' }),
            new ProductModel({ productId: 'other', productName: 'Other Name' }),
        ];
        const wrapper = mount(<ProductAppsDrawer {...DEFAULT_PROPS} products={products} />);
        validate(wrapper, 2);
        expect(wrapper.find(ProductAppMenuItem).at(1).prop('iconUrl')).toBe(
            '/labkey/biologics/images/' + BIOLOGICS_PRODUCT_ICON
        );
        expect(wrapper.find(ProductAppMenuItem).at(1).prop('iconUrlAlt')).toBe(
            '/labkey/biologics/images/' + BIOLOGICS_ALT_PRODUCT_ICON
        );
        expect(wrapper.find(ProductAppMenuItem).at(1).prop('title')).toBe(products[1].productName);

        wrapper.unmount();
    });

    test('iconUrl, only sample manager', () => {
        LABKEY.moduleContext = {
            samplemanagement: {},
        };
        // create them after setting the module context to properly set the disabled flags
        const products = [
            new ProductModel({ productId: SAMPLE_MANAGER_APP_PROPERTIES.productId, productName: 'LKSM Name' }),
            new ProductModel({ productId: BIOLOGICS_APP_PROPERTIES.productId, productName: 'LKB Name' }),
            new ProductModel({ productId: 'other', productName: 'Other Name' }),
        ];
        const wrapper = mount(<ProductAppsDrawer {...DEFAULT_PROPS} products={products} />);
        validate(wrapper, 2);
        expect(wrapper.find(ProductAppMenuItem).at(1).prop('iconUrl')).toBe(
            '/labkey/sampleManagement/images/' + SAMPLE_MANAGER_PRODUCT_ICON
        );
    });
});
