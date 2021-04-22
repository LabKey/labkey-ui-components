import {SampleCreationTypeOption} from "./SampleCreationTypeOption";
import {mount} from "enzyme";
import React from "react";
import {DERIVATIVE_CREATION, SampleCreationType, SampleCreationTypeGroup} from "./models";

describe("<SampleCreationTypeOption/>", () => {

    test("Show icon with iconUrl", () => {
        const option = {
            type: SampleCreationType.Derivatives,
            typeGroup: SampleCreationTypeGroup.samples,
            description: "Describe derivatives",
            minParentsPerSample: 1,
            requiresMultipleParents: false,
            iconUrl: "http://icons.are.us"
        }
        const wrapper = mount(
            <SampleCreationTypeOption
                option={option}
                isSelected={false}
                onChoose={jest.fn()}
                showIcon={true}
            />
        );
        const img = wrapper.find("img");
        expect(img).toHaveLength(1);
        expect(img.prop("src")).toBe(option.iconUrl);
        expect(wrapper.find("SVGIcon")).toHaveLength(0);
        wrapper.unmount();
    });

    test("Show icon with iconSrc", () => {

        const wrapper = mount(
            <SampleCreationTypeOption
                option={DERIVATIVE_CREATION}
                isSelected={false}
                onChoose={jest.fn()}
                showIcon={true}
            />
        );
        const img = wrapper.find("img");
        expect(img).toHaveLength(1);
        expect(img.prop("src")).toBe("/labkey/_images/derivatives_gray.svg");
        const icon = wrapper.find("SVGIcon");
        expect(icon).toHaveLength(1);
        expect(icon.prop("iconSrc")).toBe(DERIVATIVE_CREATION.iconSrc);
        wrapper.unmount();
    });

    test("no icon", () => {
        const wrapper = mount(
            <SampleCreationTypeOption
                option={DERIVATIVE_CREATION}
                isSelected={false}
                onChoose={jest.fn()}
                showIcon={false}
            />
        );
        expect(wrapper.find("img")).toHaveLength(0);
        expect(wrapper.find("SVGIcon")).toHaveLength(0);
        wrapper.unmount();
    });

    test("isSelected", () => {
        const wrapper = mount(
            <SampleCreationTypeOption
                option={DERIVATIVE_CREATION}
                isSelected={true}
                onChoose={jest.fn()}
                showIcon={true}
            />
        );
        const img = wrapper.find("img");
        expect(img).toHaveLength(1);
        expect(img.prop("src")).toBe("/labkey/_images/derivatives.svg");
        const input = wrapper.find("input");
        expect(input).toHaveLength(1);
        expect(input.prop("checked")).toBe(true);
        expect(input.prop("value")).toBe(DERIVATIVE_CREATION.type)
        expect(wrapper.find(".creation-type-choice-description").text()).toBe(DERIVATIVE_CREATION.description);
        expect(wrapper.find(".creation-type-choice").text().indexOf(DERIVATIVE_CREATION.type)).toBe(1);
        wrapper.unmount();
    });

    test("isNotSelected", () => {
        const wrapper = mount(
            <SampleCreationTypeOption
                option={DERIVATIVE_CREATION}
                isSelected={false}
                onChoose={jest.fn()}
                showIcon={true}
            />
        );
        const input = wrapper.find("input");
        expect(input).toHaveLength(1);
        expect(input.prop("checked")).toBe(false);
        wrapper.unmount();
    });
});
