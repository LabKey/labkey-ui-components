import React, { FC, ReactElement, useMemo } from 'react';
import { render, RenderOptions } from '@testing-library/react';

import { AppContext, AppContextProvider } from './AppContext';
import { getTestAPIWrapper } from './APIWrapper';

import {
    NotificationsContextProvider,
    NotificationsContextState,
} from './components/notifications/NotificationsContext';
import { ServerContext, ServerContextProvider } from './components/base/ServerContext';
import { LabelPrintingContextProps, LabelPrintingProvider } from './components/labels/LabelPrintingContextProvider';
import { GlobalStateContextProvider } from './GlobalStateContext';

interface AppContextReactTestProviderProps {
    appContext: Partial<AppContext>;
    notificationContext: Partial<NotificationsContextState>;
    printLabelsContext: Partial<LabelPrintingContextProps>;
    serverContext: Partial<ServerContext>;
}

const AppContextReactTestProvider: FC<AppContextReactTestProviderProps> = props => {
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

// https://github.com/testing-library/react-testing-library/issues/780
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const renderWithAppContext = (
    node: ReactElement,
    props?: Partial<AppContextReactTestProviderProps>,
    options?: Omit<RenderOptions, 'wrapper'>
) => {
    return render(node, {
        wrapper: _props => <AppContextReactTestProvider {..._props} {...(props as AppContextReactTestProviderProps)} />,
        ...options,
    });
};
