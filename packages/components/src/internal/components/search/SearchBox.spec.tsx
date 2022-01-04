import React from 'react';
import { mount } from 'enzyme';

import { SearchBox } from './SearchBox';

describe('SearchBox', () => {
    test('with Find', () => {
        const wrapper = mount(<SearchBox onSearch={jest.fn} onFindByIds={jest.fn} findNounPlural="Items" />);
        expect(wrapper.find('DropdownButton')).toHaveLength(1);
        const menuItem = wrapper.find('MenuItem');
        expect(menuItem).toHaveLength(2);
        expect(menuItem.at(0).text().trim()).toBe('Find Items by Barcode');
        expect(menuItem.at(1).text().trim()).toBe('Find Items by ID');
    });

    test('without Find', () => {
        const wrapper = mount(<SearchBox onSearch={jest.fn} placeholder="Seek wisdom" />);
        expect(wrapper.find('DropdownButton')).toHaveLength(0);
        const input = wrapper.find('input');
        expect(input).toHaveLength(1);
        expect(input.prop('placeholder')).toBe('Seek wisdom');
    });
});
