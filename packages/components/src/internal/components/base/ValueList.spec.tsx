import React from 'react';
import { mount } from 'enzyme';

import { ValueList } from './ValueList';

describe('<ValueList />', () => {
    test('values.length = 2, maxCount = 3', () => {
        const wrapper = mount(<ValueList values={['a', 'b']} maxCount={3} />);
        expect(wrapper.text()).toBe('a, b');
        wrapper.unmount();
    });

    test('values.length = 2, maxCount = 3, vertical', () => {
        const wrapper = mount(<ValueList values={['a', 'b']} maxCount={3} vertical={true}/>);
        expect(wrapper.find('li')).toHaveLength(2);
        expect(wrapper.find('li').at(0).text()).toBe('a');
        expect(wrapper.find('li').at(1).text()).toBe('b');
        wrapper.unmount();
    });

    test('values.length > 3, maxCount = 3', () => {
        const wrapper = mount(<ValueList values={['a', 'b', 'c', 'd', 'e']} maxCount={3} />);
        expect(wrapper.text()).toBe('a, b, c and 2 more');
        wrapper.unmount();
    });

    test('values.length > 3, maxCount = 3, vertical', () => {
        const wrapper = mount(<ValueList values={['a', 'b', 'c', 'd', 'e']} maxCount={3} vertical={true}/>);
        expect(wrapper.find('li')).toHaveLength(3);
        expect(wrapper.find('li').at(2).text()).toBe('c');
        expect(wrapper.text()).toBe('abc...');
        wrapper.unmount();
    });
});
