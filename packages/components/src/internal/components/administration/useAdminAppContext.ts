// If your App extends AppContext to add attributes other than Admin use this e.g.:
// type MyAppContext = ExtendableAppContext<WithMyAppContext & WithAdminAppContext>;
import { AdminAppContext, ExtendableAppContext, useAppContext } from '../../AppContext';

export interface WithAdminAppContext {
    admin: AdminAppContext;
}

// If your App only extends the AppContext to add support for SampleType use this.
export type AppContextWithAdmin = ExtendableAppContext<WithAdminAppContext>;

export const useAdminAppContext = (): AdminAppContext => {
    const appContext = useAppContext<AppContextWithAdmin>();

    if (appContext.admin === undefined) {
        throw new Error('AppContext was not initialized with an admin attribute (AdminAppContext)');
    }

    return appContext.admin;
};
