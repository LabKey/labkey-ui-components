/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { List } from 'immutable';
import { waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { getTestAPIWrapper } from '../../APIWrapper';

import {
    CalculatedFieldOptions,
    CalculatedFieldOptionsProps,
    getColumnTypeMap,
    getPHIColumnNames,
    typeToDisplay,
} from './CalculatedFieldOptions';
import { DomainField, SystemField } from './models';
import {
    DATETIME_RANGE_URI,
    DOMAIN_FIELD_PARTIALLY_LOCKED,
    DOUBLE_RANGE_URI,
    FLOAT_RANGE_URI,
    INT_RANGE_URI,
    LONG_RANGE_URI,
    PHILEVEL_LIMITED_PHI,
    PHILEVEL_NOT_PHI,
    STRING_RANGE_URI,
} from './constants';
import { getDomainPropertiesTestAPIWrapper } from './APIWrapper';

describe('CalculatedFieldOptions', () => {
    function defaultProps(): CalculatedFieldOptionsProps {
        return {
            domainIndex: 0,
            getDomainFields: jest.fn(),
            field: DomainField.create({ rangeURI: STRING_RANGE_URI }),
            index: 0,
            onChange: jest.fn(),
        };
    }

    test('default properties', async () => {
        renderWithAppContext(<CalculatedFieldOptions {...defaultProps()} />);

        expect(document.querySelector('.domain-field-section-heading')).toHaveTextContent('Expression');
        expect(document.querySelectorAll('.margin-bottom')).toHaveLength(0);
        expect(document.querySelectorAll('.form-control')).toHaveLength(1);
        expect(document.querySelectorAll('.domain-field-calc-footer')).toHaveLength(1);
        expect(document.querySelector('textarea')).toHaveTextContent('');
        expect(document.querySelector('textarea')).not.toBeDisabled();
    });

    test('with existing expression', async () => {
        renderWithAppContext(
            <CalculatedFieldOptions
                {...defaultProps()}
                field={DomainField.create({ valueExpression: '1=0', rangeURI: INT_RANGE_URI })}
            />
        );

        expect(document.querySelector('.domain-field-section-heading')).toHaveTextContent('Expression');
        expect(document.querySelectorAll('.margin-bottom')).toHaveLength(1);
        expect(document.querySelectorAll('.form-control')).toHaveLength(1);
        expect(document.querySelectorAll('.domain-field-calc-footer')).toHaveLength(1);
        expect(document.querySelector('textarea')).toHaveTextContent('1=0');
        expect(document.querySelector('textarea')).not.toBeDisabled();
    });

    test('disabled from lockType', async () => {
        renderWithAppContext(
            <CalculatedFieldOptions
                {...defaultProps()}
                field={DomainField.create({ valueExpression: '1=0', lockType: DOMAIN_FIELD_PARTIALLY_LOCKED })}
            />
        );

        expect(document.querySelector('.domain-field-section-heading')).toHaveTextContent('Expression');
        expect(document.querySelectorAll('.form-control')).toHaveLength(1);
        expect(document.querySelector('textarea')).toHaveTextContent('1=0');
        expect(document.querySelector('textarea')).toBeDisabled();
    });

    test('typeToDisplay', () => {
        expect(typeToDisplay(undefined)).toBe('Unknown');
        expect(typeToDisplay(null)).toBe('Unknown');
        expect(typeToDisplay('')).toBe('Unknown');
        expect(typeToDisplay('Other')).toBe('Unknown');
        expect(typeToDisplay('int')).toBe('Integer');
        expect(typeToDisplay('Integer')).toBe('Integer');
        expect(typeToDisplay('double')).toBe('Decimal (floating point)');
        expect(typeToDisplay('Decimal')).toBe('Decimal (floating point)');
        expect(typeToDisplay('VARCHAR')).toBe('Text');
        expect(typeToDisplay('varchar')).toBe('Text');
        expect(typeToDisplay('Date')).toBe('Date Time');
        expect(typeToDisplay('Bogus')).toBe('Bogus');
    });

    test('getPHIColumnNames', () => {
        expect(getPHIColumnNames(undefined)).toEqual([]);
        expect(getPHIColumnNames([])).toEqual([]);
        expect(getPHIColumnNames([DomainField.create({ name: 'a' })])).toEqual([]);
        expect(getPHIColumnNames([DomainField.create({ name: 'a', PHI: undefined })])).toEqual([]);
        expect(getPHIColumnNames([DomainField.create({ name: 'a', PHI: PHILEVEL_NOT_PHI })])).toEqual([]);
        expect(getPHIColumnNames([DomainField.create({ name: 'a', PHI: PHILEVEL_LIMITED_PHI })])).toEqual(['a']);
    });

    test('getColumnTypeMap', () => {
        const defaultTypeMap = {
            Created: 'TIMESTAMP',
            CreatedBy: 'INTEGER',
            Modified: 'TIMESTAMP',
            ModifiedBy: 'INTEGER',
        };
        expect(getColumnTypeMap()).toEqual({ ...defaultTypeMap });
        expect(getColumnTypeMap([], [])).toEqual({ ...defaultTypeMap });
        expect(
            getColumnTypeMap(
                [{ name: 'b', dataType: { name: 'string' }, rangeURI: STRING_RANGE_URI } as DomainField],
                [{ Name: 'a', DataType: 'Integer', rangeURI: INT_RANGE_URI } as SystemField]
            )
        ).toEqual({
            ...defaultTypeMap,
            a: 'INTEGER',
            b: 'VARCHAR',
        });
        expect(
            getColumnTypeMap(
                [
                    { name: 'b', dataType: { name: 'textChoice' }, rangeURI: STRING_RANGE_URI } as DomainField,
                    { name: 'c', dataType: { name: 'calculation' } } as DomainField,
                    { name: 'c', dataType: { name: 'multiChoice' } } as DomainField,
                    { name: 'd', dataType: { name: 'lookup' }, rangeURI: INT_RANGE_URI } as DomainField,
                    { name: 'e', dataType: { name: 'visitDate' }, rangeURI: DATETIME_RANGE_URI } as DomainField,
                    { name: 'f', dataType: { name: 'long' }, rangeURI: LONG_RANGE_URI } as DomainField,
                    { name: 'g', dataType: { name: 'float' }, rangeURI: FLOAT_RANGE_URI } as DomainField,
                    { name: 'h', dataType: { name: 'unknown' }, rangeURI: 'urn:unknown' } as DomainField,
                ],
                [{ Name: 'a', DataType: 'Decimal (floating point)', rangeURI: DOUBLE_RANGE_URI } as SystemField]
            )
        ).toEqual({
            ...defaultTypeMap,
            a: 'DOUBLE',
            b: 'VARCHAR',
            d: 'INTEGER',
            e: 'TIMESTAMP',
            f: 'BIGINT',
            g: 'REAL',
            h: 'OTHER',
        });
    });

    describe('AI assistance (mcpReady)', () => {
        const getDomainFields = () => ({ domainFields: List<DomainField>(), systemFields: [] as SystemField[] });

        const renderWithAssistance = (
            mcpReady: boolean | undefined,
            fieldOverrides: Partial<{ propertyId: number; rangeURI: string; valueExpression: string }> = {},
            parseResponse: Error | { error?: string; type?: string } = { type: 'INTEGER' }
        ) => {
            const parseCalculatedColumn = jest.fn().mockImplementation(() => {
                if (parseResponse instanceof Error) return Promise.reject(parseResponse);
                return Promise.resolve(parseResponse);
            });
            const onChange = jest.fn();
            const result = renderWithAppContext(
                <CalculatedFieldOptions
                    {...defaultProps()}
                    field={DomainField.create({ rangeURI: STRING_RANGE_URI, ...fieldOverrides })}
                    getDomainFields={getDomainFields}
                    onChange={onChange}
                />,
                {
                    appContext: {
                        api: getTestAPIWrapper(jest.fn, {
                            domain: getDomainPropertiesTestAPIWrapper(jest.fn, { parseCalculatedColumn }),
                        }),
                    },
                    serverContext: { mcpReady },
                }
            );

            return { ...result, parseCalculatedColumn, onChange };
        };

        test('renders AI Assistant button and hides examples table when mcpReady is true', () => {
            renderWithAssistance(true);

            const aiButtons = Array.from(document.querySelectorAll('button')).filter(b =>
                b.textContent?.includes('AI Assistant')
            );
            expect(aiButtons).toHaveLength(1);
            expect(document.querySelector('.domain-field-calc-examples')).toBeNull();
        });

        test('renders examples table and hides AI Assistant button when mcpReady is false', () => {
            renderWithAssistance(false);

            const aiButtons = Array.from(document.querySelectorAll('button')).filter(b =>
                b.textContent?.includes('AI Assistant')
            );
            expect(aiButtons).toHaveLength(0);
            expect(document.querySelector('.domain-field-calc-examples')).not.toBeNull();
        });

        test('renders examples table and hides AI Assistant button when mcpReady is undefined', () => {
            renderWithAssistance(undefined);

            const aiButtons = Array.from(document.querySelectorAll('button')).filter(b =>
                b.textContent?.includes('AI Assistant')
            );
            expect(aiButtons).toHaveLength(0);
            expect(document.querySelector('.domain-field-calc-examples')).not.toBeNull();
        });

        test('clicking AI Assistant button opens the ExpressionAssistantModal', async () => {
            renderWithAssistance(true);

            // The modal is not open yet
            await waitFor(() => {
                expect(document.querySelector('.modal-title')).toBeNull();
            });

            const aiButton = Array.from(document.querySelectorAll('button')).find(b =>
                b.textContent?.includes('AI Assistant')
            );

            await userEvent.click(aiButton!);
            expect(document.querySelector('.modal-title')).toHaveTextContent('Expression AI Assistant');
        });

        test('renders "Get help from AI" button next to error when mcpReady is true and validation fails', async () => {
            renderWithAssistance(true, { propertyId: 1, valueExpression: 'bogus' }, { error: 'Invalid expression' });

            // Validation error should be displayed
            await waitFor(() => {
                expect(document.querySelector('.error')).toHaveTextContent('Invalid expression');
            });

            // "Get help from AI" button should be present alongside the error
            const helpBtn = document.querySelector('button.validate-link-ai');
            expect(helpBtn).not.toBeNull();
            expect(helpBtn).toHaveTextContent('Get help from AI');

            // Clicking it should open the assistant modal
            await userEvent.click(helpBtn!);
            expect(document.querySelector('.modal-title')).toHaveTextContent('Expression AI Assistant');
        });

        test('does not render "Get help from AI" button on error when mcpReady is false', async () => {
            renderWithAssistance(false, { propertyId: 1, valueExpression: 'bogus' }, { error: 'Invalid expression' });

            await waitFor(() => {
                expect(document.querySelector('.error')).toHaveTextContent('Invalid expression');
            });
            expect(document.querySelector('button.validate-link-ai')).toBeNull();
        });
    });
});
