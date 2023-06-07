import React, { FC, useMemo } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Map } from 'immutable';
import { LabKey, Query } from '@labkey/api';

import { AppContext, AppContextProvider } from '../AppContext';
import { getTestAPIWrapper } from '../APIWrapper';

import {
    NotificationsContextProvider,
    NotificationsContextState,
} from '../components/notifications/NotificationsContext';
import { ServerContext, ServerContextProvider } from '../components/base/ServerContext';
import { LabelPrintingContextProps, LabelPrintingProvider } from '../components/labels/LabelPrintingContextProvider';
import { GlobalStateContextProvider } from '../GlobalStateContext';
import { URL_MAPPERS, URLService } from '../url/URLResolver';

import { initQueryGridState } from '../global';
import { QueryInfo } from '../../public/QueryInfo';
import { applyQueryMetadata, handleSelectRowsResponse } from '../query/api';
import { bindColumnRenderers, RowsResponse } from '../../public/QueryModel/QueryModelLoader';

export interface AppContextTestProviderProps {
    appContext?: Partial<AppContext>;
    notificationContext?: Partial<NotificationsContextState>;
    printLabelsContext?: Partial<LabelPrintingContextProps>;
    serverContext?: Partial<ServerContext>;
}

export const AppContextTestProvider: FC<AppContextTestProviderProps> = props => {
    const { appContext, children, serverContext = {}, notificationContext, printLabelsContext } = props;
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
