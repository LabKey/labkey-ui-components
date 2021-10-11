import React from 'react';
import { DisableableMenuItem } from './DisableableMenuItem';
import { mount, ReactWrapper } from 'enzyme';
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap';

describe("DisableableMenuItem", () => {

    function validate(wrapper: ReactWrapper, disabled: boolean, menuContent: string, menuProps: any=undefined) {
        const menuItem = wrapper.find(MenuItem);
        expect(menuItem.exists()).toBeTruthy();
        if (disabled) {
            expect(wrapper.find(OverlayTrigger).exists()).toBeTruthy();
            expect(menuItem.prop('disabled')).toBeTruthy();
            if (menuProps) {
                Object.keys(menuProps).forEach(prop => {
                    expect(menuItem.prop(prop)).toBeFalsy();
                })
            }
        }
        else {
            expect(wrapper.find(OverlayTrigger).exists()).toBeFalsy();
            expect(menuItem.prop('disabled')).toBeFalsy();
            if (menuProps) {
                Object.keys(menuProps).forEach(prop => {
                    expect(menuItem.prop(prop)).toBe(menuProps[prop]);
                })
            }
        }

        expect(menuItem.text()).toBe(menuContent);

    }

    test("operation permitted", () => {
        const content = "Test Operation";
        const wrapper = mount(<DisableableMenuItem operationPermitted={true} menuItemContent={content}/>);
        validate(wrapper, false, content);
    });

    test("operation permitted, menu props", () => {
        const props = {onClick: jest.fn()};

        const content = <span>Test Operation</span>;
        const wrapper = mount(
            <DisableableMenuItem
                operationPermitted={true}
                menuItemContent={content}
                menuItemProps={props}
            />
        );
        validate(wrapper, false, "Test Operation", props);
    });

    test("disabled", () => {
        const content = <div>Other test</div>
        const props = {onClick: jest.fn()};
        const wrapper = mount(
            <DisableableMenuItem
                operationPermitted={false}
                menuItemContent={content}
                menuItemProps={props}
            />
        );
        validate(wrapper, true, "Other test");
    });


    test("disabled, alternate overlay placement", () => {
        const content = "Other test";
        const props = {onClick: jest.fn()};
        const wrapper = mount(
            <DisableableMenuItem
                operationPermitted={false}
                menuItemContent={content}
                menuItemProps={props}
                placement={"right"}
            />
        );
        validate(wrapper, true, content, props);
        expect(wrapper.find(OverlayTrigger).prop('placement')).toBe("right");
    });
});
