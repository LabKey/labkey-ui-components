import { Actions, QueryInfo, QueryModel } from '..';
import { LoadingState } from './QueryModel';
import { applyQueryMetadata } from '../query/api';
import { bindColumnRenderers } from '../renderers';

/**
 * Instantiates a QueryInfo from a captured query details response payload.
 * @param queryDetailsResponse: Query details response object (e.g. imported from
 * test/data/mixtures-getQueryDetails.json)
 */
export const makeQueryInfo = (queryDetailsResponse) => {
    const queryInfo = applyQueryMetadata(queryDetailsResponse);
    return queryInfo.merge({ columns: bindColumnRenderers(queryInfo.columns) });
};

/**
 * Helper to instantiate a QueryModel for use with tests.
 * @param schemaQuery
 * @param queryInfo: The queryInfo you want to apply to a model. See makeQueryInfo above.
 * @param rows
 * @param orderedRows
 */
export const makeTestModel = (schemaQuery, queryInfo?: QueryInfo, rows?: any, orderedRows?: any) => {
    const model = new QueryModel({
        id: 'model',
        schemaQuery: schemaQuery,
    });

    if (queryInfo) {
        model.queryInfo = queryInfo;
        model.queryInfoLoadingState = LoadingState.LOADED;
    }

    if (rows) {
        model.rows = rows;
        model.orderedRows = orderedRows;
        model.rowsLoadingState = LoadingState.LOADED;
    }

    return model;
};

/**
 * Creates an Actions object with jest.fn() for every action. Use this in beforeEach so your actions get refreshed
 * between every test, jest.fn() objects track all calls overtime, so you'll want a fresh one for every test.
 */
export const makeTestActions = (): Actions => {
    return  {
        addModel: jest.fn(),
        loadModel: jest.fn(),
        loadAllModels: jest.fn(),
        loadNextPage: jest.fn(),
        loadPreviousPage: jest.fn(),
        loadFirstPage: jest.fn(),
        loadLastPage: jest.fn(),
        setOffset: jest.fn(),
        setMaxRows: jest.fn(),
        setView: jest.fn(),
        setSchemaQuery: jest.fn(),
    };
};

/**
 * Copies a test model and applies any mutations you want to the copy, useful for when using mount() and simulating
 * changes to a model.
 * @param currentModel: QueryModel
 * @param changes: object containing the changes you want to make to a model.
 */
export const copyTestModel = (currentModel: QueryModel, changes?: any) => {
    const model = currentModel.copy();

    if (changes) {
        Object.assign(model, changes);
    }

    return model;
};
