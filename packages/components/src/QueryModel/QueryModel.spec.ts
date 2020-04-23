import { LoadingState, QueryInfo, SchemaQuery, QuerySort } from '..';
import { initUnitTests, makeQueryInfo } from '../testHelpers';
import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';

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
        expect(model.id).toEqual('exp.data-mixtures');
        const schemaQuery = SchemaQuery.create('exp.data', 'mixtures', 'someViewName');
        model = new QueryModel({ schemaQuery });
        expect(model.viewName).toEqual('someViewName');
        expect(model.id).toEqual('exp.data-mixtures-someViewName');
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
        expect(model.isPaged).toEqual(false);

        model = model.mutate({ rows: {} });
        expect(model.isPaged).toEqual(true);
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
});
