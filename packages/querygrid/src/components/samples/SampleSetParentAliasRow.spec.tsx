import * as React from 'react'
import renderer from 'react-test-renderer'
import { mount } from 'enzyme'

import {SampleSetParentAliasRow} from "./SampleSetParentAliasRow";
import {IParentOption, ParentAlias} from "./models";

describe("<SampleSetParentAliasRow/>", () => {

    test("No values", () => {

        const parentAlias:ParentAlias = {alias: "", id: "", parentValue: ""};

        const component = (
            <SampleSetParentAliasRow  id={parentAlias.id}  onAliasChange={jest.fn()} onRemove={jest.fn()} parentAlias={parentAlias} parentOptions={[]}/>
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("With values", () => {

        const parentAlias:ParentAlias = {alias: "testAlias", id: "testId", parentValue: "materialInputs/test"};
        const option:IParentOption = {label: "test", query: "sampleset", schema: "exp", value: "materialInputs/test"};

        const component = (
            <SampleSetParentAliasRow  id={parentAlias.id}  onAliasChange={jest.fn()} onRemove={jest.fn()} parentAlias={parentAlias} parentOptions={[option]} />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();

        const wrapper = mount(component);

        expect(wrapper.find('input[name="alias"]').props().value).toBe(parentAlias.alias);
        expect(wrapper.find('input[name="parentValue"]').props().value).toBe(parentAlias.parentValue);
    });

    test("With select value not found", () => {

        const parentAlias:ParentAlias = {alias: "testAlias", id: "testId", parentValue: "materialInputs/test"};
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

        const parentAlias:ParentAlias = {alias: "testAlias", id: "testId", parentValue: "materialInputs/option2"};
        const option1:IParentOption = {label: "option1", query: "sampleset", schema: "exp", value: "materialInputs/option1"};
        const option2:IParentOption = {label: "option2", query: "sampleset", schema: "exp", value: "materialInputs/option2"};

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

});