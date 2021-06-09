import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { ProductAppMenuItem } from './ProductAppMenuItem';

const DEFAULT_PROPS = {
    iconUrl: 'icon-url-test',
    title: 'Test title',
    subtitle: 'Test subtitle',
    onClick: jest.fn,
};

describe('ProductAppMenuItem', () => {
    function validate(wrapper: ReactWrapper) {
        expect(wrapper.find('.product-icon')).toHaveLength(1);
        expect(wrapper.find('img')).toHaveLength(2);
        expect(wrapper.find('.nav-icon')).toHaveLength(1);
        expect(wrapper.find('.fa-chevron-right')).toHaveLength(1);
    }

    test('default props', () => {
        const wrapper = mount(<ProductAppMenuItem {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find('li').prop('className')).toBe('');
        expect(wrapper.find('img').first().prop('src')).toBe('icon-url-test');
        expect(wrapper.find('img').last().prop('src')).toBe('icon-url-test');
        wrapper.unmount();
    });

    test('no subtitle', () => {
        const wrapper = mount(<ProductAppMenuItem {...DEFAULT_PROPS} subtitle={undefined}/>);
        validate(wrapper);
        expect(wrapper.find(".product-title").text()).toBe(DEFAULT_PROPS.title);
        expect(wrapper.find(".no-subtitle")).toHaveLength(1);
    })

    test('iconUrlAlt', () => {
        const wrapper = mount(<ProductAppMenuItem {...DEFAULT_PROPS} iconUrlAlt="icon-url-alt-test" />);
        validate(wrapper);
        expect(wrapper.find('img').first().prop('src')).toBe('icon-url-test');
        expect(wrapper.find('img').last().prop('src')).toBe('icon-url-alt-test');
        wrapper.unmount();
    });

    test('hovered', () => {
        const wrapper = mount(<ProductAppMenuItem {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find('li').prop('className')).toBe('');

        wrapper.find('li').simulate('mouseenter');
        expect(wrapper.find('li').prop('className')).toBe('labkey-page-nav');

        wrapper.find('li').simulate('mouseleave');
        expect(wrapper.find('li').prop('className')).toBe('');

        wrapper.unmount();
    });
});
