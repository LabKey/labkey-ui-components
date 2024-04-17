import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { SELECT_INPUT_CONTROL_SELECTOR } from '../forms/input/SelectInputTestUtils';

import { IParentAlias, IParentOption } from '../entities/models';

import { ParentAliasRow } from './ParentAliasRow';

describe('<ParentAliasRow/>', () => {
    test('Ignore empty values', () => {
        const parentAlias: IParentAlias = {
            alias: '',
            id: '',
            parentValue: undefined,
            ignoreAliasError: true,
            ignoreSelectError: true,
        };

        const component = (
            <ParentAliasRow
                id={parentAlias.id}
                onAliasChange={jest.fn()}
                onRemove={jest.fn()}
                parentAlias={parentAlias}
                parentOptions={[]}
            />
        );

        const wrapper = mount(component);

        expect(wrapper.find('input[name="alias"]').props().defaultValue).toBe(parentAlias.alias);
        expect(wrapper.find('.has-error')).toHaveLength(0);
    });

    test('Blank values, Error CSS applied', () => {
        const parentAlias: IParentAlias = {
            alias: '',
            id: 'testId',
            parentValue: undefined,
            ignoreAliasError: false,
            ignoreSelectError: false,
        };

        const component = (
            <ParentAliasRow
                id={parentAlias.id}
                onAliasChange={jest.fn()}
                onRemove={jest.fn()}
                parentAlias={parentAlias}
                parentOptions={[]}
            />
        );

        const wrapper = mount(component);
        const aliasInput = wrapper.find('input[name="alias"]');

        expect(wrapper.find('.has-error input[name="alias"]')).toHaveLength(1);
        expect(aliasInput.props().defaultValue).toBe(parentAlias.alias);
        expect(wrapper.find(`.has-error ${SELECT_INPUT_CONTROL_SELECTOR}`)).toHaveLength(1);
    });

    test('With values', () => {
        const parentAlias: IParentAlias = {
            alias: 'testAlias',
            id: 'testId',
            ignoreAliasError: false,
            ignoreSelectError: false,
            parentValue: { value: 'materialInputs/test', label: 'Test Label' },
        };
        const option: IParentOption = {
            label: 'test',
            query: 'sampleset',
            schema: 'exp',
            value: 'materialInputs/test',
        };

        const component = (
            <ParentAliasRow
                id={parentAlias.id}
                onAliasChange={jest.fn()}
                onRemove={jest.fn()}
                parentAlias={parentAlias}
                parentOptions={[option]}
            />
        );

        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();

        const wrapper = mount(component);

        expect(wrapper.find('input[name="alias"]').props().defaultValue).toBe(parentAlias.alias);
        expect(wrapper.find('input[name="parentValue"]').props().value).toBe(parentAlias.parentValue.value);
    });

    test('With parent value not an option in select', () => {
        const parentAlias: IParentAlias = {
            alias: 'testAlias',
            id: 'testId',
            ignoreAliasError: false,
            ignoreSelectError: false,
            parentValue: { value: 'materialInputs/test', label: 'Test Label' },
        };
        const option: IParentOption = {
            label: 'test',
            query: 'sampleset',
            schema: 'exp',
            value: 'materialInputs/notFound',
        };

        const component = (
            <ParentAliasRow
                id={parentAlias.id}
                onAliasChange={jest.fn()}
                onRemove={jest.fn()}
                parentAlias={parentAlias}
                parentOptions={[option]}
            />
        );

        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();

        const wrapper = mount(component);
        expect(wrapper.find('input[name="alias"]').props().defaultValue).toBe(parentAlias.alias);
        expect(wrapper.find('input[name="parentValue"]').props().value).toBe(parentAlias.parentValue.value);
    });

    test('Simulate delete behavior', () => {
        const parentAlias: IParentAlias = {
            alias: 'testAlias',
            id: 'testId',
            ignoreAliasError: false,
            ignoreSelectError: false,
            parentValue: { value: 'materialInputs/option2', label: 'Test Label' },
        };
        const option1: IParentOption = {
            label: 'option1',
            query: 'sampleset',
            schema: 'exp',
            value: 'materialInputs/option1',
        };
        const option2: IParentOption = {
            label: 'option2',
            query: 'sampleset',
            schema: 'exp',
            value: 'materialInputs/option2',
        };

        const mockRemove = jest.fn();

        const component = (
            <ParentAliasRow
                id={parentAlias.id}
                onAliasChange={jest.fn()}
                onRemove={mockRemove}
                parentAlias={parentAlias}
                parentOptions={[option1, option2]}
            />
        );

        const wrapper = mount(component);
        const removeBtn = wrapper.find('i.container--removal-icon');
        expect(mockRemove).toHaveBeenCalledTimes(0);
        removeBtn.simulate('click');
        expect(mockRemove).toHaveBeenCalledTimes(1);

        // Remove should be called with the ID to be removed
        expect(mockRemove).toHaveBeenCalledWith(parentAlias.id);
    });

    test('Simulate changed alias', () => {
        const parentAlias: IParentAlias = {
            alias: 'testAlias',
            id: 'testId',
            parentValue: { value: 'materialInputs/option2', label: 'Test Label' },
            ignoreAliasError: false,
            ignoreSelectError: false,
        };
        const option1: IParentOption = {
            label: 'option1',
            query: 'sampleset',
            schema: 'exp',
            value: 'materialInputs/option1',
        };
        const option2: IParentOption = {
            label: 'option2',
            query: 'sampleset',
            schema: 'exp',
            value: 'materialInputs/option2',
        };

        const mockChange = jest.fn();

        const component = (
            <ParentAliasRow
                id={parentAlias.id}
                onAliasChange={mockChange}
                onRemove={jest.fn()}
                parentAlias={parentAlias}
                parentOptions={[option1, option2]}
            />
        );

        const wrapper = mount(component);
        const aliasInput = wrapper.find('input[name="alias"]');
        expect(aliasInput.props().defaultValue).toBe(parentAlias.alias);
        expect(mockChange).toHaveBeenCalledTimes(0);

        aliasInput.simulate('change', { target: { name: 'alias', value: 'change' } });
        expect(mockChange).toHaveBeenCalledTimes(1);
        expect(mockChange).toBeCalledWith('testId', 'alias', 'change');
        mockChange.mockClear();
    });
});
