import { ReactElement } from 'react';
import { act } from 'react-dom/test-utils';
import { Map } from 'immutable';
import { mount, MountRendererProps, ReactWrapper } from 'enzyme';
import { LabKey, Query } from '@labkey/api';
import mock, { proxy } from 'xhr-mock';

import {
    initDomainPropertiesMocks,
    initLineageMocks,
    initPipelineStatusDetailsMocks,
    initQueryGridMocks,
    initUserPropsMocks,
} from '../stories/mock';
import { initQueryGridState, QueryInfo, ServerContextProvider } from '..';

import { RowsResponse } from '../public/QueryModel/QueryModelLoader';

import { applyQueryMetadata, handleSelectRowsResponse } from './query/api';
import { bindColumnRenderers } from './renderers';
import { URL_MAPPERS, URLService } from './url/URLResolver';

declare let LABKEY: LabKey;

export function initMockServerContext(context: Partial<LabKey>): void {
    Object.assign(LABKEY, context);
}

/**
 * Initializes the server context and QueryGrid state which is needed in order to run most tests.
 */
export const initUnitTests = (metadata?: Map<string, any>, columnRenderers?: Map<string, any>): void => {
    initMockServerContext({
        container: {
            formats: {
                dateFormat: 'yyyy-MM-dd',
                dateTimeFormat: 'yyyy-MM-dd HH:mm',
                numberFormat: null,
            },
            path: 'testContainer',
            activeModules: ['Core', 'Query'],
        },
        contextPath: 'labkey',
    });
    initQueryGridState(metadata, columnRenderers);
};

/**
 * Use this method in beforeAll() for your jest tests and you'll have full access
 * to all of the same mock API responses we use in storybook.
 */
export function initUnitTestMocks(
    metadata?: Map<string, any>,
    columnRenderers?: Map<string, any>,
    includePipeline?: boolean
): void {
    window['__react-beautiful-dnd-disable-dev-warnings'] = true;
    initUnitTests(metadata, columnRenderers);
    mock.setup();
    initQueryGridMocks();
    initDomainPropertiesMocks();
    initLineageMocks();
    initUserPropsMocks();
    if (includePipeline) {
        initPipelineStatusDetailsMocks();
    }
    mock.use(proxy);
}

export function registerDefaultURLMappers(): void {
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
export const makeTestData = (getQueryResponse): RowsResponse => {
    // Hack: need to stringify and parse the query response object because Query.Response modifies the object in place,
    // which causes errors if you try to use the same response object twice.
    const response = new Query.Response(JSON.parse(JSON.stringify(getQueryResponse)));

    const { key, messages, models, orderedModels, rowCount } = handleSelectRowsResponse(response);

    return {
        messages: messages.toJS(),
        orderedRows: orderedModels[key].toArray(),
        rowCount,
        rows: models[key],
    };
};

/**
 * Use this if you're testing a component that requires a wrapping <ServerContextProvider/> to provide context.
 * This test method wraps enzyme's mount() method and provides the wrapping component with "initialContext".
 * With this the returned mounted component will still be the component under test
 * (as opposed to <ServerContextProvider />).
 * @param node The React node to mount
 * @param initialContext The server context to be provided by the wrapping <ServerContextProvider/>
 * @param options Pass through for mount's rendering options
 */
export const mountWithServerContext = (
    node: ReactElement,
    initialContext: any,
    options?: MountRendererProps
): ReactWrapper => {
    return mount(node, {
        wrappingComponent: ServerContextProvider,
        wrappingComponentProps: { initialContext },
        ...options,
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

/**
 * If you're testing a react component that uses hooks to load data use this method to flush promises and transition
 * your component to the next part of the lifecycle. Example:
 *      const wrapper = mount(<MyComponentThatLoadsStuff />);
 *      // Loading state is expected
 *      expect(wrapper.find(LOADING_SPINNER).exists()).toEqual(true);
 *      await waitForLifecycle(wrapper);
 *      // Items have been loaded and rendered
 *      expect(wrapper.find('.item').length).toEqual(4);
 * @param wrapper: enzyme ReactWrapper
 */
export const waitForLifecycle = (wrapper: ReactWrapper): Promise<undefined> => {
    // Wrap in react-dom/utils act so we don't get errors in our test logs
    return act(async () => {
        await sleep();
        wrapper.update();
    });
};
