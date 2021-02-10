import React from 'react';
import { mount, ReactWrapper } from "enzyme";
import { RadioGroupInput, RadioGroupOption } from "./RadioGroupInput";

describe("<RadioGroupInput>", () => {

    test("no options", () => {
        const wrapper = mount((
            <RadioGroupInput formsy={false} options={undefined} name={"testRadio"}/>
        ));
        expect(wrapper.find("input")).toHaveLength(0);
    });

    function validateOptionDisplay(wrapper: ReactWrapper, option: RadioGroupOption) {
        expect(wrapper.text()).toContain(option.label)
        expect(wrapper.find("input").prop("value")).toBe(option.value);
        expect(wrapper.find({id: "tooltip"})).toHaveLength(option.description ? 1 : 0);
    }

    test("with options", () => {
        const options = [
            {
                value: "one",
                label: "one label",
                description: "describe one"
            },
            {
                value: "two",
                label: "two label",
                description: <span className="two-description">Two description</span>
            },
            {
                value: "three",
                label: "three label",
            }
        ];

        const wrapper = mount((
            <RadioGroupInput
                formsy={false}
                options={options}
                name={"testRadio"}/>
        ));
        expect(wrapper.find("input")).toHaveLength(3);
        let divs = wrapper.find("div");
        validateOptionDisplay(divs.at(0), options[0]);
        validateOptionDisplay(divs.at(1), options[1]);
        validateOptionDisplay(divs.at(2), options[2]);
        wrapper.unmount();
    });
});
