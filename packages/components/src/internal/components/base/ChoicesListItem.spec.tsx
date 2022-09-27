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

    function validate(wrapper: ReactWrapper, active = false, hasComponentRight = false, itemType = 'Available', disabled?: boolean): void {
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.find('.active')).toHaveLength(active ? 1 : 0);
        expect(wrapper.find('.choices-list__sub-label')).toHaveLength(itemType !== 'Available' ? 1 : 0);
        expect(wrapper.find('.component-right')).toHaveLength(hasComponentRight ? 1 : 0);
        expect(wrapper.find('button').text()).toBe(itemType);
        if (disabled)
            expect(wrapper.find('button').props()['disabled']).toBeTruthy();
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

    test('subLabel', () => {
        const wrapper = mount(<ChoicesListItem {...DEFAULT_PROPS} subLabel="Received" />);
        validate(wrapper, false, false, 'AvailableReceived');
        wrapper.unmount();
    });

    test('component right', () => {
        const wrapper = mount(
            <ChoicesListItem
                {...DEFAULT_PROPS}
                subLabel="Type"
                componentRight={<div className="component-right">TEST</div>}
            />
        );
        validate(wrapper, false, true, 'AvailableTypeTEST');
        wrapper.unmount();
    });

    test('disabled', () => {
        const wrapper = mount(<ChoicesListItem {...DEFAULT_PROPS} disabled={true} />);
        validate(wrapper, false, false, undefined, true);
        wrapper.unmount();
    });
});
