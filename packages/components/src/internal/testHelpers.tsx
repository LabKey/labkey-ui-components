import React, { FC, ReactElement, useMemo } from 'react';
import { act } from 'react-dom/test-utils';
import { Map } from 'immutable';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { mount, MountRendererProps, ReactWrapper } from 'enzyme';
import { LabKey, Query } from '@labkey/api';

import { RowsResponse, bindColumnRenderers } from '../public/QueryModel/QueryModelLoader';

import { QueryInfo } from '../public/QueryInfo';

import { applyQueryMetadata, handleSelectRowsResponse } from './query/api';
import { URL_MAPPERS, URLService } from './url/URLResolver';
import { AppContext, AppContextProvider } from './AppContext';
import { getTestAPIWrapper } from './APIWrapper';

import {
    NotificationsContextProvider,
    NotificationsContextState,
} from './components/notifications/NotificationsContext';
import { initQueryGridState } from './global';
import { ServerContext, ServerContextProvider } from './components/base/ServerContext';
import {
    LabelPrintingContextProps,
    LabelPrintingProvider,
    LabelPrintingProviderProps,
} from './components/labels/LabelPrintingContextProvider';
import { GlobalStateContextProvider } from './GlobalStateContext';

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

interface AppContextTestProviderProps {
    appContext: Partial<AppContext>;
    notificationContext: Partial<NotificationsContextState>;
    printLabelsContext: Partial<LabelPrintingContextProps>;
    serverContext: Partial<ServerContext>;
}

export const AppContextTestProvider: FC<AppContextTestProviderProps> = props => {
    const { appContext, children, serverContext, notificationContext, printLabelsContext } = props;
    const initialAppContext = useMemo(() => ({ api: getTestAPIWrapper(), ...appContext }), [appContext]);

    return (
        <ServerContextProvider initialContext={serverContext as ServerContext}>
            <AppContextProvider initialContext={initialAppContext}>
                <GlobalStateContextProvider>
                    <NotificationsContextProvider initialContext={notificationContext as NotificationsContextState}>
                        <LabelPrintingProvider initialContext={printLabelsContext as LabelPrintingContextProps}>
                            {children}
                        </LabelPrintingProvider>
                    </NotificationsContextProvider>
                </GlobalStateContextProvider>
            </AppContextProvider>
        </ServerContextProvider>
    );
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
 * Use this to sleep in the tests. If you make your test methods async you can use "await sleep();" to put your thread
 * to sleep temporarily which will allow async actions in your component to continue.
 * @param ms: the amount of time (in ms) to sleep
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
 * @param ms: the amount of time (in ms) to sleep
 */
export const waitForLifecycle = (wrapper: ReactWrapper, ms?: number): Promise<undefined> => {
    // Wrap in react-dom/utils act so we don't get errors in our test logs
    return act(async () => {
        await sleep(ms);
        wrapper.update();
    });
};

export const wrapDraggable = element => {
    return (
        <DragDropContext onDragEnd={jest.fn()}>
            <Droppable droppableId="jest-test-droppable">
                {provided => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        {element}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};
