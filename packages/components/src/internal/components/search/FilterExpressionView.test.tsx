import React, { act } from 'react';

import { Filter } from '@labkey/api';

import { QueryColumn } from '../../../public/QueryColumn';
import {
    BOOLEAN_TYPE,
    DATE_TYPE,
    DATETIME_TYPE,
    DOUBLE_TYPE,
    INTEGER_TYPE,
    TEXT_TYPE,
    TIME_TYPE,
} from '../domainproperties/PropDescType';

import { FilterExpressionView } from './FilterExpressionView';
import { userEvent } from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';

const stringField = new QueryColumn({
    name: 'StringField',
    caption: 'StringField',
    rangeURI: TEXT_TYPE.rangeURI,
    jsonType: 'string',
});
const doubleField = new QueryColumn({
    name: 'DoubleField',
    caption: 'DoubleField',
    rangeURI: DOUBLE_TYPE.rangeURI,
    jsonType: 'float',
});
const intField = new QueryColumn({
    name: 'IntField',
    caption: 'IntField',
    rangeURI: INTEGER_TYPE.rangeURI,
    jsonType: 'int',
});
const booleanField = new QueryColumn({
    name: 'BooleanField',
    caption: 'BooleanField',
    rangeURI: BOOLEAN_TYPE.rangeURI,
    jsonType: 'boolean',
});
const dateField = new QueryColumn({
    name: 'DateField',
    caption: 'DateField',
    rangeURI: DATE_TYPE.rangeURI,
    jsonType: 'date',
});
const dateTimeField = new QueryColumn({
    name: 'DateTimeField',
    caption: 'DateTimeField',
    rangeURI: DATETIME_TYPE.rangeURI,
    jsonType: 'date',
});
const timeField = new QueryColumn({
    name: 'TimeField',
    caption: 'TimeField',
    rangeURI: TIME_TYPE.rangeURI,
    jsonType: 'time',
});

const Ops = [
    'eq',
    'neqornull',
    'isblank',
    'isnonblank',
    'gt',
    'lt',
    'gte',
    'lte',
    'in',
    'notin',
    'between',
    'notbetween',
];

const StringOps = [
    'eq',
    'neqornull',
    'isblank',
    'isnonblank',
    'gt',
    'lt',
    'gte',
    'lte',
    'contains',
    'doesnotcontain',
    'doesnotstartwith',
    'startswith',
    'in',
    'notin',
    'containsoneof',
    'containsnoneof',
    'between',
    'notbetween',
];

const dateOps = [
    'dateeq',
    'dateneq',
    'isblank',
    'isnonblank',
    'dategt',
    'datelt',
    'dategte',
    'datelte',
    'between',
    'notbetween',
];

const timeOps = Ops;

const booleanOps = ['eq', 'neqornull', 'isblank', 'isnonblank'];

beforeAll(() => {
    LABKEY.container = {
        formats: {
            dateFormat: 'yyyy-MM-dd',
            dateTimeFormat: 'yyyy-MM-dd HH:mm',
            numberFormat: null,
            timeFormat: 'HH:mm',
        },
    };
});

describe('FilterExpressionView', () => {
    function validate(
        operators: string[],
        filterIndex: number,
        numFilters = 1,
        inputCount = 0,
        inputOffset = 0,
        selectedOp?: string,
        firstInputValue?: any,
        secondInputValue?: any,
        disabled?: boolean
    ): void {
        expect(document.querySelectorAll('.select-input')).toHaveLength(numFilters);
        validateFilterTypeDropdown(operators, filterIndex, selectedOp);

        const filterInputs = document.querySelectorAll('input.filter-expression__input');

        expect(filterInputs.length).toEqual(inputCount);

        if (firstInputValue) {
            expect(filterInputs.item(inputOffset).getAttribute('value')).toEqual(firstInputValue);
            if (disabled) {
                expect(filterInputs.item(inputOffset).getAttribute('disabled')).toBeDefined();
            } else {
                expect(filterInputs.item(inputOffset).getAttribute('disabled')).toBeFalsy();
            }
        }

        if (secondInputValue) {
            expect(filterInputs.item(inputOffset + 1).getAttribute('value')).toEqual(secondInputValue);
            if (disabled) {
                expect(filterInputs.item(inputOffset + 1).getAttribute('disabled')).toBeDefined();
            } else {
                expect(filterInputs.item(inputOffset + 1).getAttribute('disabled')).toBeFalsy();
            }
        }
    }

    async function validateFilterTypeDropdown(
        operators: string[],
        filterIndex: number,
        selectedOp?: string
    ): Promise<void> {
        const selectInput = document.querySelectorAll('.select-input').item(filterIndex);
        userEvent.click(document.querySelector('.select-input__input'));

        let options;
        await waitFor(() => {
            options = selectInput.querySelectorAll('.select-input__option');
            expect(options).toHaveLength(3);
        });

        const selectedFilter = document.querySelector('.filter-expression-field-filter-type');
        if (selectedOp) {
            expect(selectedFilter.getAttribute('value')).toEqual(selectedOp);
        } else {
            expect(selectedFilter.getAttribute('value')).toEqual('contains');
        }

        const ops = [];
        options.forEach(op => ops.push(op.getAttribute('value')));
        expect(ops).toEqual(operators);
    }

    test('string field, no filter selected', () => {
        render(<FilterExpressionView field={stringField} fieldFilters={null} />);

        validateFilterTypeDropdown(StringOps, 0, null);
    });

    test('string field, equals operator', () => {
        render(
            <FilterExpressionView
                field={stringField}
                fieldFilters={[Filter.create('StringField', 'ABC', Filter.Types.Equals)]}
            />
        );

        validate(StringOps, 0, 1, 1, 0, 'eq', 'ABC');
    });

    test('int field, between operator', () => {
        render(
            <FilterExpressionView
                field={intField}
                fieldFilters={[Filter.create('IntField', '1,200', Filter.Types.BETWEEN)]}
            />
        );

        validate(Ops, 0, 2, 2, 0, 'between', '1', '200');
    });

    test('int field, no filter selected', () => {
        render(<FilterExpressionView field={intField} fieldFilters={null} />);

        validateFilterTypeDropdown(Ops, 0, Ops[0]);
    });

    test('double field, greater than operator', () => {
        render(
            <FilterExpressionView
                field={doubleField}
                fieldFilters={[Filter.create('DoubleField', 1.23, Filter.Types.GT)]}
            />
        );

        validate(Ops, 0, 2, 1, 0, 'gt', "1.23");
    });

    test('datetime field, not equal', () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/Los_Angeles
        const testDate = new Date(datePOSIX);

        render(
            <FilterExpressionView
                field={dateTimeField}
                fieldFilters={[Filter.create('DateTimeField', testDate, Filter.Types.DATE_NOT_EQUAL)]}
            />
        );

        validate(dateOps, 0, 2, 1, 0, 'dateneq', '2020-08-06', undefined, false);
    });

    test('date field, not equal', () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/Los_Angeles
        const testDate = new Date(datePOSIX);

        render(
            <FilterExpressionView
                field={dateField}
                fieldFilters={[Filter.create('DateField', testDate, Filter.Types.DATE_NOT_EQUAL)]}
            />
        );

        validate(dateOps, 0, 2, 1, 0, 'dateneq', '2020-08-06', undefined, false);
    });

    test('boolean field, equal', () => {
        render(<FilterExpressionView field={booleanField} fieldFilters={[Filter.create('BooleanField', 'true')]} />);

        validateFilterTypeDropdown(booleanOps, 0, 'Equals');

        const radios = document.querySelectorAll('input[type="radio"]');

        expect(radios.length).toBe(2);

        expect(radios.item(0).getAttribute('value')).toEqual('true');
        expect(radios.item(0).getAttribute('checked')).toBeDefined();
        expect(radios.item(1).getAttribute('value')).toEqual('false');
        expect(radios.item(1).getAttribute('checked')).toBeNull();
    });

    test('not sole filter, without value', () => {
        render(
            <FilterExpressionView
                field={doubleField}
                fieldFilters={[Filter.create('DoubleField', undefined, Filter.Types.GT)]}
            />
        );
        validate(Ops, 0, 1, 1, 0, 'gt');
    });

    test('between filter missing all values', () => {
        render(
            <FilterExpressionView
                field={intField}
                fieldFilters={[Filter.create('IntField', undefined, Filter.Types.BETWEEN)]}
            />
        );

        validate(Ops, 0, 1, 2, 0, 'between');
    });

    test('between filter missing one value', () => {
        render(
            <FilterExpressionView
                field={intField}
                fieldFilters={[Filter.create('IntField', '1', Filter.Types.BETWEEN)]}
            />
        );

        validate(Ops, 0, 1, 2, 0, 'between', '1');
    });

    test('multiple filters with values', () => {
        render(
            <FilterExpressionView
                field={doubleField}
                fieldFilters={[
                    Filter.create('DoubleField', 3.4, Filter.Types.GT),
                    Filter.create('DoubleField', 8.1, Filter.Types.LT),
                ]}
            />
        );
        validate(
            Ops.filter(op => op !== 'lt'),
            0,
            2,
            2,
            0,
            'gt',
            "3.4"
        );
        const excludedOps = ['gt', 'eq', 'isblank'];
        validate(
            Ops.filter(op => excludedOps.indexOf(op) === -1),
            1,
            2,
            2,
            1,
            'lt',
            "8.1"
        );
    });

    test('multiple filters, no input required', () => {
        render(
            <FilterExpressionView
                field={doubleField}
                fieldFilters={[Filter.create('DoubleField', undefined, Filter.Types.NONBLANK)]}
            />
        );
        validate(Ops, 0, 2, 0, 0, 'isnonblank');
    });

    test('int field, between operator, disabled', () => {
        render(
            <FilterExpressionView
                field={intField}
                fieldFilters={[Filter.create('IntField', '1,200', Filter.Types.BETWEEN)]}
                disabled={true}
            />
        );
        validate(Ops, 0, 2, 2, 0, 'between', '1', '200', true);
    });
});
