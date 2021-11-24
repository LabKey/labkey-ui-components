import { getServerContext } from '@labkey/api';
import React, { FC, useMemo } from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import { AppContextProvider, ExtendableAppContext } from './AppContext';
import { ServerContextProvider, withAppUser } from './components/base/ServerContext';

interface Props<T = {}> {
    initialAppContext?: ExtendableAppContext<T>;
    store: any;
    history: any;
}

/**
 * AppContexts is where you should add any additional contexts needed by our applications. At the moment all of our
 * apps share the same basic context configurations, and this component makes it easy for us to update all of our Apps
 * at once, and reduce the level of nesting needed in our Route configurations.
 */
export const AppContexts: FC<Props> = (props) => {
    const { children, history, initialAppContext, store } = props;
    const initialServerContext = useMemo(() => withAppUser(getServerContext()), []);
    return (
        <ServerContextProvider initialContext={initialServerContext}>
            <AppContextProvider initialContext={initialAppContext}>
                <Provider store={store}>
                    <Router history={history}>{children}</Router>
                </Provider>
            </AppContextProvider>
        </ServerContextProvider>
    );
};
