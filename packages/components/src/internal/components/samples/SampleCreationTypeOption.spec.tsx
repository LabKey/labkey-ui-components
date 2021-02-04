import {CreationType, SampleCreationTypeOption} from "./SampleCreationTypeOption";
import {mount} from "enzyme";
import React from "react";

describe("<SampleCreationTypeOption/>", () => {
    const derivativeOption = {
        type: CreationType.Derivatives,
        description: "Describe derivatives",
        requiresMultipleParents: false,
        iconSrc: "derivatives"
    }

    test("Show icon with iconUrl", () => {
        const option = {
            type: CreationType.Derivatives,
            description: "Describe derivatives",
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
                option={derivativeOption}
                isSelected={false}
                onChoose={jest.fn()}
                showIcon={true}
            />
        );
        const img = wrapper.find("img");
        expect(img).toHaveLength(1);
        expect(img.prop("src")).toBe("/labkey/_images/derivatives.svg");
        const icon = wrapper.find("SVGIcon");
        expect(icon).toHaveLength(1);
        expect(icon.prop("iconSrc")).toBe(derivativeOption.iconSrc);
        wrapper.unmount();
    });

    test("no icon", () => {
        const wrapper = mount(
            <SampleCreationTypeOption
                option={derivativeOption}
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
                option={derivativeOption}
                isSelected={true}
                onChoose={jest.fn()}
                showIcon={true}
            />
        );
        const input = wrapper.find("input");
        expect(input).toHaveLength(1);
        expect(input.prop("checked")).toBe(true);
        expect(input.prop("value")).toBe(derivativeOption.type)
        expect(wrapper.find(".creation-type-choice-description").text()).toBe(derivativeOption.description);
        expect(wrapper.find("label").text().indexOf(derivativeOption.type)).toBe(1);
        wrapper.unmount();
    });

    test("isNotSelected", () => {
        const wrapper = mount(
            <SampleCreationTypeOption
                option={derivativeOption}
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
