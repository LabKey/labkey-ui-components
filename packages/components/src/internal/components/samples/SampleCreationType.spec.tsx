import React from 'react';
import {mount} from "enzyme";
import {CreationType, SampleCreationTypeModal, SampleCreationTypeOption} from "./SampleCreationType";

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

describe("<SampleCreationTypeModal/>", () => {
    test("single parent, no aliquots", () => {
        const wrapper = mount(
            <SampleCreationTypeModal
                show={true}
                allowAliquots={false}
                parentCount={1}
                showIcons={false}
                onCancel={jest.fn()}
                onSubmit={jest.fn()}
            />
        );
        expect(wrapper.find("ModalTitle").text()).toBe("Create Samples from Selected Parent");
        const options = wrapper.find(SampleCreationTypeOption)
        expect(options).toHaveLength(0);
        const labels = wrapper.find(".creation-type-modal-label");
        expect(labels).toHaveLength(2);
        expect(labels.get(0).props.children[0]).toBe(CreationType.Derivatives);
        wrapper.unmount();
    });

    test("single parent, with aliquots", () => {
        const wrapper = mount(
            <SampleCreationTypeModal
                show={true}
                allowAliquots={true}
                parentCount={1}
                showIcons={false}
                onCancel={jest.fn()}
                onSubmit={jest.fn()}
            />
        );
        expect(wrapper.find("ModalTitle").text()).toBe("Create Samples from Selected Parent");
        const options = wrapper.find(SampleCreationTypeOption)
        expect(options).toHaveLength(2);
        expect(options.get(0).props.isSelected).toBe(true);
        expect(options.get(0).props.option.type).toBe(CreationType.Derivatives);
        expect(options.get(1).props.option.type).toBe(CreationType.Aliquots);
        const labels = wrapper.find(".creation-type-modal-label");
        expect(labels).toHaveLength(2);
        expect(labels.get(0).props.children[0]).toBe(CreationType.Derivatives);
        wrapper.unmount();
    });

    test("multiple parents, with aliquots", () => {
        const wrapper = mount(
            <SampleCreationTypeModal
                show={true}
                allowAliquots={true}
                parentCount={4}
                showIcons={false}
                onCancel={jest.fn()}
                onSubmit={jest.fn()}
            />
        );
        expect(wrapper.find("ModalTitle").text()).toBe("Create Samples from Selected Parents");
        const options = wrapper.find(SampleCreationTypeOption)
        expect(options).toHaveLength(3);
        expect(options.get(0).props.isSelected).toBe(true);
        expect(options.get(0).props.option.type).toBe(CreationType.Derivatives);
        expect(options.get(1).props.option.type).toBe(CreationType.PooledSamples);
        expect(options.get(2).props.option.type).toBe(CreationType.Aliquots);
        wrapper.unmount();
    });

    test("aliquots selected", () => {
        const wrapper = mount(
            <SampleCreationTypeModal
                show={true}
                allowAliquots={true}
                parentCount={4}
                showIcons={false}
                onCancel={jest.fn()}
                onSubmit={jest.fn()}
            />
        );
        const options = wrapper.find(SampleCreationTypeOption)
        expect(options).toHaveLength(3);
        wrapper.setState({
            creationType: CreationType.Aliquots
        });
        const labels = wrapper.find(".creation-type-modal-label");
        expect(labels).toHaveLength(2);
        expect(labels.get(0).props.children[0]).toBe(CreationType.Aliquots);
        wrapper.unmount();
    });

    test("pooling selected", () => {
        const wrapper = mount(
            <SampleCreationTypeModal
                show={true}
                allowAliquots={true}
                parentCount={4}
                showIcons={false}
                onCancel={jest.fn()}
                onSubmit={jest.fn()}
            />
        );
        const options = wrapper.find(SampleCreationTypeOption)
        expect(options).toHaveLength(3);
        wrapper.setState({
            creationType: CreationType.PooledSamples
        });
        const labels = wrapper.find(".creation-type-modal-label");
        expect(labels).toHaveLength(0);
        wrapper.unmount();
    });
})
