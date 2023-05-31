import React, { FC, useMemo } from 'react';

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

export interface AppContextTestProviderProps {
    appContext: Partial<AppContext>;
    notificationContext: Partial<NotificationsContextState>;
    printLabelsContext: Partial<LabelPrintingContextProps>;
    serverContext: Partial<ServerContext>;
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
