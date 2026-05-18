import React, { FC, PropsWithChildren, useMemo } from 'react';
import { getServerContext } from '@labkey/api';

import { AppContextProvider, ExtendableAppContext } from './AppContext';
import { GlobalStateContextProvider } from './GlobalStateContext';
import { ServerContextProvider, withAppUser } from './components/base/ServerContext';
import { NotificationsContextProvider } from './components/notifications/NotificationsContext';
import { LabelPrintingContextProvider } from './components/labelPrinting/LabelPrintingContextProvider';

interface Props<T = {}> extends PropsWithChildren {
    /**
     * When true (the default), wraps children in GlobalStateContextProvider (and its dependent
     * NotificationsContextProvider / LabelPrintingContextProvider), making app-wide state like
     * the navigation context available via useGlobalStateContext.
     *
     * Set this to false when mounting AppContexts outside of one of our full applications (LKB,
     * LKSM, etc.) — for example, a standalone designer page rendered directly into a
     * LabKey Server view (see DataClassDesigner, ListDesigner, SampleTypeDesigner, etc.). Those
     * entry points do not have app-level routing/navigation and do not consume global state, so
     * initializing GlobalStateContext is unnecessary overhead and pulls in providers (like
     * navigation) that assume an app context that isn't there.
     *
     * Rule of thumb: leave this true inside any app that uses our shared navigation/routing;
     * set it to false for one-off React entry points embedded in a server-rendered page.
     */
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
