import { fromJS } from 'immutable';
import { Filter } from '@labkey/api';

import { QueryInfo } from '../../../public/QueryInfo';
import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn } from '../../../public/QueryColumn';

import { buildValueFilter, findNotFoundValues, parseSelectedQuery, QuerySelectModel, queryColumnNames } from './model';

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
        const EMPTY_ITEMS = fromJS({});

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
            const selectedItems = fromJS({ one: { id: { value: 'x' } }, two: { id: { value: 'z' } } });
            expect(findNotFoundValues(selectedItems, filter(['x', 'y', 'z']), 'id')).toEqual(['y']);
        });

        test('returns empty array when all values are found in selected items', () => {
            const selectedAll = fromJS({
                one: { id: { value: 'x' } },
                two: { id: { value: 'y' } },
                three: { id: { value: 'z' } },
            });
            expect(findNotFoundValues(selectedAll, filter(['x', 'y', 'z']), 'id')).toEqual([]);
        });

        test('handles mixed types and converts to string for comparison', () => {
            const mixedItems = fromJS({ one: { id: { value: 1 } }, two: { id: { value: 3 } } });
            expect(findNotFoundValues(mixedItems, filter([1, 2, 3]), 'id')).toEqual(['2']);
        });

        test('ignores items missing the valueColumn', () => {
            const incompleteItems = fromJS({
                one: { id: { value: 'x' } },
                two: { other: { value: 'y' } }, // missing 'id'
            });
            expect(findNotFoundValues(incompleteItems, filter(['x', 'y']), 'id')).toEqual(['y']);
        });

        test('ignores null or undefined item values', () => {
            const nullItemValues = fromJS({
                one: { id: { value: 'x' } },
                two: { id: { value: null } },
                three: { id: { value: undefined } },
            });
            expect(findNotFoundValues(nullItemValues, filter(['x', 'y']), 'id')).toEqual(['y']);
        });

        test('handles duplicate values in filter input', () => {
            expect(findNotFoundValues(EMPTY_ITEMS, filter(['a', 'a', 'b']), 'id')).toEqual(['a', 'b']);
        });

        test('handles mixed string/number types across filters and item values', () => {
            const mixedTypes = fromJS({ one: { id: { value: '1' } }, two: { id: { value: 2 } } });
            expect(findNotFoundValues(mixedTypes, filter([1, 2, 3]), 'id')).toEqual(['3']);
        });
    });
});
