import React from 'react';
import { act } from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import { SELECT_INPUT_CONTROL_SELECTOR } from '../forms/input/SelectInputTestUtils';

import { IParentAlias, IParentOption } from '../entities/models';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { ParentAliasRow } from './ParentAliasRow';

describe('ParentAliasRow', () => {
    test('Ignore empty values', async () => {
        const parentAlias: IParentAlias = {
            alias: '',
            id: '',
            parentValue: undefined,
            ignoreAliasError: true,
            ignoreSelectError: true,
        };

        let container;
        await act(async () => {
            container = renderWithAppContext(
                <ParentAliasRow
                    id={parentAlias.id}
                    onAliasChange={jest.fn()}
                    onRemove={jest.fn()}
                    parentAlias={parentAlias}
                    parentOptions={[]}
                />
            );
        });

        expect(document.getElementsByName('alias')[0].getAttribute('value')).toBe('');
        expect(document.querySelectorAll('.has-error')).toHaveLength(0);
        expect(document.getElementsByName('required')[0].getAttribute('checked')).toBeNull();
    });

    test('Blank values, Error CSS applied', async () => {
        const parentAlias: IParentAlias = {
            alias: '',
            id: 'testId',
            parentValue: undefined,
            ignoreAliasError: false,
            ignoreSelectError: false,
        };

        let container;
        await act(async () => {
            container = renderWithAppContext(
                <ParentAliasRow
                    id={parentAlias.id}
                    onAliasChange={jest.fn()}
                    onRemove={jest.fn()}
                    parentAlias={parentAlias}
                    parentOptions={[]}
                />
            );
        });

        const aliasInput = document.getElementsByName('alias')[0];
        expect(aliasInput.getAttribute('value')).toBe(parentAlias.alias);
        expect(document.querySelectorAll('.has-error input[name="alias"]')).toHaveLength(1);
        expect(document.querySelectorAll(`.has-error ${SELECT_INPUT_CONTROL_SELECTOR}`)).toHaveLength(1);
        expect(document.getElementsByName('required')[0].getAttribute('checked')).toBeNull();
    });

    test('With values', async () => {
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

        let container;
        await act(async () => {
            container = renderWithAppContext(
                <ParentAliasRow
                    id={parentAlias.id}
                    onAliasChange={jest.fn()}
                    onRemove={jest.fn()}
                    parentAlias={parentAlias}
                    parentOptions={[option]}
                />
            );
        });

        expect(container).toMatchSnapshot();

        expect(document.getElementsByName('alias')[0].getAttribute('value')).toBe(parentAlias.alias);
        expect(document.getElementsByName('parentValue')[0].getAttribute('value')).toBe(parentAlias.parentValue.value);
        expect(document.getElementsByName('required')[0].getAttribute('checked')).toBeNull();
    });

    test('With values - required', async () => {
        const parentAlias: IParentAlias = {
            alias: 'testAlias',
            id: 'testId',
            ignoreAliasError: false,
            ignoreSelectError: false,
            parentValue: { value: 'materialInputs/test', label: 'Test Label' },
            required: true,
        };
        const option: IParentOption = {
            label: 'test',
            query: 'sampleset',
            schema: 'exp',
            value: 'materialInputs/test',
        };

        let container;
        await act(async () => {
            container = renderWithAppContext(
                <ParentAliasRow
                    id={parentAlias.id}
                    onAliasChange={jest.fn()}
                    onRemove={jest.fn()}
                    parentAlias={parentAlias}
                    parentOptions={[option]}
                />
            );
        });

        expect(document.getElementsByName('alias')[0].getAttribute('value')).toBe(parentAlias.alias);
        expect(document.getElementsByName('parentValue')[0].getAttribute('value')).toBe(parentAlias.parentValue.value);
        expect(document.getElementsByName('required')[0].getAttribute('checked')).toBe('');
    });

    test('With parent value not an option in select', async () => {
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

        let container;
        await act(async () => {
            container = renderWithAppContext(
                <ParentAliasRow
                    id={parentAlias.id}
                    onAliasChange={jest.fn()}
                    onRemove={jest.fn()}
                    parentAlias={parentAlias}
                    parentOptions={[option]}
                />
            );
        });

        expect(container).toMatchSnapshot();

        expect(document.getElementsByName('alias')[0].getAttribute('value')).toBe(parentAlias.alias);
        expect(document.getElementsByName('parentValue')[0].getAttribute('value')).toBe(parentAlias.parentValue.value);
        expect(document.getElementsByName('required')[0].getAttribute('checked')).toBeNull();
    });

    // await userEvent.click(screen.getByText('card1'));
    test('Simulate delete behavior', async () => {
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

        let container;
        await act(async () => {
            container = renderWithAppContext(
                <ParentAliasRow
                    id={parentAlias.id}
                    onAliasChange={jest.fn()}
                    onRemove={mockRemove}
                    parentAlias={parentAlias}
                    parentOptions={[option1, option2]}
                />
            );
        });

        const removeBtn = document.querySelector('span.fa-times-circle');
        expect(mockRemove).toHaveBeenCalledTimes(0);
        await userEvent.click(removeBtn);
        expect(mockRemove).toHaveBeenCalledTimes(1);

        // Remove should be called with the ID to be removed
        expect(mockRemove).toHaveBeenCalledWith(parentAlias.id);
    });

    test('Simulate changed alias and check required', async () => {
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

        let container;
        await act(async () => {
            container = renderWithAppContext(
                <ParentAliasRow
                    id={parentAlias.id}
                    onAliasChange={mockChange}
                    onRemove={jest.fn()}
                    parentAlias={parentAlias}
                    parentOptions={[option1, option2]}
                    updateDupeParentAliases={jest.fn()}
                />
            );
        });

        const aliasInput = document.getElementsByName('alias')[0];
        const requiredInput = document.getElementsByName('required')[0];

        expect(aliasInput.getAttribute('value')).toBe(parentAlias.alias);
        expect(requiredInput.getAttribute('checked')).toBeNull();
        expect(mockChange).toHaveBeenCalledTimes(0);

        await userEvent.type(aliasInput, 'c');
        expect(mockChange).toHaveBeenCalledTimes(1);
        expect(mockChange).toHaveBeenCalledWith('testId', 'alias', parentAlias.alias + 'c');
        mockChange.mockClear();

        await userEvent.click(requiredInput);
        expect(mockChange).toHaveBeenCalledTimes(1);
        expect(mockChange).toHaveBeenCalledWith('testId', 'required', true);
        mockChange.mockClear();
    });
});
