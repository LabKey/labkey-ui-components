import { GRID_CHECKBOX_OPTIONS, LoadingState, QueryInfo, QuerySort, SchemaQuery } from '../..';
import { initUnitTests, makeQueryInfo } from '../../internal/testHelpers';
import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';

import { QueryConfig, QueryModel } from './QueryModel';

const SCHEMA_QUERY = SchemaQuery.create('exp.data', 'mixtures');
let QUERY_INFO: QueryInfo;
const ROWS = {
    '0': {
        RowId: { value: 0 },
        Data: { value: 100 },
    },
    '1': {
        RowId: { value: 1 },
        Data: { values: 200 },
    },
};
const ORDERED_ROWS = ['0', '1'];

beforeAll(() => {
    initUnitTests();
    // Have to instantiate QUERY_INFO here because it relies on initQueryGridState being called first.
    QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
});

describe('QueryModel', () => {
    test('Instantiate Model no SchemaQuery', () => {
        expect(() => {
            new QueryModel({} as QueryConfig);
        }).toThrow('schemaQuery is required to instantiate a QueryModel');
    });

    test('SchemaQuery', () => {
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY });
        expect(model.schemaName).toEqual('exp.data');
        expect(model.queryName).toEqual('mixtures');
        expect(model.viewName).toEqual(undefined);
        // Auto-generated model ids are based off of the SchemaQuery in the QueryConfig
        expect(model.id).toEqual('exp.data.mixtures');
        const schemaQuery = SchemaQuery.create('exp.data', 'mixtures', 'someViewName');
        model = new QueryModel({ schemaQuery });
        expect(model.viewName).toEqual('someViewName');
        model = new QueryModel({ id: 'custom', schemaQuery: SCHEMA_QUERY });
        expect(model.id).toEqual('custom');
    });

    test('isLoading', () => {
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY });
        expect(model.isLoading).toEqual(true);
        model = model.mutate({ queryInfoLoadingState: LoadingState.LOADING });
        expect(model.isLoading).toEqual(true);
        model = model.mutate({ queryInfoLoadingState: LoadingState.LOADED });
        expect(model.isLoading).toEqual(true);
        model = model.mutate({ rowsLoadingState: LoadingState.LOADING });
        expect(model.isLoading).toEqual(true);
        model = model.mutate({ rowsLoadingState: LoadingState.LOADED });
        expect(model.isLoading).toEqual(false);
    });

    test('Pagination', () => {
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY }).mutate({
            maxRows: 20,
            offset: 0,
            rowCount: 661,
        });

        model = model.mutate({ rows: {} });
        expect(model.pageCount).toEqual(34);
        expect(model.lastPageOffset).toEqual(660);
        expect(model.currentPage).toEqual(1);
        expect(model.isFirstPage).toEqual(true);
        expect(model.isLastPage).toEqual(false);

        model = model.mutate({ offset: 40 });
        expect(model.currentPage).toEqual(3);
        expect(model.isFirstPage).toEqual(false);
        expect(model.isLastPage).toEqual(false);

        model = model.mutate({ offset: 660 });
        expect(model.isFirstPage).toEqual(false);
        expect(model.isLastPage).toEqual(true);
    });

    test('Data', () => {
        const model = new QueryModel({ schemaQuery: SCHEMA_QUERY }).mutate({
            orderedRows: ORDERED_ROWS,
            rows: ROWS,
        });
        const gridData = model.gridData;
        expect(gridData.length).toEqual(2);
        expect(gridData[0]).toBe(ROWS['0']);
        expect(gridData[1]).toBe(ROWS['1']);
        expect(model.hasData).toEqual(true);
    });

    test('Data getRow', () => {
        const model = new QueryModel({ schemaQuery: SCHEMA_QUERY }).mutate({
            orderedRows: ORDERED_ROWS,
            rows: ROWS,
        });
        expect(model.getRow().RowId.value).toBe(0);
        expect(model.getRow('0').RowId.value).toBe(0);
        expect(model.getRow('1').RowId.value).toBe(1);
    });

    test('Sorts', () => {
        const sorts = [new QuerySort({ fieldKey: 'RowId', dir: '-' }), new QuerySort({ fieldKey: 'Data', dir: '+' })];
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY, sorts });
        expect(() => model.sortString).toThrow('Cannot construct sort string, no QueryInfo available');
        model = model.mutate({ queryInfo: QUERY_INFO });
        expect(model.sortString).toEqual('-RowId,Data');
    });

    test('Columns', () => {
        const cols = QUERY_INFO.columns;
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY });
        expect(() => model.columnString).toThrow('Cannot construct column string, no QueryInfo available');
        model = model.mutate({ queryInfo: QUERY_INFO });
        expect(model.columnString).toEqual('RowId,Name,Flag,mixtureTypeId,expirationTime,extraTestColumn');
        model = model.mutate({ requiredColumns: ['Name'] });
        expect(model.columnString).toEqual('Name,RowId,Flag,mixtureTypeId,expirationTime,extraTestColumn');
        expect(model.keyColumns).toEqual([cols.get('rowid')]);
        let expectedDisplayCols = [
            cols.get('name'),
            cols.get('flag'),
            cols.get('mixturetypeid'),
            cols.get('expirationtime'),
            cols.get('extratestcolumn'),
        ];
        expect(model.displayColumns).toEqual(expectedDisplayCols);

        // Change view to noExtraColumn which should change our expected columns.
        model = model.mutate({
            schemaQuery: SchemaQuery.create('exp.data', 'mixtures', 'noExtraColumn'),
        });
        expectedDisplayCols = [
            cols.get('name'),
            cols.get('flag'),
            cols.get('mixturetypeid'),
            cols.get('expirationtime'),
        ];
        expect(model.displayColumns).toEqual(expectedDisplayCols);
        expect(model.columnString).toEqual('Name,RowId,Flag,mixtureTypeId,expirationTime');
    });

    test('SelectedState', () => {
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY });
        // not loaded, no data
        expect(model.selectedState).toBe(GRID_CHECKBOX_OPTIONS.NONE);

        // loaded, no selections
        model = model.mutate({
            rows: { '1': { test: 1 }, '2': { test: 2 }, '3': { test: 3 } },
            orderedRows: ['1', '3', '2'],
            rowCount: 3,
            maxRows: 20,
            queryInfoLoadingState: LoadingState.LOADED,
            rowsLoadingState: LoadingState.LOADED,
        });
        expect(model.selectedState).toBe(GRID_CHECKBOX_OPTIONS.NONE);

        // loaded, all selected on page but more data
        model = model.mutate({
            selections: new Set(['1', '2', '3']),
            rowCount: 30,
            maxRows: 3,
        });
        expect(model.selectedState).toBe(GRID_CHECKBOX_OPTIONS.ALL);

        // some selected on page
        model = model.mutate({
            selections: new Set(['2', '3']),
        });
        expect(model.selectedState).toBe(GRID_CHECKBOX_OPTIONS.SOME);

        // none selected on page
        model = model.mutate({
            selections: new Set(),
        });
        expect(model.selectedState).toBe(GRID_CHECKBOX_OPTIONS.NONE);

        // all selected, total rows less than a page
        model = model.mutate({
            selections: new Set(['1', '2', '3']),
            rowCount: 3,
            maxRows: 20,
        });
        expect(model.selectedState).toBe(GRID_CHECKBOX_OPTIONS.ALL);

        // some selected from total less than a page
        model = model.mutate({
            selections: new Set(['3']),
            rowCount: 3,
            maxRows: 33,
        });
        expect(model.selectedState).toBe(GRID_CHECKBOX_OPTIONS.SOME);
    });

    test('hasSelections', () => {
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY });
        expect(model.hasSelections).toBeFalsy();
        model = model.mutate({ selections: new Set([]) });
        expect(model.hasSelections).toBeFalsy();
        model = model.mutate({ selections: new Set(['1']) });
        expect(model.hasSelections).toBeTruthy();
    });

    test('getSelectedIdsAsInts', () => {
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY });
        expect(model.getSelectedIdsAsInts()).toBe(undefined);
        model = model.mutate({ selections: new Set([]) });
        expect(model.getSelectedIdsAsInts().length).toBe(0);
        model = model.mutate({ selections: new Set(['1', '3', '2']) });
        expect(model.getSelectedIdsAsInts().length).toBe(3);
        expect(model.getSelectedIdsAsInts()[0]).toBe(1);
        expect(model.getSelectedIdsAsInts()[1]).toBe(3);
        expect(model.getSelectedIdsAsInts()[2]).toBe(2);
    });
});
