import { Query } from '@labkey/api';

import { Actions, initQueryGridState, QueryInfo, QueryModel } from '..';

import { applyQueryMetadata, handle132Response } from '../query/api';
import { bindColumnRenderers } from '../renderers';
import { initMockServerContext } from '../testHelpers';

import { LoadingState } from './QueryModel';
import { RowsResponse } from './QueryModelLoader';

/**
 * Initializes the server context and QueryGrid state which is needed in order to run most tests.
 */
export const initUnitTests = () => {
    initMockServerContext({
        container: {
            formats: {
                dateFormat: 'yyyy-MM-dd',
                dateTimeFormat: 'yyyy-MM-dd HH:mm',
                numberFormat: null,
            },
            path: 'testContainer',
        },
        contextPath: 'labkey',
    });
    initQueryGridState();
};

/**
 * Instantiates a QueryInfo from a captured query details response payload. Cannot be used until you've called
 * initQueryGridState or initUnitTests.
 * @param getQueryDetailsResponse: getQueryDetails response object (e.g. imported from
 * test/data/mixtures-getQueryDetails.json)
 */
export const makeQueryInfo = (getQueryDetailsResponse): QueryInfo => {
    const queryInfo = applyQueryMetadata(getQueryDetailsResponse);
    return queryInfo.merge({ columns: bindColumnRenderers(queryInfo.columns) }) as QueryInfo;
};

/**
 * Creates rows and orderedRows objects needed by the QueryModel. Returns a Promise that resolves to an object that
 * looks like: { messages: any, rows: any, orderedRows: string[], rowCount: number }
 * @param getQueryResponse: getQuery Response object (e.g. imported from test/data/mixtures-getQuery.json)
 */
export const makeTestData = (getQueryResponse): Promise<RowsResponse> => {
    const response = new Query.Response(getQueryResponse);
    return handle132Response(response).then(resp => {
        const { messages, models, orderedModels, rowCount } = resp;
        const key = Object.keys(models)[0];
        return {
            messages: messages.toJS(),
            rows: models[key],
            orderedRows: orderedModels[key].toArray(),
            rowCount,
        };
    });
};

/**
 * Helper to instantiate a QueryModel for use with tests.
 * @param schemaQuery
 * @param queryInfo: The queryInfo you want to apply to a model. See makeQueryInfo above.
 * @param rows
 * @param orderedRows
 * @param rowCount
 */
export const makeTestModel = (schemaQuery, queryInfo?: QueryInfo, rows?: any, orderedRows?: any, rowCount?: number) => {
    let model = new QueryModel({
        id: 'model',
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
 * Creates an Actions object with jest.fn() for every action. Use this in beforeEach so your actions get refreshed
 * between every test, jest.fn() objects track all calls overtime, so you'll want a fresh one for every test.
 */
export const makeTestActions = (): Actions => {
    return {
        addModel: jest.fn(),
        loadModel: jest.fn(),
        loadAllModels: jest.fn(),
        loadRows: jest.fn(),
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
 * Use this to sleep in the tests. If you make your test methods async you can use "await sleep();" to put your thread
 * to sleep temporarily which will allow async actions in your component to continue.
 * @param ms
 */
export const sleep = (ms = 0) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};
