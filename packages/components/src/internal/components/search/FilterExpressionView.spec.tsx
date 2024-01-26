import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Filter } from '@labkey/api';

import { QueryColumn } from '../../../public/QueryColumn';
import {
    BOOLEAN_TYPE,
    DATE_TYPE, DATETIME_TYPE,
    DOUBLE_TYPE,
    INTEGER_TYPE,
    TEXT_TYPE,
    TIME_TYPE
} from '../domainproperties/PropDescType';
import { SelectInput } from '../forms/input/SelectInput';

import { FilterExpressionView } from './FilterExpressionView';

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
        },
    };
});

describe('FilterExpressionView', () => {
    function validate(
        wrapper: ReactWrapper,
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
        expect(wrapper.find(SelectInput)).toHaveLength(numFilters);
        validateFilterTypeDropdown(wrapper, operators, filterIndex, selectedOp);

        const filterInputs = wrapper.find('input.filter-expression__input');

        expect(filterInputs.length).toEqual(inputCount);

        if (firstInputValue) {
            expect(filterInputs.at(inputOffset).props()['value']).toEqual(firstInputValue);
            expect(filterInputs.at(inputOffset).props()['disabled']).toEqual(disabled);
        }

        if (secondInputValue) {
            expect(filterInputs.at(inputOffset + 1).props()['value']).toEqual(secondInputValue);
            expect(filterInputs.at(inputOffset + 1).props()['disabled']).toEqual(disabled);
        }
    }

    function validateFilterTypeDropdown(
        wrapper: ReactWrapper,
        operators: string[],
        filterIndex: number,
        selectedOp?: string
    ): void {
        const selectInput = wrapper.find(SelectInput).at(filterIndex);
        const options = selectInput.props()['options'];
        const selectedFilter = selectInput.props()['value'];
        if (selectedOp) expect(selectedFilter).toEqual(selectedOp);
        else expect(selectedFilter).toEqual('contains');

        const ops = [];
        options.map(op => ops.push(op['value']));
        expect(ops).toEqual(operators);
    }

    test('string field, no filter selected', () => {
        const wrapper = mount(<FilterExpressionView field={stringField} fieldFilters={null} />);

        validateFilterTypeDropdown(wrapper, StringOps, 0, null);

        wrapper.unmount();
    });

    test('string field, equals operator', () => {
        const wrapper = mount(
            <FilterExpressionView
                field={stringField}
                fieldFilters={[Filter.create('StringField', 'ABC', Filter.Types.Equals)]}
            />
        );

        validate(wrapper, StringOps, 0, 1, 1, 0, 'eq', 'ABC');
        wrapper.unmount();
    });

    test('int field, between operator', () => {
        const wrapper = mount(
            <FilterExpressionView
                field={intField}
                fieldFilters={[Filter.create('IntField', '1,200', Filter.Types.BETWEEN)]}
            />
        );

        validate(wrapper, Ops, 0, 2, 2, 0, 'between', '1', '200');
        wrapper.unmount();
    });

    test('int field, no filter selected',  () => {
        const wrapper = mount(
            <FilterExpressionView
                field={intField}
                fieldFilters={null}
            />
        );

        validateFilterTypeDropdown(wrapper, Ops, 0, Ops[0]);
        wrapper.unmount();
    });

    test('double field, greater than operator', () => {
        const wrapper = mount(
            <FilterExpressionView
                field={doubleField}
                fieldFilters={[Filter.create('DoubleField', 1.23, Filter.Types.GT)]}
            />
        );

        validate(wrapper, Ops, 0, 2, 1, 0, 'gt', 1.23);
        wrapper.unmount();
    });

    test('datetime field, not equal', () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/Los_Angeles
        const testDate = new Date(datePOSIX);

        const wrapper = mount(
            <FilterExpressionView
                field={dateTimeField}
                fieldFilters={[Filter.create('DateTimeField', testDate, Filter.Types.DATE_NOT_EQUAL)]}
            />
        );

        validate(wrapper, dateOps, 0, 2, 1, 0, 'dateneq', '2020-08-06', undefined, false);
        wrapper.unmount();
    });

    test('date field, not equal', () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/Los_Angeles
        const testDate = new Date(datePOSIX);

        const wrapper = mount(
            <FilterExpressionView
                field={dateField}
                fieldFilters={[Filter.create('DateField', testDate, Filter.Types.DATE_NOT_EQUAL)]}
            />
        );

        validate(wrapper, dateOps, 0, 2, 1, 0, 'dateneq', '2020-08-06', undefined, false);
        wrapper.unmount();
    });

    test('boolean field, equal', () => {
        const wrapper = mount(
            <FilterExpressionView field={booleanField} fieldFilters={[Filter.create('BooleanField', 'true')]} />
        );

        validateFilterTypeDropdown(wrapper, booleanOps, 0, 'eq');

        const radios = wrapper.find('input[type="radio"]');

        expect(radios.length).toBe(2);

        expect(radios.at(0).props()['value']).toEqual('true');
        expect(radios.at(0).props()['checked']).toEqual(true);
        expect(radios.at(1).props()['value']).toEqual('false');
        expect(radios.at(1).props()['checked']).toEqual(false);

        wrapper.unmount();
    });

    test('not sole filter, without value', () => {
        const wrapper = mount(
            <FilterExpressionView
                field={doubleField}
                fieldFilters={[Filter.create('DoubleField', undefined, Filter.Types.GT)]}
            />
        );
        validate(wrapper, Ops, 0, 1, 1, 0, 'gt');
        wrapper.unmount();
    });

    test('between filter missing all values', () => {
        const wrapper = mount(
            <FilterExpressionView
                field={intField}
                fieldFilters={[Filter.create('IntField', undefined, Filter.Types.BETWEEN)]}
            />
        );

        validate(wrapper, Ops, 0, 1, 2, 0, 'between');
        wrapper.unmount();
    });

    test('between filter missing one value', () => {
        const wrapper = mount(
            <FilterExpressionView
                field={intField}
                fieldFilters={[Filter.create('IntField', '1', Filter.Types.BETWEEN)]}
            />
        );

        validate(wrapper, Ops, 0, 1, 2, 0, 'between', '1');
        wrapper.unmount();
    });

    test('multiple filters with values', () => {
        const wrapper = mount(
            <FilterExpressionView
                field={doubleField}
                fieldFilters={[
                    Filter.create('DoubleField', 3.4, Filter.Types.GT),
                    Filter.create('DoubleField', 8.1, Filter.Types.LT),
                ]}
            />
        );
        validate(
            wrapper,
            Ops.filter(op => op !== 'lt'),
            0,
            2,
            2,
            0,
            'gt',
            3.4
        );
        const excludedOps = ['gt', 'eq', 'isblank'];
        validate(
            wrapper,
            Ops.filter(op => excludedOps.indexOf(op) === -1),
            1,
            2,
            2,
            1,
            'lt',
            8.1
        );
        wrapper.unmount();
    });

    test('multiple filters, no input required', () => {
        const wrapper = mount(
            <FilterExpressionView
                field={doubleField}
                fieldFilters={[Filter.create('DoubleField', undefined, Filter.Types.NONBLANK)]}
            />
        );
        validate(wrapper, Ops, 0, 2, 0, 0, 'isnonblank');
        wrapper.unmount();
    });

    test('int field, between operator, disabled', () => {
        const wrapper = mount(
            <FilterExpressionView
                field={intField}
                fieldFilters={[Filter.create('IntField', '1,200', Filter.Types.BETWEEN)]}
                disabled={true}
            />
        );

        validate(wrapper, Ops, 0, 2, 2, 0, 'between', '1', '200', true);
        wrapper.unmount();
    });
});
