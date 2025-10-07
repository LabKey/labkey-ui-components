import React, { act } from 'react';

import { userEvent } from '@testing-library/user-event';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { TEST_USER_EDITOR } from '../../userFixtures';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';
import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { isValid, SampleAmountEditModal } from './SampleAmountEditModal';

describe('SampleAmountEditModal', () => {
    const testSchemaQuery = new SchemaQuery('schema', 'query', 'view');
    const emptyRow = {};
    const defaultNoun = 'noun';

    const DEFAULT_APP_CONTEXT = { user: TEST_USER_EDITOR, container: TEST_PROJECT_CONTAINER };

    function validate(
        amount: number,
        hasSelect: boolean,
        comment: string,
        noun: string,
        canSave: boolean,
        isNegative?: boolean
    ): void {
        expect(document.querySelector('.checkin-amount-label').textContent).toContain('Amount');
        expect(document.querySelector('input.storage-amount-input').getAttribute('value')).toBe(amount ?? '');
        expect(document.querySelectorAll('.checkin-unit-select')).toHaveLength(hasSelect ? 1 : 0);
        expect(document.querySelectorAll('input.checkin-unit-input')).toHaveLength(hasSelect ? 0 : 1);

        expect(document.querySelector('textarea').getAttribute('value')).toBe(comment ?? null);
        expect(document.querySelectorAll('.alert')).toHaveLength(isNegative ? 1 : 0);
        if (isNegative) {
            expect(document.querySelectorAll('.alert').item(0).textContent).toBe(
                'Amount must be a non-negative value.'
            );
        }
        validateSubmitButton(noun, canSave);
    }

    function validateSubmitButton(noun: string, canSave: boolean): void {
        const success = document.querySelectorAll('button').item(2);
        expect(success.textContent).toBe('Update ' + noun);
        if (canSave) {
            expect(success.getAttribute('disabled')).toBeNull();
        } else {
            expect(success.getAttribute('disabled')).not.toBeNull();
        }
    }

    test('minimal props', () => {
        renderWithAppContext(
            <SampleAmountEditModal
                noun={defaultNoun}
                onClose={jest.fn()}
                row={emptyRow}
                schemaQuery={testSchemaQuery}
                updateListener={jest.fn()}
            />,
            {
                serverContext: DEFAULT_APP_CONTEXT,
            }
        );

        expect(document.querySelectorAll('button').item(1).textContent).toBe('Cancel');
        validate(undefined, true, undefined, defaultNoun, false);
    });

    test('Amount null', () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: null },
            Units: { value: 'uL' },
            FreezeThawCount: { value: 1 },
        } as any;

        renderWithAppContext(
            <SampleAmountEditModal
                noun={defaultNoun}
                onClose={jest.fn()}
                row={row}
                schemaQuery={testSchemaQuery}
                updateListener={jest.fn()}
            />,
            {
                serverContext: DEFAULT_APP_CONTEXT,
            }
        );

        validate(undefined, true, undefined, defaultNoun, false);
    });

    test('StoredAmount negative', () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: '-500' },
            Units: { value: 'uL' },
            FreezeThawCount: { value: 1 },
        } as any;

        renderWithAppContext(
            <SampleAmountEditModal
                noun={defaultNoun}
                onClose={jest.fn()}
                row={row}
                schemaQuery={testSchemaQuery}
                updateListener={jest.fn()}
            />,
            {
                serverContext: DEFAULT_APP_CONTEXT,
            }
        );

        validate(row.StoredAmount.value, true, undefined, defaultNoun, false, true);
    });

    test('Units null', () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: '500' },
            Units: { value: null },
            FreezeThawCount: { value: 1 },
        } as any;

        renderWithAppContext(
            <SampleAmountEditModal
                noun={defaultNoun}
                onClose={jest.fn()}
                row={row}
                schemaQuery={testSchemaQuery}
                updateListener={jest.fn()}
            />,
            {
                serverContext: DEFAULT_APP_CONTEXT,
            }
        );

        validate(row.StoredAmount.value, true, undefined, defaultNoun, false);
    });

    test('Units custom', () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: '500' },
            Units: { value: 'custom' },
            FreezeThawCount: { value: 1 },
        } as any;

        renderWithAppContext(
            <SampleAmountEditModal
                noun={defaultNoun}
                onClose={jest.fn()}
                row={row}
                schemaQuery={testSchemaQuery}
                updateListener={jest.fn()}
            />,
            {
                serverContext: DEFAULT_APP_CONTEXT,
            }
        );

        validate(row.StoredAmount.value, false, undefined, defaultNoun, false);
    });

    test('Set units, can save', async () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: '500' },
            Units: { value: 'oldUnits' },
            FreezeThawCount: { value: 1 },
        } as any;

        await act(async () => {
            renderWithAppContext(
                <SampleAmountEditModal
                    noun={defaultNoun}
                    onClose={jest.fn()}
                    row={row}
                    schemaQuery={testSchemaQuery}
                    updateListener={jest.fn()}
                />,
                {
                    appContext: {
                        api: getTestAPIWrapper(jest.fn, {
                            folder: getFolderTestAPIWrapper(jest.fn, {
                                getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: false }),
                            }),
                        }),
                    },
                    serverContext: DEFAULT_APP_CONTEXT,
                }
            );
        });

        validate(row.StoredAmount.value, false, undefined, defaultNoun, false);

        const unitInput = document.querySelector('input.checkin-unit-input');
        const newUnits = 'newUnits';
        // Focus the input, then paste
        await userEvent.click(unitInput);
        await userEvent.paste(newUnits);
        validate(row.StoredAmount.value, false, undefined, defaultNoun, true, false);
    });
});

describe('isValid', () => {
    test('has neither', () => {
        expect(isValid(undefined, undefined)).toBe(true);
        expect(isValid(undefined, null)).toBe(true);
        expect(isValid(null, null)).toBe(true);
        expect(isValid(null, undefined)).toBe(true);
    });

    test('has one but not the other', () => {
        expect(isValid(0, undefined)).toBe(false);
        expect(isValid(0, null)).toBe(false);
        expect(isValid(0, '')).toBe(false);
        expect(isValid(undefined, 'L')).toBe(false);
        expect(isValid(null, 'L')).toBe(false);
    });

    test('has both', () => {
        expect(isValid(-10, 'uL')).toBe(false);
        expect(isValid(0, 'uL')).toBe(true);
        expect(isValid(10, 'uL')).toBe(true);
        expect(isValid(0.1, 'uL')).toBe(true);
        expect(isValid(10.000000001, 'uL')).toBe(true);
    });
});
