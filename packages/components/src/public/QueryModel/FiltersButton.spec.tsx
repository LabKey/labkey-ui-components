import React from 'react';
import { mount } from 'enzyme';

import { FiltersButton } from './FiltersButton';

describe('FiltersButton', () => {
    test('default props', () => {
        const ON_FILTER = jest.fn();
        const wrapper = mount(<FiltersButton onFilter={ON_FILTER} />);
        const button = wrapper.find('.grid-panel__button').hostNodes();
        expect(button).toHaveLength(1);
        expect(button.text()).toBe(' Filters');
        expect(wrapper.find('.fa-filter')).toHaveLength(1);
        expect(ON_FILTER).toHaveBeenCalledTimes(0);
        button.simulate('click');
        expect(ON_FILTER).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('iconOnly', () => {
        const ON_FILTER = jest.fn();
        const wrapper = mount(<FiltersButton onFilter={ON_FILTER} iconOnly />);
        const button = wrapper.find('.grid-panel__button').hostNodes();
        expect(button).toHaveLength(1);
        expect(button.text()).toBe('');
        expect(wrapper.find('.fa-filter')).toHaveLength(1);
        expect(ON_FILTER).toHaveBeenCalledTimes(0);
        button.simulate('click');
        expect(ON_FILTER).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });
});
