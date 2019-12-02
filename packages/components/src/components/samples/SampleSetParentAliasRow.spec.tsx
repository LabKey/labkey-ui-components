import React from 'react'
import renderer from 'react-test-renderer'
import { mount } from 'enzyme'

import { SampleSetParentAliasRow } from './SampleSetParentAliasRow';
import { IParentAlias, IParentOption } from './models';

describe("<SampleSetParentAliasRow/>", () => {

    test("No values", () => {

        const parentAlias: IParentAlias = {alias: "", id: "", parentValue: undefined};

        const component = (
            <SampleSetParentAliasRow  id={parentAlias.id}  onAliasChange={jest.fn()} onRemove={jest.fn()} parentAlias={parentAlias} parentOptions={[]}/>
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("With values", () => {

        const parentAlias: IParentAlias = {alias: "testAlias", id: "testId", parentValue: {value: "materialInputs/test", label:"Test Label"}};
        const option: IParentOption = {label: "test", query: "sampleset", schema: "exp", value: "materialInputs/test"};

        const component = (
            <SampleSetParentAliasRow  id={parentAlias.id}  onAliasChange={jest.fn()} onRemove={jest.fn()} parentAlias={parentAlias} parentOptions={[option]} />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();

        const wrapper = mount(component);

        expect(wrapper.find('input[name="alias"]').props().value).toBe(parentAlias.alias);
        expect(wrapper.find('input[name="parentValue"]').props().value).toBe(parentAlias.parentValue.value);
    });

    test("With parent value not an option in select", () => {

        const parentAlias: IParentAlias = {alias: "testAlias", id: "testId", parentValue: {value: "materialInputs/test", label:"Test Label"}};
        const option:IParentOption = {label: "test", query: "sampleset", schema: "exp", value: "materialInputs/notFound"};

        const component = (
            <SampleSetParentAliasRow  id={parentAlias.id}  onAliasChange={jest.fn()} onRemove={jest.fn()} parentAlias={parentAlias} parentOptions={[option]} />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();

        const wrapper = mount(component);
        expect(wrapper.find('input[name="alias"]').props().value).toBe(parentAlias.alias);
        expect(wrapper.find('input[role="combobox"]').props().value).toBe("");

    });

    test("Simulate delete behavior", () => {

        const parentAlias: IParentAlias = {alias: "testAlias", id: "testId", parentValue: {value: "materialInputs/option2", label:"Test Label"}};
        const option1: IParentOption = {label: "option1", query: "sampleset", schema: "exp", value: "materialInputs/option1"};
        const option2: IParentOption = {label: "option2", query: "sampleset", schema: "exp", value: "materialInputs/option2"};

        const mockRemove = jest.fn();

        const component = (
            <SampleSetParentAliasRow  id={parentAlias.id}  onAliasChange={jest.fn()} onRemove={mockRemove} parentAlias={parentAlias} parentOptions={[option1, option2]} />
        );

        const wrapper = mount(component);
        const removeBtn = wrapper.find('i.container--removal-icon');
        expect(mockRemove).toHaveBeenCalledTimes(0);
        removeBtn.simulate('click');
        expect(mockRemove).toHaveBeenCalledTimes(1);

        //Remove should be called with the ID to be removed
        expect(mockRemove).toHaveBeenCalledWith(parentAlias.id);
    });

    test("Simulate changed alias", () => {

        const parentAlias: IParentAlias = {
            alias: "testAlias",
            id: "testId",
            parentValue: {value: "materialInputs/option2", label: "Test Label"}
        };
        const option1: IParentOption = {
            label: "option1",
            query: "sampleset",
            schema: "exp",
            value: "materialInputs/option1"
        };
        const option2: IParentOption = {
            label: "option2",
            query: "sampleset",
            schema: "exp",
            value: "materialInputs/option2"
        };

        const mockChange = jest.fn();

        const component = (
            <SampleSetParentAliasRow id={parentAlias.id} onAliasChange={mockChange} onRemove={jest.fn()}
                                     parentAlias={parentAlias} parentOptions={[option1, option2]}/>
        );

        const wrapper = mount(component);
        expect(wrapper.find('input[name="alias"]').props().value).toBe(parentAlias.alias);
        const aliasInput = wrapper.find('input[name="alias"]');
        expect(mockChange).toHaveBeenCalledTimes(0);

        aliasInput.simulate('change', {target:{name:'alias', value: 'change'}});
        expect(mockChange).toHaveBeenCalledTimes(1);
        expect(mockChange).toBeCalledWith('testId', 'alias', 'change');
        mockChange.mockClear();

        //*Verify Select changes*//
        //// TODO: Can't find the correct element within the ReactSelect to trigger change event
        ////    https://stackoverflow.com/questions/41991077/testing-react-select-component
        // const selectInput = wrapper.find('.sampleset-insert--parent-select');
        // const selectInput = wrapper.find('input[role="combobox"]');
        // const selectInput = wrapper.find(SelectInput);
        // const selectInput = wrapper.find('.Select-control');
        // expect(mockChange).toHaveBeenCalledTimes(0);
        // selectInput.simulate('change', {name:'parentValue', option1}).simulate('blur');
        // expect(mockChange).toHaveBeenCalledTimes(1);
        // expect(mockChange).toBeCalledWith('testId', 'parentValue', option1);
    });
});
