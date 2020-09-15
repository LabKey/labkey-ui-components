import { Actions, LoadingState, QueryInfo, QueryModel } from '..';

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
    schemaQuery,
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
 * Creates an Actions object with jest.fn() for every action. Use this in beforeEach so your actions get refreshed
 * between every test, jest.fn() objects track all calls overtime, so you'll want a fresh one for every test.
 */
export const makeTestActions = (): Actions => {
    return {
        addModel: jest.fn(),
        clearSelections: jest.fn(),
        loadModel: jest.fn(),
        loadAllModels: jest.fn(),
        loadRows: jest.fn(),
        loadNextPage: jest.fn(),
        loadPreviousPage: jest.fn(),
        loadFirstPage: jest.fn(),
        loadLastPage: jest.fn(),
        loadCharts: jest.fn(),
        selectAllRows: jest.fn(),
        selectRow: jest.fn(),
        selectPage: jest.fn(),
        selectReport: jest.fn(),
        setFilters: jest.fn(),
        setMaxRows: jest.fn(),
        setOffset: jest.fn(),
        setSchemaQuery: jest.fn(),
        setSorts: jest.fn(),
        setView: jest.fn(),
        setSelections: jest.fn(),
        replaceSelections: jest.fn(),
    };
};
