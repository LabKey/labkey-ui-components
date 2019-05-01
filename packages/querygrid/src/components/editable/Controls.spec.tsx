import * as React from 'react';
import { AddRowsControl } from "./Controls";
import { shallow } from "enzyme";

describe("Controls", () => {
   test("default properties", () => {
       const addFn = jest.fn();
       const wrapper = shallow(<AddRowsControl onAdd={addFn}/>);
       wrapper.find('Button').simulate('click');
       expect(addFn).toHaveBeenCalledTimes(1);
   });

    test("non-default properties", () => {
        const addFn = jest.fn();
        const wrapper = shallow(<AddRowsControl
            initialCount={6}
            maxCount={25}
            minCount={5}
            onAdd={addFn}/>);
        const inputWrapper = wrapper.find("input");
        expect(inputWrapper.prop('value')).toBe("6");
        expect(inputWrapper.prop("min")).toBe(5);
        expect(inputWrapper.prop("max")).toBe(25);
        inputWrapper.simulate('focus');
        inputWrapper.simulate('change', { target: {value: 1}});
        wrapper.update();
        expect(wrapper.find(".text-danger")).toHaveLength(1);
    })
});