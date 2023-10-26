import { SchemaQuery } from '../SchemaQuery';
import { QueryInfo } from '../QueryInfo';

import { LoadingState } from '../LoadingState';

import { QueryModel } from './QueryModel';
import { Actions } from './withQueryModels';

/**
 * @ignore
 * Helper to instantiate a QueryModel for use with tests.
 * @param schemaQuery
 * @param queryInfo: The queryInfo you want to apply to a model. See makeQueryInfo above.
 * @param rows
 * @param orderedRows
 * @param rowCount
 * @param id
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const makeTestQueryModel = (
    schemaQuery: SchemaQuery,
    queryInfo?: QueryInfo,
    rows?: any,
    orderedRows?: any,
    rowCount?: number,
    id?: string
): QueryModel => {
    let model = new QueryModel({
        id: id ? id : 'model',
        schemaQuery,
    });

    if (queryInfo) {
        model = model.mutate({
            queryInfo,
            queryInfoLoadingState: LoadingState.LOADED,
        });
    }

    if (rows) {
        model = model.mutate({
            orderedRows,
            rowCount,
            rows,
            rowsLoadingState: LoadingState.LOADED,
        });
    }

    return model;
};

/**
 * @ignore
 * Creates an Actions object with a mock function for every action. For most use cases you'll want to pass `jest.fn`
 * to the `mockFn` parameter. You can use this in beforeEach so your actions get refreshed
 * between every test, jest.fn() objects track all calls overtime, so you'll want a fresh one for every test.
 *
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export const makeTestActions = (mockFn = (): any => () => {}, overrides: Partial<Actions> = {}): Actions => {
    const defaultActions: Actions = {
        addModel: mockFn(),
        clearSelections: mockFn(),
        loadModel: mockFn(),
        loadAllModels: mockFn(),
        loadAllQueryInfos: mockFn(),
        loadRows: mockFn(),
        loadNextPage: mockFn(),
        loadPreviousPage: mockFn(),
        loadFirstPage: mockFn(),
        loadLastPage: mockFn(),
        loadCharts: mockFn(),
        selectAllRows: mockFn(),
        selectRow: mockFn(),
        selectPage: mockFn(),
        selectReport: mockFn(),
        setFilters: mockFn(),
        setMaxRows: mockFn(),
        setOffset: mockFn(),
        setSchemaQuery: mockFn(),
        setSorts: mockFn(),
        setView: mockFn(),
        setSelections: mockFn(),
        replaceSelections: mockFn(),
        resetTotalCountState: mockFn(),
    };
    return Object.assign(defaultActions, overrides);
};
