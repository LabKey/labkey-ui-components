import React from 'react';
import { Map } from 'immutable';
import renderer from 'react-test-renderer';

import { mount } from 'enzyme';

import { AncestorRenderer } from './AncestorRenderer';

describe('AncestorRenderer', () => {
    test('No data', () => {
        const component = <AncestorRenderer data={undefined} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toBeNull();
    });

    test('empty data', () => {
        const component = <AncestorRenderer data={Map({})} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toBeNull();
    });

    test('positive value', () => {
        const data = {
            value: 123,
            displayValue: 'Sample-123',
            url: 'http://samples.org/Sample-123',
        };
        const wrapper = mount(<AncestorRenderer data={Map(data)} />);
        expect(wrapper.find('span.text-muted').exists()).toBe(false);
        const link = wrapper.find('a');
        expect(link.exists()).toBe(true);
        expect(link.prop('href')).toBe(data.url);
        expect(link.text()).toBe(data.displayValue);
    });

    test('negative value', () => {
        const data = {
            value: -123,
            displayValue: '123 values',
            url: undefined,
        };
        const wrapper = mount(<AncestorRenderer data={Map(data)} />);
        const span = wrapper.find('span.text-muted');
        expect(span.exists()).toBe(true);
        expect(span.prop('title')).toBe('There are 123 ancestors of this type.');
        expect(span.text()).toBe('123 values');
        expect(wrapper.find('.ws-pre-wrap').exists()).toBe(false);
    });
});
