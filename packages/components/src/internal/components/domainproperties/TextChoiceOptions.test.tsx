/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { TextChoiceOptionsImpl } from './TextChoiceOptions';
import { DomainField } from './models';
import { MULTI_CHOICE_RANGE_URI } from './constants';

describe('TextChoiceOptions', () => {
    const DEFAULT_PROPS = {
        label: 'Test Label',
        field: DomainField.create({}),
        fieldValues: {},
        loading: false,
        replaceValues: jest.fn(),
        validValues: [],
        index: 0,
        domainIndex: 0,
        onChange: jest.fn(),
        handleDataTypeChange: jest.fn(),
        lockType: undefined,
    };

    function validate(
        isLoading = false,
        validValuesCount = 0,
        inUse = 0,
        hasSelection = false,
        hasValueUpdate = false,
        hasValueError = false
    ): void {
        expect(screen.getByText('Test Label')).toBeInTheDocument();

        if (isLoading) {
            expect(screen.getByText('Loading...')).toBeInTheDocument();
            expect(document.querySelector('.domain-text-choices-list')).not.toBeInTheDocument();
        } else {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

            const list = document.querySelector('.domain-text-choices-list');
            if (validValuesCount > 0 || hasSelection) {
                expect(list).toBeInTheDocument();
            }

            const items = list?.querySelectorAll('.list-group-item');
            if (items) {
                expect(items.length).toBe(validValuesCount);
            } else {
                expect(validValuesCount).toBe(0);
            }

            expect(document.querySelectorAll('.choices-list__locked').length).toBe(inUse);
            const addBtn = document.querySelector('span.container--action-button');
            expect(addBtn.textContent).toBe(' Add Values');

            if (validValuesCount > 0 && !hasSelection) {
                expect(
                    screen.getByText('Select a value from the list on the left to view details.')
                ).toBeInTheDocument();
            }

            const inputs = screen.queryAllByPlaceholderText('Enter a text choice value');
            expect(inputs).toHaveLength(hasSelection ? 1 : 0);

            const updateInfos = document.querySelectorAll('.domain-text-choices-info');
            expect(updateInfos).toHaveLength(hasValueUpdate ? 1 : 0);

            const errors = document.querySelectorAll('.alert-danger');
            expect(errors).toHaveLength(hasValueError ? 1 : 0);

            const searchInputs = screen.queryAllByPlaceholderText('Find a value');
            expect(searchInputs).toHaveLength(validValuesCount > 2 ? 1 : 0);
        }
    }

    test('default props', () => {
        render(<TextChoiceOptionsImpl {...DEFAULT_PROPS} />);
        validate();
        const addBtn = document.querySelector('span.container--action-button');
        expect(addBtn.textContent).toBe(' Add Values');
        expect(addBtn.getAttribute('class').indexOf('disabled')).toBe(-1);

        // verify multi-choice checkbox exists, is unchecked, and enabled by default
        const multiCheckbox = document.querySelector('input.domain-text-choice-multi') as HTMLInputElement;
        expect(multiCheckbox).toBeInTheDocument();
        expect(multiCheckbox.checked).toBe(false);
        expect(multiCheckbox).toBeEnabled();
        expect(screen.getByText('Allow multiple selections')).toBeInTheDocument();
    });

    test('loading', () => {
        render(<TextChoiceOptionsImpl {...DEFAULT_PROPS} loading />);
        validate(true);
    });

    test('multi-choice checkbox checked when field is multi-choice', () => {
        render(
            <TextChoiceOptionsImpl
                {...DEFAULT_PROPS}
                field={DomainField.create({ rangeURI: MULTI_CHOICE_RANGE_URI })}
            />
        );
        const multiCheckbox = document.querySelector('input.domain-text-choice-multi') as HTMLInputElement;
        expect(multiCheckbox).toBeInTheDocument();
        expect(multiCheckbox).toBeEnabled();
        expect(multiCheckbox.checked).toBe(true);
    });

    test('multi-choice checkbox disabled when multi values are in use', () => {
        render(
            <TextChoiceOptionsImpl
                {...DEFAULT_PROPS}
                hasMultiValueInUse
            />
        );
        const multiCheckbox = document.querySelector('input.domain-text-choice-multi') as HTMLInputElement;
        expect(multiCheckbox).toBeInTheDocument();
        expect(multiCheckbox).toBeDisabled();
        const labelSpan = screen.getByText('Allow multiple selections');
        expect(labelSpan.getAttribute('title')).toBe('Multiple values are currently used by at least one data row.');
    });

    test('with validValues, no selection', () => {
        render(<TextChoiceOptionsImpl {...DEFAULT_PROPS} validValues={['a', 'b']} />);
        validate(false, 2);
        const items = document.querySelectorAll('.list-group-item');
        expect(items[0]).not.toHaveClass('active');
    });

    test('with validValues, with selection', async () => {
        render(<TextChoiceOptionsImpl {...DEFAULT_PROPS} validValues={['a', 'b']} />);
        fireEvent.click(screen.getByRole('button', { name: 'a' }));
        await waitFor(() => {
            validate(false, 2, 0, true);
        });
        const items = document.querySelectorAll('.list-group-item');
        expect(items[0]).toHaveClass('active');
    });

    test('apply button disabled', async () => {
        render(<TextChoiceOptionsImpl {...DEFAULT_PROPS} validValues={['a', 'b']} />);
        fireEvent.click(screen.getByRole('button', { name: 'a' }));

        const input = screen.getByPlaceholderText('Enter a text choice value');
        expect(input).toHaveValue('a');
        expect(input).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();

        fireEvent.change(input, { target: { value: 'aa' } });
        await waitFor(() => {
            expect(input).toHaveValue('aa');
        });
        expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
    });

    test('choice item empty', async () => {
        const { rerender } = render(<TextChoiceOptionsImpl {...DEFAULT_PROPS} validValues={['a', 'b']} />);

        let items = screen.getAllByRole('button').filter(b => b.classList.contains('list-group-item'));
        expect(items[0]).toHaveTextContent('a');
        expect(items[1]).toHaveTextContent('b');

        rerender(<TextChoiceOptionsImpl {...DEFAULT_PROPS} validValues={['', 'b']} />);

        items = screen.getAllByRole('button').filter(b => b.classList.contains('list-group-item'));
        expect(items[0]).toHaveTextContent('Empty Value');
        expect(items[1]).toHaveTextContent('b');
    });

    test('with inUse values', async () => {
        render(
            <TextChoiceOptionsImpl
                {...DEFAULT_PROPS}
                fieldValues={{ b: { locked: false, count: 1 } }}
                validValues={['a', 'b']}
            />
        );
        validate(false, 2, 1);

        // select the in-use value and check right hand items
        // 'b' is the label, but it also has the lock icon. The button text content includes 'b'.
        // Because of the icon, the accessible name might be tricky.
        // We can query by text content.
        const bButton = screen.getAllByRole('button').find(b => b.textContent?.includes('b'));
        fireEvent.click(bButton);

        await waitFor(() => {
            validate(false, 2, 1, true);
        });
        expect(screen.getByPlaceholderText('Enter a text choice value')).toBeEnabled();
    });

    test('with inUse value update info', async () => {
        const replaceValues = jest.fn();
        const { rerender } = render(
            <TextChoiceOptionsImpl
                {...DEFAULT_PROPS}
                fieldValues={{ b: { locked: false, count: 1 } }}
                replaceValues={replaceValues}
                validValues={['a', 'b']}
            />
        );
        validate(false, 2, 1);

        // select the in-use value, change it, and apply
        const bButton = screen.getAllByRole('button').find(b => b.textContent?.includes('b'));
        fireEvent.click(bButton);

        const input = screen.getByPlaceholderText('Enter a text choice value');
        fireEvent.change(input, { target: { value: 'bb' } });

        const applyBtn = screen.getByRole('button', { name: 'Apply' });
        await waitFor(() => expect(applyBtn).toBeEnabled());
        fireEvent.click(applyBtn);

        expect(replaceValues).toHaveBeenCalled();
    });

    test('with locked values', async () => {
        render(
            <TextChoiceOptionsImpl
                {...DEFAULT_PROPS}
                fieldValues={{ b: { locked: true, count: 1 } }}
                validValues={['a', 'b']}
            />
        );
        validate(false, 2, 1);

        // select the locked value and check right hand items
        const bButton = screen.getAllByRole('button').find(b => b.textContent?.includes('b'));
        fireEvent.click(bButton);

        await waitFor(() => {
            validate(false, 2, 1, true);
        });
        expect(screen.getByPlaceholderText('Enter a text choice value')).toBeDisabled();
    });

    test('value update error checks', async () => {
        render(<TextChoiceOptionsImpl {...DEFAULT_PROPS} validValues={['a', 'b']} />);

        const bButton = screen.getByRole('button', { name: 'b' });
        fireEvent.click(bButton);
        validate(false, 2, 0, true);

        // don't allow empty string
        const input = screen.getByPlaceholderText('Enter a text choice value');
        fireEvent.change(input, { target: { value: 'bb' } });
        const applyBtn = screen.getByRole('button', { name: 'Apply' });
        expect(applyBtn).toBeEnabled();

        fireEvent.change(input, { target: { value: '   ' } });
        expect(applyBtn).toBeDisabled();

        // don't allow duplicates
        fireEvent.change(input, { target: { value: ' a ' } });
        expect(applyBtn).toBeDisabled();

        validate(false, 2, 0, true, false, true);
        const alert = document.querySelector('.alert-danger');
        expect(alert).toHaveTextContent('"a" already exists in the list of values.');
    });

    test('delete button disabled', async () => {
        render(
            <TextChoiceOptionsImpl
                {...DEFAULT_PROPS}
                fieldValues={{ b: { locked: false, count: 1 } }}
                validValues={['a', 'b']}
            />
        );
        validate(false, 2, 1);

        // first value, not in use
        const aButton = screen.getByRole('button', { name: 'a' });
        fireEvent.click(aButton);

        // Delete button is the one with trash icon. "Delete" text is in span after icon.
        // DisableableButton renders children.
        const deleteBtn = screen.getByRole('button', { name: /Delete/ });
        expect(deleteBtn).toBeEnabled();

        // second value, in use
        const bButton = screen.getAllByRole('button').find(b => b.textContent?.includes('b'));
        fireEvent.click(bButton);

        const deleteBtn2 = screen.getByRole('button', { name: /Delete/ });
        expect(deleteBtn2).toBeDisabled();
    });

    test('AddEntityButton disabled if max reached', () => {
        render(<TextChoiceOptionsImpl {...DEFAULT_PROPS} maxValueCount={2} validValues={['a', 'b']} />);
        validate(false, 2);
        const addBtn = document.querySelector('span.container--action-button');
        expect(addBtn.textContent).toBe(' Add Values');
        expect(addBtn.getAttribute('class')).toContain(' disabled');
    });

    test('search', async () => {
        render(<TextChoiceOptionsImpl {...DEFAULT_PROPS} validValues={['a', 'aa', 'aaa', 'b']} />);
        validate(false, 4);

        const searchInput = screen.getByPlaceholderText('Find a value');

        fireEvent.change(searchInput, { target: { value: ' a ' } });
        let items = document.querySelectorAll('.list-group-item');
        expect(items).toHaveLength(3);
        expect(items[0]).toHaveTextContent('a');
        expect(items[1]).toHaveTextContent('aa');
        expect(items[2]).toHaveTextContent('aaa');

        fireEvent.change(searchInput, { target: { value: 'b' } });
        items = document.querySelectorAll('.list-group-item');
        expect(items).toHaveLength(1);
        expect(items[0]).toHaveTextContent('b');

        fireEvent.change(searchInput, { target: { value: 'AA' } });
        items = document.querySelectorAll('.list-group-item');
        expect(items).toHaveLength(2);
        expect(items[0]).toHaveTextContent('aa');
        expect(items[1]).toHaveTextContent('aaa');

        fireEvent.change(searchInput, { target: { value: '' } });
        items = document.querySelectorAll('.list-group-item');
        expect(items).toHaveLength(4);
    });
});
