import React from 'react';
import { mount, ReactWrapper } from "enzyme";
import { SampleCreationTypeModal } from "./SampleCreationTypeModal";
import { ALIQUOT_CREATION, DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION } from "../../../index";
import {SampleCreationTypeOption} from "./SampleCreationTypeOption";
import { SampleCreationType } from "./models";


describe("<SampleCreationTypeModal/>", () => {

    function validateOption(wrapper: ReactWrapper, selected: boolean, type: SampleCreationType) {
        expect(wrapper.prop("isSelected")).toBe(selected);
        expect((wrapper.prop('option') as any).type).toBe(type);
    }

    function validateLabel(wrapper, label: string) {
        const labels = wrapper.find(".creation-type-modal-label");
        expect(labels).toHaveLength(2);
        expect(labels.at(0).text()).toBe(label);
    }

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
        const options = wrapper.find(SampleCreationTypeOption);
        expect(options).toHaveLength(0);
        validateLabel(wrapper, DERIVATIVE_CREATION.quantityLabel);
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
        validateOption(options.at(0), true, SampleCreationType.Derivatives);
        validateOption(options.at(1), false, SampleCreationType.Aliquots);
        validateLabel(wrapper, DERIVATIVE_CREATION.quantityLabel);
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
        validateOption(options.at(0), true, SampleCreationType.Derivatives);
        validateOption(options.at(1), false, SampleCreationType.PooledSamples);
        validateOption(options.at(2), false, SampleCreationType.Aliquots);
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
            creationType: SampleCreationType.Aliquots
        });
        validateLabel(wrapper, ALIQUOT_CREATION.quantityLabel);
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
            creationType: SampleCreationType.PooledSamples
        });
        validateLabel(wrapper, POOLED_SAMPLE_CREATION.quantityLabel);
        wrapper.unmount();
    });
})
