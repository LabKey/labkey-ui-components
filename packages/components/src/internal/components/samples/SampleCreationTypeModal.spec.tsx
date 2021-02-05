import React from 'react';
import { mount } from "enzyme";
import { SampleCreationTypeModal } from "./SampleCreationTypeModal";
import { ALIQUOT_CREATION, DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION } from "../../../index";
import {CreationType, SampleCreationTypeOption} from "./SampleCreationTypeOption";


describe("<SampleCreationTypeModal/>", () => {
    test("single parent, no aliquots", () => {
        const wrapper = mount(
            <SampleCreationTypeModal
                show={true}
                options={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION]}
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
                options={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION, ALIQUOT_CREATION]}
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
                options={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION, ALIQUOT_CREATION]}
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
                options={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION, ALIQUOT_CREATION]}
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
                options={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION, ALIQUOT_CREATION]}
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
