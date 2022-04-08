import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { FiltersButton } from './FiltersButton';

describe('FiltersButton', () => {
    const ON_FILTER = jest.fn();
    const DEFAULT_PROPS = {
        onFilter: ON_FILTER,
    };

    function validate(wrapper: ReactWrapper): void {
        expect(wrapper.find('.grid-panel__button').hostNodes()).toHaveLength(2);
        expect(wrapper.find('.fa-filter')).toHaveLength(2);
    }

    test('default props', () => {
        const wrapper = mount(<FiltersButton {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(ON_FILTER).toHaveBeenCalledTimes(0);
        wrapper.find('.grid-panel__button').hostNodes().first().simulate('click');
        wrapper.find('.grid-panel__button').hostNodes().last().simulate('click');
        expect(ON_FILTER).toHaveBeenCalledTimes(2);
        wrapper.unmount();
    });
});
