import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Filter } from "@labkey/api";

import { FilterExpressionView } from './FilterExpressionView';
import { QueryColumn } from "../../../public/QueryColumn";
import {
    BOOLEAN_TYPE,
    DATE_TYPE,
    DOUBLE_TYPE,
    INTEGER_TYPE,
    TEXT_TYPE
} from "../domainproperties/PropDescType";
import { SelectInput } from "../forms/input/SelectInput";

const stringField = QueryColumn.create({ name: 'StringField', rangeURI: TEXT_TYPE.rangeURI, jsonType: 'string' });
const doubleField = QueryColumn.create({ name: 'DoubleField', rangeURI: DOUBLE_TYPE.rangeURI, jsonType: 'float' });
const intField = QueryColumn.create({ name: 'IntField', rangeURI: INTEGER_TYPE.rangeURI, jsonType: 'int' });
const booleanField = QueryColumn.create({ name: 'BooleanField', rangeURI: BOOLEAN_TYPE.rangeURI, jsonType: 'boolean' });
const dateField = QueryColumn.create({ name: 'DateField', rangeURI: DATE_TYPE.rangeURI, jsonType: 'date' });

const Ops = ["any",
    "eq",
    "neqornull",
    "isblank",
    "isnonblank",
    "gt",
    "lt",
    "gte",
    "lte",
    "in",
    "notin",
    "between",
    "notbetween"];

const dateOps = ["any",
    "dateeq",
    "dateneq",
    "isblank",
    "isnonblank",
    "dategt",
    "datelt",
    "dategte",
    "datelte",
    "between",
    "notbetween"];

const booleanOps = [
    "any",
    "eq",
    "neqornull",
    "isblank",
    "isnonblank",
];

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

    function validate(wrapper: ReactWrapper, operators: string[], inputCount: number = 0, selectedOp?: string, firstInputValue?: any, secondInputValue?: any)
    {
        validateFilterTypeDropdown(wrapper, operators, selectedOp);

        const filterInputs = wrapper.find('input.search-filter__input');

        expect(filterInputs.length).toEqual(inputCount);

        if (firstInputValue)
            expect(filterInputs.at(0).props()['value']).toEqual(firstInputValue);

        if (secondInputValue)
            expect(filterInputs.at(1).props()['value']).toEqual(secondInputValue);

    }

    function validateFilterTypeDropdown(wrapper: ReactWrapper, operators: string[], selectedOp?: string) {
        const selectInput = wrapper.find(SelectInput);
        const options = selectInput.props()['options'];
        const selectedFilter = selectInput.props()['value'];
        if (selectedOp)
            expect(selectedFilter).toEqual(selectedOp);
        else
            expect(selectedFilter == null).toBeTruthy();

        const ops = [];
        options.map(op => ops.push(op['value']));
        expect(ops).toEqual(operators);
    }

    test("string field, no filter selected", () => {
        const wrapper = mount(
            <FilterExpressionView
                field={stringField}
                fieldFilter={null}
                notFormsy={true}
            />
        );

        validateFilterTypeDropdown(wrapper, Ops,null);

        wrapper.unmount();
    });

    test("string field, 'has any value' operator", () => {
        const wrapper = mount(
            <FilterExpressionView
                field={stringField}
                fieldFilter={Filter.create('StringField', null, Filter.Types.HAS_ANY_VALUE)}
                notFormsy={true}
            />
        );

        validate(wrapper, Ops, 0, 'any');

        wrapper.unmount();
    });

    test('string field, equals operator', async () => {
        const wrapper = mount(
            <FilterExpressionView
                field={stringField}
                fieldFilter={Filter.create('StringField', 'ABC', Filter.Types.Equals)}
                notFormsy={true}
            />
        );

        validate(wrapper, Ops, 1, 'eq', 'ABC');
        wrapper.unmount();
    });

    test('int field, between operator', async () => {
        const wrapper = mount(
            <FilterExpressionView
                field={intField}
                fieldFilter={Filter.create('IntField', '1,200', Filter.Types.BETWEEN)}
                notFormsy={true}
            />
        );

        validate(wrapper, Ops, 2, 'between', '1', '200');
        wrapper.unmount();
    });

    test('double field, greater than operator', async () => {
        const wrapper = mount(
            <FilterExpressionView
                field={doubleField}
                fieldFilter={Filter.create('DoubleField', 1.23, Filter.Types.GT)}
                notFormsy={true}
            />
        );

        validate(wrapper, Ops, 1, 'gt', 1.23 );
        wrapper.unmount();
    });

    test('date field, not equal', async () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/PST
        const testDate = new Date(datePOSIX);

        const wrapper = mount(
            <FilterExpressionView
                field={dateField}
                fieldFilter={Filter.create('DateField', testDate, Filter.Types.DATE_NOT_EQUAL)}
                notFormsy={true}
            />
        );

        validate(wrapper, dateOps, 1, 'dateneq', '2020-08-06');
        wrapper.unmount();
    });

    test('boolean field, equal', async () => {
        const wrapper = mount(
            <FilterExpressionView
                field={booleanField}
                fieldFilter={Filter.create('BooleanField', 'true')}
                notFormsy={true}
            />
        );

        validateFilterTypeDropdown(wrapper, booleanOps, 'eq');

        const radios = wrapper
            .find('input[type="radio"]');

        expect(radios.length).toBe(2);

        expect(radios.at(0).props()['value']).toEqual('true');
        expect(radios.at(0).props()['checked']).toEqual(true);
        expect(radios.at(1).props()['value']).toEqual('false');
        expect(radios.at(1).props()['checked']).toEqual(false);

        wrapper.unmount();
    });


});
