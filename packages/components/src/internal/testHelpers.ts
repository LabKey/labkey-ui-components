import { Map } from 'immutable';
import { LabKey, Query } from '@labkey/api';
import mock, { proxy } from 'xhr-mock';

import { initLineageMocks, initQueryGridMocks, initUserPropsMocks } from '../stories/mock';
import { initQueryGridState, QueryInfo } from '..';
import { applyQueryMetadata, handle132Response } from './query/api';
import { bindColumnRenderers } from './renderers';
import { RowsResponse } from '../public/QueryModel/QueryModelLoader';
import { URLService } from './util/URLService';
import { URL_MAPPERS } from './util/URLResolver';

declare let LABKEY: LabKey;

export function initMockServerContext(context: Partial<LabKey>): void {
    Object.assign(LABKEY, context);
}

/**
 * Initializes the server context and QueryGrid state which is needed in order to run most tests.
 */
export const initUnitTests = (metadata?: Map<string, any>, columnRenderers?: Map<string, any>) => {
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
    initQueryGridState(metadata, columnRenderers);
};

/**
 * Use this method in beforeAll() for your jest tests and you'll have full access
 * to all of the same mock API responses we use in storybook.
 */
export function initUnitTestMocks(metadata?: Map<string, any>, columnRenderers?: Map<string, any>) {
    initUnitTests(metadata, columnRenderers);
    mock.setup();
    initQueryGridMocks();
    initLineageMocks();
    initUserPropsMocks();
    mock.use(proxy);
}

export function registerDefaultURLMappers() {
    URLService.registerURLMappers(
        ...URL_MAPPERS.ASSAY_MAPPERS,
        ...URL_MAPPERS.DATA_CLASS_MAPPERS,
        ...URL_MAPPERS.SAMPLE_TYPE_MAPPERS,
        ...URL_MAPPERS.LIST_MAPPERS,
        ...URL_MAPPERS.USER_DETAILS_MAPPERS,
        URL_MAPPERS.LOOKUP_MAPPER
    );
}

/**
 * Instantiates a QueryInfo from a captured query details response payload. Cannot be used until you've called
 * initQueryGridState, initUnitTests, or initUnitTestMocks.
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
    // Hack: need to stringify and parse the query response object because Query.Response modifies the object in place,
    // which causes errors if you try to use the same response object twice.
    const response = new Query.Response(JSON.parse(JSON.stringify(getQueryResponse)));
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
 * Use this to sleep in the tests. If you make your test methods async you can use "await sleep();" to put your thread
 * to sleep temporarily which will allow async actions in your component to continue.
 * @param ms
 */
export const sleep = (ms = 0): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};
