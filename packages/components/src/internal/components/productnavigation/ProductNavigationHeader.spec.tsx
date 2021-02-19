import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { LKS_PRODUCT_ID } from '../../app/constants';

import { ProductNavigationHeader } from './ProductNavigationHeader';

const DEFAULT_PROPS = {
    productId: undefined,
    title: undefined,
    onClick: jest.fn,
};

describe('ProductNavigationHeader', () => {
    function validate(wrapper: ReactWrapper, hasBack = false) {
        expect(wrapper.find('.back-icon')).toHaveLength(hasBack ? 1 : 0);
        expect(wrapper.find('.header-padding')).toHaveLength(hasBack ? 1 : 0);
        if (hasBack) {
            expect(wrapper.find('.fa-chevron-left')).toHaveLength(1);
        }
        expect(wrapper.find('.header-title')).toHaveLength(1);
    }

    test('no productId or title', () => {
        const wrapper = mount(<ProductNavigationHeader {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find('.header-title').text()).toBe('Applications');
        wrapper.unmount();
    });

    test('title', () => {
        const wrapper = mount(<ProductNavigationHeader {...DEFAULT_PROPS} title="Test title" />);
        validate(wrapper);
        expect(wrapper.find('.header-title').text()).toBe('Test title');
        wrapper.unmount();
    });

    test('productId LKS_PRODUCT_ID', () => {
        const wrapper = mount(<ProductNavigationHeader {...DEFAULT_PROPS} productId={LKS_PRODUCT_ID} />);
        validate(wrapper, true);
        expect(wrapper.find('.header-title').text()).toBe('LabKey Server');
        wrapper.unmount();
    });

    test('productId other', () => {
        const wrapper = mount(<ProductNavigationHeader {...DEFAULT_PROPS} productId="other" />);
        validate(wrapper, true);
        expect(wrapper.find('.header-title').text()).toBe('Applications');
        wrapper.unmount();
    });
});
