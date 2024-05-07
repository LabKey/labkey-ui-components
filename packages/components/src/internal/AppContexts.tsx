import { getServerContext } from '@labkey/api';
import React, { FC, useMemo } from 'react';

import { AppContextProvider, ExtendableAppContext } from './AppContext';
import { GlobalStateContextProvider } from './GlobalStateContext';
import { ServerContextProvider, withAppUser } from './components/base/ServerContext';
import { NotificationsContextProvider } from './components/notifications/NotificationsContext';
import { LabelPrintingContextProvider } from './components/labelsPrinting/LabelPrintingContextProvider';

interface Props<T = {}> {
    initialAppContext?: ExtendableAppContext<T>;
}

/**
 * AppContexts is where you should add any additional contexts needed by our applications. At the moment all of our
 * apps share the same basic context configurations, and this component makes it easy for us to update all of our Apps
 * at once, and reduce the level of nesting needed in our Route configurations.
 */
export const AppContexts: FC<Props> = props => {
    const { children, initialAppContext } = props;
    const initialServerContext = useMemo(() => withAppUser(getServerContext()), []);
    return (
        <ServerContextProvider initialContext={initialServerContext}>
            <AppContextProvider initialContext={initialAppContext}>
                <GlobalStateContextProvider>
                    <NotificationsContextProvider>
                        <LabelPrintingContextProvider>{children}</LabelPrintingContextProvider>
                    </NotificationsContextProvider>
                </GlobalStateContextProvider>
            </AppContextProvider>
        </ServerContextProvider>
    );
};
