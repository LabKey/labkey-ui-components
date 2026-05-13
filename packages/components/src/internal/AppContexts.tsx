import React, { FC, PropsWithChildren, useMemo } from 'react';
import { getServerContext } from '@labkey/api';

import { AppContextProvider, ExtendableAppContext } from './AppContext';
import { GlobalStateContextProvider } from './GlobalStateContext';
import { ServerContextProvider, withAppUser } from './components/base/ServerContext';
import { NotificationsContextProvider } from './components/notifications/NotificationsContext';
import { LabelPrintingContextProvider } from './components/labelPrinting/LabelPrintingContextProvider';

interface Props<T = {}> extends PropsWithChildren {
    includeGlobalState?: boolean;
    initialAppContext?: ExtendableAppContext<T>;
}

/**
 * AppContexts is where you should add any additional contexts needed by our applications. At the moment all of our
 * apps share the same basic context configurations. This component makes it easy for us to update all of our Apps
 * at once and reduce the level of nesting needed in our Route configurations.
 */
export const AppContexts: FC<Props> = props => {
    const { children, includeGlobalState = true, initialAppContext } = props;
    const initialServerContext = useMemo(() => withAppUser(getServerContext()), []);
    return (
        <ServerContextProvider initialContext={initialServerContext}>
            <AppContextProvider initialContext={initialAppContext}>
                {includeGlobalState && (
                    <GlobalStateContextProvider>
                        <NotificationsContextProvider>
                            <LabelPrintingContextProvider>{children}</LabelPrintingContextProvider>
                        </NotificationsContextProvider>
                    </GlobalStateContextProvider>
                )}
                {!includeGlobalState && <>{children}</>}
            </AppContextProvider>
        </ServerContextProvider>
    );
};
