import React, { ReactElement } from 'react';
import { act } from 'react-dom/test-utils';
import { Map } from 'immutable';
import { mount, MountRendererProps, ReactWrapper, shallow, ShallowWrapper } from 'enzyme';
import { LabKey, Query } from '@labkey/api';

import { RowsResponse, bindColumnRenderers } from '../public/QueryModel/QueryModelLoader';

import { QueryInfo } from '../public/QueryInfo';

import { applyQueryMetadata, handleSelectRowsResponse } from './query/api';
import { AppContext } from './AppContext';
import { AppContextTestProvider, sleep } from './test/testHelpers';

import { NotificationsContextState } from './components/notifications/NotificationsContext';
import { initQueryGridState } from './global';
import { ServerContext, ServerContextProvider } from './components/base/ServerContext';
import { LabelPrintingProviderProps } from './components/labels/LabelPrintingContextProvider';

declare let LABKEY: LabKey;

export function initMockServerContext(context: Partial<LabKey>): void {
    Object.assign(LABKEY, context);
}

/**
 * Initializes the server context and QueryGrid state which is needed in order to run most tests.
 */
export const initUnitTests = (metadata?: Map<string, any>, columnRenderers?: Record<string, any>): void => {
    initMockServerContext({
        container: {
            id: 'testContainerEntityId',
            title: 'Test Container',
            path: '/testContainer',
            formats: {
                dateFormat: 'yyyy-MM-dd',
                dateTimeFormat: 'yyyy-MM-dd HH:mm',
                numberFormat: null,
            },
            activeModules: ['Core', 'Query'], // add in the Ontology module if you want to test the Field Editor integrations
        },
        contextPath: '/labkey',
    });
    initQueryGridState(metadata, columnRenderers);
};

// TODO: Move these other non-enzyme methods to testHelper.tsx
/**
 * Instantiates a QueryInfo from a captured query details response payload. Cannot be used until you've called
 * initQueryGridState, initUnitTests, or initUnitTestMocks.
 * @param getQueryDetailsResponse: getQueryDetails response object (e.g. imported from
 * test/data/mixtures-getQueryDetails.json)
 */
export const makeQueryInfo = (getQueryDetailsResponse): QueryInfo => {
    const queryInfo = applyQueryMetadata(getQueryDetailsResponse);
    return queryInfo.mutate({ columns: bindColumnRenderers(queryInfo.columns) });
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
 * Use this if you're testing a component that requires a wrapping <AppContextProvider/> to provide context.
 * This utility method provides the `MountRenderProps` that can be supplied to enzyme's mount() method. The specified
 * `appContext` will be provided to the wrapped component under test. Additionally, with these options supplied
 * the returned mounted component will still be the component under test (as opposed to <AppContextProvider/>).
 * @param appContext The app context to be provided by the wrapping <AppContextProvider/>.
 * @param serverContext The server context to be provided by the wrapping <ServerContextProvider/>.
 * @param notificationContext The notification context to be provided by the wrapping <NotificationProvider/>.
 * @param options Pass through for mount's rendering options.
 * @param printLabelsContext The server context to be provided by the wrapping <PrintLabelsContext/>.
 */
export const mountWithAppServerContextOptions = (
    appContext?: Partial<AppContext>,
    serverContext?: Partial<ServerContext>,
    notificationContext?: Partial<NotificationsContextState>,
    options?: MountRendererProps,
    printLabelsContext?: Partial<LabelPrintingProviderProps>
): MountRendererProps => {
    return {
        wrappingComponent: AppContextTestProvider,
        wrappingComponentProps: {
            appContext,
            serverContext: serverContext ?? {},
            notificationContext,
            printLabelsContext,
        },
        ...options,
    };
};

/**
 * Use this if you're testing a component that requires a wrapping <AppContextProvider/> to provide context.
 * This test method wraps enzyme's mount() method and provides the wrapping component with "initialContext".
 * With this the returned mounted component will still be the component under test
 * (as opposed to <AppContextProvider/>).
 * @param node The React node to mount
 * @param appContext an optional app context object to mount
 * @param serverContext an optional server context object to mount
 * @param notificationContext an optional notification context object to mount
 * @param options Pass through for mount's rendering options
 * @param printLabelsContext an optional label printing context object to mount
 */
export const mountWithAppServerContext = (
    node: ReactElement,
    appContext?: Partial<AppContext>,
    serverContext?: Partial<ServerContext>,
    notificationContext?: Partial<NotificationsContextState>,
    options?: MountRendererProps,
    printLabelsContext?: Partial<LabelPrintingProviderProps>
): ReactWrapper => {
    return mount(
        node,
        mountWithAppServerContextOptions(appContext, serverContext, notificationContext, options, printLabelsContext)
    );
};

/**
 * Use this if you're testing a component that requires a wrapping <ServerContextProvider/> to provide context.
 * This utility method provides the `MountRenderProps` that can be supplied to enzyme's mount() method. The specified
 * `initialContext` will be provided to the wrapped component under test. Additionally, with these options supplied
 * the returned mounted component will still be the component under test (as opposed to <ServerContextProvider />).
 * Example:
 * ```ts
 * import { mount } from 'enzyme';
 * import { mountWithServerContextOptions } from '@labkey/components';
 *
 * describe('a test suite', () => {
 *     test('test with default context', () => {
 *         const wrapper = mount(<MyReactComponent />, mountWithServerContextOptions());
 *     });
 *     test('test with specified context, () => {
 *         const wrapper = mount(<MyReactComponent />, mountWithServerContextOptions({
 *             user: MY_TEST_USER,
 *         }));
 *     });
 * });
 * ```
 * @param initialContext The server context to be provided by the wrapping <ServerContextProvider/>
 * @param options Pass through for mount's rendering options
 */
export const mountWithServerContextOptions = (
    initialContext: any = {},
    options?: MountRendererProps
): MountRendererProps => {
    return {
        wrappingComponent: ServerContextProvider,
        wrappingComponentProps: { initialContext },
        ...options,
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
    initialContext?: any,
    options?: MountRendererProps
): ReactWrapper => {
    return mount(node, mountWithServerContextOptions(initialContext, options));
};

/**
 * Shallow version of mountWithServerContext.
 */
export const shallowWithServerContext = (
    node: ReactElement,
    initialContext?: any,
    options?: MountRendererProps
): ShallowWrapper<any, React.Component['state'], React.Component> => {
    return shallow(node, mountWithServerContextOptions(initialContext, options));
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
 * @param wrapper: enzyme ReactWrapper or ShallowWrapper
 * @param ms: the amount of time (in ms) to sleep
 */
export const waitForLifecycle = (wrapper: ReactWrapper | ShallowWrapper, ms?: number): Promise<undefined> => {
    // Wrap in react-dom/utils act so we don't get errors in our test logs
    return act(async () => {
        await sleep(ms);
        wrapper.update();
    });
};
