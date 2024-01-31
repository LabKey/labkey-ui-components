import React from 'react';

import { mount, ReactWrapper } from 'enzyme';

import { DisableableMenuItem } from './DisableableMenuItem';

describe('DisableableMenuItem', () => {
    function validate(wrapper: ReactWrapper, disabled: boolean, menuContent: string, menuProps: any = undefined) {
        const menuItem = wrapper.find('MenuItem');
        expect(menuItem.exists()).toBeTruthy();
        if (disabled) {
            expect(menuItem.prop('disabled')).toBeTruthy();
        } else {
            expect(menuItem.prop('disabled')).toBeFalsy();
            if (menuProps) {
                Object.keys(menuProps).forEach(prop => {
                    expect(menuItem.prop(prop)).toBe(menuProps[prop]);
                });
            }
        }

        expect(menuItem.text()).toBe(menuContent);
    }

    test('operation permitted', () => {
        const content = 'Test Operation';
        const wrapper = mount(<DisableableMenuItem disabled={false}>{content}</DisableableMenuItem>);
        validate(wrapper, false, content);
    });

    test('operation permitted, menu props', () => {
        const onClick = jest.fn();
        const wrapper = mount(
            <DisableableMenuItem disabled={false} onClick={onClick}>
                <span>Test Operation</span>
            </DisableableMenuItem>
        );
        validate(wrapper, false, 'Test Operation', { onClick });
    });

    test('disabled', () => {
        const wrapper = mount(
            <DisableableMenuItem disabled={false} onClick={jest.fn()}>
                <div>Other test</div>
            </DisableableMenuItem>
        );
        validate(wrapper, true, 'Other test');
    });

    test('disabled, alternate overlay placement', () => {
        const content = 'Other test';
        const onClick = jest.fn();
        const wrapper = mount(
            <DisableableMenuItem onClick={onClick} disabled={false} placement="right">
                {content}
            </DisableableMenuItem>
        );
        validate(wrapper, true, content);
    });
});
