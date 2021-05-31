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
import { fromJS, List, Map } from 'immutable';
import { Filter } from '@labkey/api';

import { JsonType } from '@labkey/api/dist/labkey/filter/Types';

import { QueryColumn, QueryGridModel, QueryInfo } from '../../../..';

import mixturesWithAliasesQueryInfo from '../../../../test/data/mixturesWithAliases-getQueryDetails.json';
import mixturesWithAliasesQuery from '../../../../test/data/mixturesWithAliases-getQuery.json';
import { initUnitTests, makeQueryInfo, makeTestData } from '../../../testHelpers';

import { FilterAction, getURLSuffix } from './Filter';
import { ActionOption, ActionValue, Value } from './Action';

let queryInfo: QueryInfo;
let getColumns: () => List<QueryColumn>;

beforeAll(() => {
    initUnitTests();
    const mockData = makeTestData(mixturesWithAliasesQuery);
    queryInfo = makeQueryInfo(mixturesWithAliasesQueryInfo);
    const model = new QueryGridModel({
        queryInfo,
        messages: fromJS(mockData.messages),
        data: fromJS(mockData.rows),
        dataIds: fromJS(mockData.orderedRows),
        totalRows: mockData.rowCount,
    });
    getColumns = (all?) => (all ? model.getAllColumns() : model.getDisplayColumns());
});

const testColumns = List([
    QueryColumn.create({
        name: 'columnA',
        jsonType: 'int',
        lookup: {
            schemaName: 'alphabet',
            queryName: 'x',
            displayColumn: 'LookupX',
            keyColumn: 'LookupX',
            isPublic: true,
        },
        shortCaption: 'A lookup',
    }),
    QueryColumn.create({
        name: 'columnAA',
        jsonType: 'string',
        shortCaption: 'A non-lookup',
    }),
    QueryColumn.create({
        name: 'columnB',
        jsonType: 'int',
        shortCaption: 'Column B',
    }),
]);

const testColumnsByName = testColumns.reduce((map, col) => {
    if (map.has(col.name)) {
        throw 'Invalid test data! All column name\'s must be unique';
    }
    return map.set(col.name, col);
}, Map<string, QueryColumn>());

const expectFilter = (expectedFilter: Filter.IFilter, urlParam: string, urlPrefix?: string) => {
    const filters = Filter.getFiltersFromUrl(urlParam, urlPrefix);
    expect(filters.length).toEqual(1);
    const actualFilter = filters[0];

    expectSameFilterType(expectedFilter.getFilterType(), actualFilter.getFilterType());
    expect(expectedFilter.getColumnName()).toEqual(actualFilter.getColumnName());
    expect(expectedFilter.getValue()).toEqual(actualFilter.getValue());
};

const expectSameFilterType = (a: Filter.IFilterType, b: Filter.IFilterType) => {
    expect(a.getURLSuffix()).toEqual(b.getURLSuffix());
};

describe('FilterAction::completeAction', () => {
    let action;
    const urlPrefix = undefined;
    const completeAction = (tokens: string[], testHandle: (value: Value) => any) => {
        return action.completeAction(tokens).then(testHandle);
    };

    beforeEach(() => {
        // needs to be in beforeEach so it gets instantiated after beforeAll
        action = new FilterAction(urlPrefix, getColumns);
    });

    test('invalid tokens', () => {
        return Promise.all([
            // empty tokens
            completeAction([], value => {
                expect(value.displayValue).toBeUndefined();
                expect(value.isValid).toBe(false);
            }),

            // only contains column
            completeAction(['phrase'], value => {
                expect(value.displayValue).toBeUndefined();
                expect(value.isValid).toBe(false);
            }),

            // only contains column and filter that requires values
            completeAction(['phrase', '='], value => {
                expect(value.displayValue).toBeUndefined();
                expect(value.isValid).toBe(false);
            }),

            // contains invalid filter type
            completeAction(['height', '==', '78'], value => {
                expect(value.displayValue).toBeUndefined();
                expect(value.isValid).toBe(false);
            }),

            // contains incomplete filter type
            completeAction(['height', 'isblan'], value => {
                expect(value.displayValue).toBeUndefined();
                expect(value.isValid).toBe(false);
            }),
        ]);
    });

    test('valid tokens', () => {
        return Promise.all([
            // valid symbol tokens
            completeAction(['Expiration Time', '=<', '10'], value => {
                const expectedFilter = Filter.create('expirationTime', '10', Filter.Types.LESS_THAN_OR_EQUAL);

                expect(value.displayValue).toEqual('Expiration Time =< 10');
                expectFilter(expectedFilter, value.param);
            }),

            // valid urlsuffix tokens
            completeAction(['Extra Test Column', 'isnonblank'], value => {
                const expectedFilter = Filter.create('extraTestColumn', '', Filter.Types.NONBLANK);

                expect(value.displayValue).toEqual('Extra Test Column Is Not Blank');
                expectFilter(expectedFilter, value.param);
            }),

            // valid displayText tokens
            completeAction(['Extra Test Column', 'is blank', 'foo'], value => {
                const expectedFilter = Filter.create('extraTestColumn', '', Filter.Types.ISBLANK);

                expect(value.displayValue).toEqual('Extra Test Column Is Blank'); // sans 'foo'
                expectFilter(expectedFilter, value.param);
            }),
        ]);
    });
});

describe('FilterAction::actionValueFromFilter', () => {
    let action;
    const urlPrefix = undefined;

    beforeEach(() => {
        // needs to be in beforeEach so it gets instantiated after beforeAll
        action = new FilterAction(urlPrefix, getColumns);
    });

    // TODO add tests for various value options
    test('no label, unencoded column', () => {
        const filter = Filter.create('colName', '10', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter);
        expect(value.displayValue).toBe('colName = 10');
        expect(value.value).toBe('"colName" = 10');
    });

    test('no label, encoded column', () => {
        const filter = Filter.create('U mg$SL', '10', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter);
        expect(value.displayValue).toBe('U mg/L = 10');
        expect(value.value).toBe('"U mg$SL" = 10');
    });

    test('with label', () => {
        const filter = Filter.create('U mgS$L', 'x', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter, 'otherLabel');
        expect(value.displayValue).toBe('otherLabel = x');
        expect(value.value).toBe('"otherLabel" = x');
    });
});

describe('FilterAction::fetchOptions', () => {
    let action;
    const urlPrefix = undefined;
    const fetchOptions = (tokens: string[], uniqueValues: List<any>, testHandle: (options: ActionOption[]) => any) => {
        return action.fetchOptions(tokens, uniqueValues).then(testHandle);
    };

    beforeEach(() => {
        // needs to be in beforeEach so it gets instantiated after beforeAll
        action = new FilterAction(urlPrefix, getColumns);
    });

    test('column options', () => {
        return Promise.all([
            // nothing entered -- should display all available columns that are not multi-valued
            fetchOptions([], undefined, options => {
                const filteredColumns = getColumns().filter(column => !column.multiValue);
                expect(options.length).toEqual(filteredColumns.size);

                // none should complete the action
                expect(options.map(o => o.isComplete)).toEqual(filteredColumns.map(c => false).toArray());
            }),

            // no matches -- should display nothing
            fetchOptions(['qwerty'], undefined, options => {
                expect(options.length).toEqual(0);
            }),
        ]);
    });

    test('filter options', () => {
        const getExpectedFilterTypes = (columnType: string): Filter.IFilterType[] => {
            return Filter.getFilterTypesForType(columnType as JsonType).filter(
                ft => !ft.isMultiValued() && (ft.getDisplaySymbol() || getURLSuffix(ft))
            );
        };

        return Promise.all([
            // should display all available non-multivalue filter types
            fetchOptions(['Name', ''], undefined, options => {
                const expectedFilters = getExpectedFilterTypes('string');
                expect(options.length).toEqual(expectedFilters.length);
            }),

            // match against symbol
            fetchOptions(['Name', '='], List(['1', '2', '3']), options => {
                expect(options.length).toEqual(3);
            }),

            // match against displayText
            fetchOptions(['Name', 'is '], undefined, options => {
                expect(options.length).toEqual(2);
                expect(options[0].value).toEqual(`"${Filter.Types.ISBLANK.getDisplayText().toLowerCase()}"`);
                expect(options[1].value).toEqual(`"${Filter.Types.NONBLANK.getDisplayText().toLowerCase()}"`);
            }),

            fetchOptions(undefined, undefined, options => {
                expect(options.length).toEqual(5);
                expect(options.filter(option => option.value == 'Alias')).toHaveLength(0);
            }),
        ]);
    });
});

describe('FilterAction::parseTokens', () => {
    test('empty tokens', () => {
        expect(FilterAction.parseTokens(undefined, testColumns).columnName).toBeUndefined();
        expect(FilterAction.parseTokens(null, testColumns).columnName).toBeUndefined();
        expect(FilterAction.parseTokens([], testColumns).columnName).toBeUndefined();
    });

    test('parsing column', () => {
        // should not partially match
        let context = FilterAction.parseTokens(['column', 'b', '='], testColumns);
        expect(context.columnName).toBe('column');
        expect(context.column).toBeUndefined();

        // match against "name"
        context = FilterAction.parseTokens(['columna', 'x', 'y', 'z'], testColumns);
        expect(context.columnName).toBe('columna');
        expect(context.column).toEqual(testColumnsByName.get('columnA'));

        // match against "shortCaption"
        context = FilterAction.parseTokens(['A non-lookup', 'x', 'y', 'z'], testColumns);
        expect(context.columnName).toBe('A non-lookup');
        expect(context.column).toEqual(testColumnsByName.get('columnAA'));

        // match against lookup
        context = FilterAction.parseTokens(['Columna/', 'x'], testColumns);
        expect(context.columnName).toBe('Columna/');
        expect(context.column).toEqual(testColumnsByName.get('columnA'));
    });

    test('parsing filterTypes', () => {
        // filter filterType should not match if column/token DNE
        expect(FilterAction.parseTokens(['ColumnC'], testColumns).filterTypes.length).toBe(0);
        expect(FilterAction.parseTokens(['ColumnC', '='], testColumns).filterTypes.length).toBe(0);

        // filters filterType based on symbol
        let context = FilterAction.parseTokens(['ColumnB', '='], testColumns);
        expect(context.column).toEqual(testColumnsByName.get('columnB'));

        const expected = [Filter.Types.EQUAL, Filter.Types.LESS_THAN_OR_EQUAL];
        const actual = context.filterTypes;

        expect(actual.length).toEqual(expected.length);
        for (let i = 0; i < expected.length; i++) {
            expectSameFilterType(actual[i], expected[i]);
        }
        expectSameFilterType(context.activeFilterType, Filter.Types.EQUAL);

        // filters filterType based on URL suffix
        context = FilterAction.parseTokens(['ColumnB', 'isblank'], testColumns);
        expect(context.column).toEqual(testColumnsByName.get('columnB'));
        expectSameFilterType(context.activeFilterType, Filter.Types.ISBLANK);

        // filters filterType based on display text
        context = FilterAction.parseTokens(['A non-lookup', 'is blank', 'value', 'with spaces'], testColumns);
        expect(context.column).toEqual(testColumnsByName.get('columnAA'));
        expectSameFilterType(context.activeFilterType, Filter.Types.ISBLANK);
        expect(context.rawValue).toEqual('value with spaces');
    });
});
