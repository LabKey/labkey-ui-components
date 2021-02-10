import React from "react";
import { Input } from 'formsy-react-components';
import { QueryInfoQuantity } from "./QueryInfoQuantity";
import { mount, ReactWrapper } from "enzyme";
import { RadioGroupInput } from "./input/RadioGroupInput";
import { DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION } from "../../../index";
import Formsy from 'formsy-react';

describe("<QueryInfoQuantity>", () => {
    function validate(wrapper: ReactWrapper, optionCount: number, includeCount: boolean ) {
        expect(wrapper.find(RadioGroupInput)).toHaveLength(optionCount === 0 ? 0 : 1);
        expect(wrapper.find(Input)).toHaveLength((includeCount || optionCount > 0) ? 1 : 0);
    }

    test("no content", () => {
        const wrapper = mount(
            <QueryInfoQuantity
                creationTypeOptions={undefined}
                includeCountField={false}
                maxCount={5}
                countText={"Quantity"}
            />
        );
        validate(wrapper, 0, false);
        wrapper.unmount();
    });

    test("no options, show quantity", () => {
        const wrapper = mount(
            <Formsy>
                <QueryInfoQuantity
                    creationTypeOptions={[]}
                    includeCountField={true}
                    maxCount={5}
                    countText={"Quantity"}
                />
            </Formsy>
        );
        validate(wrapper, 0, true);
        const input = wrapper.find(Input);
        expect(input.prop('max')).toBe(5);
        expect(input.prop('value')).toBe("1");
        wrapper.unmount();
    });

    test("multiple options, no default selection", () => {
        const wrapper = mount(
            <Formsy>
                <QueryInfoQuantity
                    creationTypeOptions={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION]}
                    includeCountField={false}
                    maxCount={5}
                    countText={"Quantity"}
                />
            </Formsy>
        );
        validate(wrapper, 2, false)
        const inputs = wrapper.find({type: "radio"});
        expect(inputs).toHaveLength(2);
        expect(wrapper.find(".control-label")).toHaveLength(1);
        expect(wrapper.find(".control-label").text()).toBe("Quantity *");
    });

    test("multiple options, default selection", () => {
        const wrapper = mount(
            <Formsy>
                <QueryInfoQuantity
                    creationTypeOptions={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION]}
                    includeCountField={true}
                    maxCount={5}
                    countText={"Quantity"}
                    defaultCreationType={DERIVATIVE_CREATION.type}
                />
            </Formsy>
        );
        validate(wrapper, 2, false)
        const inputs = wrapper.find({type: "radio"});
        expect(inputs).toHaveLength(2);
        expect(wrapper.find(".control-label")).toHaveLength(1);
        expect(wrapper.find(".control-label").text()).toBe("Derivatives per parent *");
    });
});
