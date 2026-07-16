/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS, List } from 'immutable';
import { Filter } from '@labkey/api';

import { QueryInfo } from '../../../public/QueryInfo';
import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn } from '../../../public/QueryColumn';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { ISelectRowsResult, selectRowsDeprecated } from '../../query/api';

import {
    buildValueFilter,
    fetchSelectedValues,
    findNotFoundValues,
    parseRawValue,
    parseSelectedQuery,
    queryColumnNames,
    QuerySelectModel,
    setSelection,
    setSelectionWithResults,
    valuesAreLoaded,
} from './model';

jest.mock('../../query/api', () => ({
    ...jest.requireActual('../../query/api'),
    selectRowsDeprecated: jest.fn(),
}));

describe('form actions', () => {
    const setSelectionModel = new QuerySelectModel({
        displayColumn: 'DATA',
        id: 'selection',
        isInit: true,
    });

    const searchResults2 = fromJS({
        '789': {
            DATA: {
                value: 'C-1',
            },
        },
    });

    const searchResults3 = fromJS({
        '123': {
            DATA: {
                value: 'A-1',
            },
            NAME: {
                value: 'Ron Swanson',
            },
        },

        '456': {
            DATA: {
                value: 'B-1',
            },
            NAME: {
                value: 'Swan Ronson',
            },
        },
    });

    test('Should parse a selected query', () => {
        const parsed = parseSelectedQuery(setSelectionModel, searchResults2);

        const parsedSelectionModel = new QuerySelectModel({
            displayColumn: 'NAME',
            delimiter: ';',
        });

        const parsed2 = parseSelectedQuery(parsedSelectionModel, searchResults3);

        expect(parsed).toBe('C-1');
        expect(parsed2).toBe('Ron Swanson;Swan Ronson');
    });

    test('queryColumnNames', () => {
        const displayColumn = 'display';
        const valueColumn = 'value';
        let queryInfo = new QueryInfo({ pkCols: ['pkCol1', 'pkCol2'] });
        expect(queryColumnNames(queryInfo, displayColumn, valueColumn, [], undefined).sort()).toEqual([
            displayColumn,
            'pkCol1',
            'pkCol2',
            valueColumn,
        ]);

        const lookupColumn = 'colA';
        queryInfo = queryInfo.mutate({
            columns: new ExtendedMap({
                [lookupColumn]: new QueryColumn({ fieldKey: lookupColumn, shownInLookupView: true }),
            }),
        });
        expect(queryColumnNames(queryInfo, displayColumn, valueColumn, [], undefined).sort()).toEqual([
            'colA',
            displayColumn,
            'pkCol1',
            'pkCol2',
            valueColumn,
        ]);

        const groupByColumn = 'grouper';
        const someRequiredColumn = `${valueColumn}/${displayColumn}`;
        expect(
            queryColumnNames(
                queryInfo,
                displayColumn,
                valueColumn,
                [displayColumn, someRequiredColumn, valueColumn],
                groupByColumn
            ).sort()
        ).toEqual(['colA', displayColumn, groupByColumn, 'pkCol1', 'pkCol2', valueColumn, someRequiredColumn]);
    });

    describe('buildValueFilter', () => {
        const col = 'id';
        const delimiter = ',';

        test('handles single non-array, non-string value with multiple = false', () => {
            const result = buildValueFilter('abc', col, false, delimiter);
            expect(result.expectedValueCount).toBe(1);
            expect(result.filter.getValue()).toBe('abc');
            expect(result.filter.getColumnName()).toBe(col);
        });

        test('handles array input when multiple = true', () => {
            const result = buildValueFilter(['a', 'b', 'b'], col, true, delimiter);
            expect(result.expectedValueCount).toBe(2); // unique values
            expect(result.filter.getValue()).toEqual(['a', 'b', 'b']);
            expect(result.filter.getColumnName()).toBe(col);
        });

        test('handles delimited string input when multiple = true', () => {
            const result = buildValueFilter('x,y,y,z', col, true, ',');
            expect(result.expectedValueCount).toBe(3);
            expect(result.filter.getValue()).toEqual(['x', 'y', 'y', 'z']);
        });

        test('handles string value when multiple = false', () => {
            const result = buildValueFilter('foo', col, false, delimiter);
            expect(result.expectedValueCount).toBe(1);
            expect(result.filter.getValue()).toBe('foo');
        });

        test('handles non-string scalar values correctly', () => {
            const result = buildValueFilter(123, col, false, delimiter);
            expect(result.expectedValueCount).toBe(1);
            expect(result.filter.getValue()).toBe(123);
        });

        test('defaults to non-IN filter if multiple = true but value is not string or array', () => {
            const result = buildValueFilter(true, col, true, delimiter);
            expect(result.expectedValueCount).toBe(1);
            expect(result.filter.getValue()).toBe(true);
        });
    });

    describe('findNotFoundValues', () => {
        const EMPTY_ITEMS = {};

        function filter(value: any): Filter.IFilter {
            return Filter.create('col', value, Filter.Types.IN);
        }

        test('returns empty array when filter value is undefined or null', () => {
            expect(findNotFoundValues(EMPTY_ITEMS, filter(undefined), 'id')).toHaveLength(0);
            expect(findNotFoundValues(EMPTY_ITEMS, filter(null), 'id')).toHaveLength(0);
            expect(findNotFoundValues(EMPTY_ITEMS, filter([undefined, null]), 'id')).toHaveLength(0);
        });

        test('returns single value as array when filter has a single value', () => {
            expect(findNotFoundValues(EMPTY_ITEMS, filter('abc'), 'id')).toEqual(['abc']);
            expect(findNotFoundValues(EMPTY_ITEMS, filter(['abc']), 'id')).toEqual(['abc']);
        });

        test('returns all values when no items are selected', () => {
            const filterValues = ['x', 'y', 'z'];
            expect(findNotFoundValues(EMPTY_ITEMS, filter(filterValues), 'id')).toEqual(filterValues);
        });

        test('returns missing values when some items are matched', () => {
            const selectedItems = { one: { id: { value: 'x' } }, two: { id: { value: 'z' } } };
            expect(findNotFoundValues(selectedItems, filter(['x', 'y', 'z']), 'id')).toEqual(['y']);
        });

        test('returns empty array when all values are found in selected items', () => {
            const selectedAll = {
                one: { id: { value: 'x' } },
                two: { id: { value: 'y' } },
                three: { id: { value: 'z' } },
            };
            expect(findNotFoundValues(selectedAll, filter(['x', 'y', 'z']), 'id')).toEqual([]);
        });

        test('handles mixed types and converts to string for comparison', () => {
            const mixedItems = { one: { id: { value: 1 } }, two: { id: { value: 3 } } };
            expect(findNotFoundValues(mixedItems, filter([1, 2, 3]), 'id')).toEqual(['2']);
        });

        test('ignores items missing the valueColumn', () => {
            const incompleteItems = {
                one: { id: { value: 'x' } },
                two: { other: { value: 'y' } }, // missing 'id'
            };
            expect(findNotFoundValues(incompleteItems, filter(['x', 'y']), 'id')).toEqual(['y']);
        });

        test('ignores null or undefined item values', () => {
            const nullItemValues = {
                one: { id: { value: 'x' } },
                two: { id: { value: null } },
                three: { id: { value: undefined } },
            };
            expect(findNotFoundValues(nullItemValues, filter(['x', 'y']), 'id')).toEqual(['y']);
        });

        test('handles duplicate values in filter input', () => {
            expect(findNotFoundValues(EMPTY_ITEMS, filter(['a', 'a', 'b']), 'id')).toEqual(['a', 'b']);
        });

        test('handles mixed string/number types across filters and item values', () => {
            const mixedTypes = { one: { id: { value: '1' } }, two: { id: { value: 2 } } };
            expect(findNotFoundValues(mixedTypes, filter([1, 2, 3]), 'id')).toEqual(['3']);
        });
    });

    describe('parseRawValue', () => {
        test('empty values', () => {
            expect(parseRawValue(undefined, false, ',')).toEqual([]);
            expect(parseRawValue(null, true, ',')).toEqual([]);
            expect(parseRawValue('', true, ',')).toEqual([]);
        });

        test('scalar values', () => {
            expect(parseRawValue(5, false, ',')).toEqual([5]);
            expect(parseRawValue('word', false, ',')).toEqual(['word']);
            expect(parseRawValue(false, false, ',')).toEqual([false]);
        });

        test('array and List values', () => {
            expect(parseRawValue([1, 2], true, ',')).toEqual([1, 2]);
            expect(parseRawValue(List([1, 2]), true, ',')).toEqual([1, 2]);
        });

        test('delimited string values', () => {
            expect(parseRawValue('a,b', true, ',')).toEqual(['a', 'b']);
            expect(parseRawValue('a;b', true, ';')).toEqual(['a', 'b']);
            // when not multiple, strings are not split
            expect(parseRawValue('a,b', false, ',')).toEqual(['a,b']);
        });
    });

    const loadedResults = fromJS({
        '1': { RowId: { value: 1 }, Name: { value: 'Alpha' } },
        '2': { RowId: { value: 2 }, Name: { value: 'Beta' } },
    });

    const singleModel = new QuerySelectModel({
        allResults: loadedResults,
        delimiter: ',',
        displayColumn: 'Name',
        isInit: true,
        valueColumn: 'RowId',
    });

    const multiModel = singleModel.merge({ multiple: true }) as QuerySelectModel;

    const KEY = new SchemaQuery('test', 'query').getKey();

    function makeResult(rows: Record<string, any>): ISelectRowsResult {
        return {
            key: KEY,
            models: { [KEY]: rows },
            orderedModels: List(Object.keys(rows)),
            queries: {},
            rowCount: Object.keys(rows).length,
        };
    }

    describe('valuesAreLoaded', () => {
        test('empty value', () => {
            expect(valuesAreLoaded(singleModel, undefined)).toBe(true);
            expect(valuesAreLoaded(singleModel, null)).toBe(true);
            expect(valuesAreLoaded(singleModel, '')).toBe(true);
        });

        test('single value', () => {
            expect(valuesAreLoaded(singleModel, 1)).toBe(true);
            expect(valuesAreLoaded(singleModel, '1')).toBe(true);
            expect(valuesAreLoaded(singleModel, 3)).toBe(false);
        });

        test('multiple values', () => {
            expect(valuesAreLoaded(multiModel, [1, 2])).toBe(true);
            expect(valuesAreLoaded(multiModel, '1,2')).toBe(true);
            expect(valuesAreLoaded(multiModel, [1, 3])).toBe(false);
            expect(valuesAreLoaded(multiModel, '1,3')).toBe(false);
        });

        test('resolves against selectedItems', () => {
            const model = new QuerySelectModel({
                delimiter: ',',
                displayColumn: 'Name',
                isInit: true,
                selectedItems: fromJS({ '9': { RowId: { value: 9 }, Name: { value: 'Iota' } } }),
                valueColumn: 'RowId',
            });
            expect(valuesAreLoaded(model, 9)).toBe(true);
            expect(valuesAreLoaded(model, 1)).toBe(false);
        });
    });

    describe('setSelection', () => {
        test('resolves single value across types', () => {
            const model = setSelection(singleModel, '2');
            expect(model.rawSelectedValue).toBe('2');
            expect(model.selectedItems.size).toBe(1);
            expect(model.selectedItems.getIn(['2', 'RowId', 'value'])).toBe(2);
            expect(model.selectedQuery).toBe('Beta');
        });

        test('clears selection', () => {
            const model = setSelection(setSelection(singleModel, 1), undefined);
            expect(model.selectedItems.size).toBe(0);
            expect(model.selectedQuery).toBe('');
        });
    });

    describe('setSelectionWithResults', () => {
        const gammaRow = { RowId: { value: 3 }, Name: { value: 'Gamma' } };

        test('single value not previously loaded', () => {
            const model = setSelectionWithResults(singleModel, makeResult({ '3': gammaRow }), 3, true);

            expect(model.rawSelectedValue).toBe(3);
            expect(model.allResults.size).toBe(3);
            expect(model.selectedItems.size).toBe(1);
            expect(model.selectedItems.getIn(['3', 'Name', 'value'])).toBe('Gamma');
            expect(model.selectedQuery).toBe('Gamma');
        });

        test('multiple values appended to loaded values', () => {
            const model = setSelectionWithResults(multiModel, makeResult({ '3': gammaRow }), '1,3', true);

            expect(model.rawSelectedValue).toBe('1,3');
            expect(model.allResults.size).toBe(3);
            expect(model.selectedItems.size).toBe(2);
            expect(model.selectedQuery).toBe('Alpha,Gamma');
            // The previously loaded row resolves locally and is not marked as "not found"
            expect(model.selectedItems.getIn(['1', 'RowId', 'notFound'])).toBeUndefined();
        });

        test('unresolved value marked as not found', () => {
            const model = setSelectionWithResults(singleModel, makeResult({}), 99, true);

            expect(model.rawSelectedValue).toBe(99);
            expect(model.selectedItems.size).toBe(1);
            expect(model.selectedItems.getIn(['99', 'RowId', 'notFound'])).toBe(true);
            expect(model.selectedItems.getIn(['99', 'RowId', 'displayValue'])).toBe('<99>');
        });

        test('unresolved value skipped when notFoundValuesEnabled is false', () => {
            const model = setSelectionWithResults(singleModel, makeResult({}), 99, false);

            expect(model.rawSelectedValue).toBe(99);
            expect(model.selectedItems.size).toBe(0);
        });

        test('partially resolved multiple values', () => {
            const model = setSelectionWithResults(multiModel, makeResult({ '3': gammaRow }), '3,99', true);

            expect(model.selectedItems.size).toBe(2);
            expect(model.selectedItems.getIn(['3', 'Name', 'value'])).toBe('Gamma');
            expect(model.selectedItems.getIn(['99', 'RowId', 'notFound'])).toBe(true);
        });
    });

    describe('fetchSelectedValues', () => {
        const selectRowsDeprecatedMock = selectRowsDeprecated as jest.Mock;

        const fetchModel = singleModel.merge({
            containerPath: '/Fetch/Test',
            queryInfo: new QueryInfo({ pkCols: ['RowId'] }),
            schemaQuery: new SchemaQuery('exp', 'samples'),
        }) as QuerySelectModel;

        beforeEach(() => {
            selectRowsDeprecatedMock.mockReset();
            selectRowsDeprecatedMock.mockResolvedValue(makeResult({}));
        });

        test('single value', async () => {
            await fetchSelectedValues(fetchModel, 3);

            expect(selectRowsDeprecatedMock).toHaveBeenCalledTimes(1);
            const options = selectRowsDeprecatedMock.mock.calls[0][0];
            expect(options.schemaName).toBe('exp');
            expect(options.queryName).toBe('samples');
            expect(options.containerPath).toBe('/Fetch/Test');
            expect(options.columns).toEqual(expect.arrayContaining(['RowId', 'Name']));
            expect(options.filterArray).toHaveLength(1);
            expect(options.filterArray[0].getColumnName()).toBe('RowId');
            expect(options.filterArray[0].getValue()).toBe(3);
        });

        test('multiple values with queryFilters', async () => {
            const model = fetchModel.merge({
                multiple: true,
                queryFilters: List([Filter.create('Status', 'Active')]),
            }) as QuerySelectModel;

            await fetchSelectedValues(model, [1, 3]);

            const options = selectRowsDeprecatedMock.mock.calls[0][0];
            expect(options.filterArray).toHaveLength(2);
            expect(options.filterArray[0].getColumnName()).toBe('Status');
            expect(options.filterArray[1].getColumnName()).toBe('RowId');
            expect(options.filterArray[1].getValue()).toEqual([1, 3]);
            expect(options.filterArray[1].getFilterType().getURLSuffix()).toBe(Filter.Types.IN.getURLSuffix());
        });
    });
});
