import React from 'react';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { CalculatedFieldOptions, getColumnTypeMap, getPHIColumnNames, typeToDisplay } from './CalculatedFieldOptions';
import { DomainField, SystemField } from './models';
import {
    DOMAIN_FIELD_PARTIALLY_LOCKED,
    INT_RANGE_URI,
    PHILEVEL_LIMITED_PHI,
    PHILEVEL_NOT_PHI,
    STRING_RANGE_URI,
} from './constants';

describe('CalculatedFieldOptions', () => {
    test('default properties', async () => {
        renderWithAppContext(
            <CalculatedFieldOptions
                domainIndex={0}
                field={DomainField.create({ rangeURI: STRING_RANGE_URI })}
                getDomainFields={jest.fn()}
                index={0}
                onChange={jest.fn()}
            />
        );

        expect(document.querySelector('.domain-field-section-heading')).toHaveTextContent('Expression');
        expect(document.querySelectorAll('.margin-bottom')).toHaveLength(0);
        expect(document.querySelectorAll('.form-control')).toHaveLength(1);
        expect(document.querySelectorAll('.domain-field-calc-footer')).toHaveLength(1);
        expect(document.querySelector('textarea')).toHaveTextContent('');
        expect(document.querySelector('textarea').getAttribute('disabled')).toBe(null);
    });

    test('with existing expression', async () => {
        renderWithAppContext(
            <CalculatedFieldOptions
                domainIndex={0}
                field={DomainField.create({ valueExpression: '1=0', rangeURI: INT_RANGE_URI })}
                getDomainFields={jest.fn()}
                index={0}
                onChange={jest.fn()}
            />
        );

        expect(document.querySelector('.domain-field-section-heading')).toHaveTextContent('Expression');
        expect(document.querySelectorAll('.margin-bottom')).toHaveLength(1);
        expect(document.querySelectorAll('.form-control')).toHaveLength(1);
        expect(document.querySelectorAll('.domain-field-calc-footer')).toHaveLength(1);
        expect(document.querySelector('textarea')).toHaveTextContent('1=0');
        expect(document.querySelector('textarea').getAttribute('disabled')).toBe(null);
    });

    test('disabled from lockType', async () => {
        renderWithAppContext(
            <CalculatedFieldOptions
                domainIndex={0}
                field={DomainField.create({ valueExpression: '1=0', lockType: DOMAIN_FIELD_PARTIALLY_LOCKED })}
                getDomainFields={jest.fn()}
                index={0}
                onChange={jest.fn()}
            />
        );

        expect(document.querySelector('.domain-field-section-heading')).toHaveTextContent('Expression');
        expect(document.querySelectorAll('.form-control')).toHaveLength(1);
        expect(document.querySelector('textarea')).toHaveTextContent('1=0');
        expect(document.querySelector('textarea').getAttribute('disabled')).toBe('');
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
            Created: 'DATETIME',
            CreatedBy: 'INTEGER',
            Modified: 'DATETIME',
            ModifiedBy: 'INTEGER',
        };
        expect(getColumnTypeMap(undefined, undefined)).toEqual({ ...defaultTypeMap });
        expect(getColumnTypeMap([], [])).toEqual({ ...defaultTypeMap });
        expect(
            getColumnTypeMap(
                [{ name: 'b', dataType: { name: 'text' } } as DomainField],
                [{ Name: 'a', DataType: 'integer' } as SystemField]
            )
        ).toEqual({
            ...defaultTypeMap,
            a: 'INTEGER',
            b: 'TEXT',
        });
        expect(
            getColumnTypeMap(
                [
                    { name: 'b', dataType: { name: 'text' } } as DomainField,
                    { name: 'c', dataType: { name: 'calculation' } } as DomainField,
                    { name: 'c', dataType: { name: 'multiChoice' } } as DomainField,
                    { name: 'd', dataType: { name: 'INT' } } as DomainField,
                ],
                [{ Name: 'a', DataType: 'integer' } as SystemField]
            )
        ).toEqual({
            ...defaultTypeMap,
            a: 'INTEGER',
            b: 'TEXT',
            d: 'INTEGER',
        });
    });
});
