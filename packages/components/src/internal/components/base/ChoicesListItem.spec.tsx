import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { ChoicesListItem } from './ChoicesListItem';

describe('ChoicesListItem', () => {
    const DEFAULT_PROPS = {
        index: 0,
        label: 'Available',
        active: false,
        onSelect: jest.fn,
    };

    function validate(wrapper: ReactWrapper, active = false, hasComponentRight = false, itemType = 'Available'): void {
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('.active')).toHaveLength(active ? 1 : 0);
        expect(wrapper.find('.choices-list__item-type')).toHaveLength(itemType !== 'Available' ? 1 : 0);
        expect(wrapper.find('.component-right')).toHaveLength(hasComponentRight ? 1 : 0);
        expect(wrapper.find('button').text()).toBe(itemType);
    }

    test('default props', () => {
        const wrapper = mount(<ChoicesListItem {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('active', () => {
        const wrapper = mount(<ChoicesListItem {...DEFAULT_PROPS} active />);
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('itemType', () => {
        const wrapper = mount(<ChoicesListItem {...DEFAULT_PROPS} itemType="Received" />);
        validate(wrapper, false, false, 'AvailableReceived');
        wrapper.unmount();
    });

    test('component right', () => {
        const wrapper = mount(
            <ChoicesListItem {...DEFAULT_PROPS} itemType="Type" componentRight={<div className="component-right">TEST</div>} />
        );
        validate(wrapper, false, true, 'AvailableTypeTEST');
        wrapper.unmount();
    });
});
