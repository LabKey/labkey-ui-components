import { ExtendableAppContext, useAppContext } from '../internal/AppContext';
import { DetailRenderer } from '../internal/components/forms/detail/DetailDisplay';
import { JobsMenuOptions } from '../internal/components/samples/models';

export interface AssayAppContext {
    assayProviderType?: string;
    detailRenderer?: DetailRenderer;
    qcEnabledForApp?: boolean;
    requireSampleField: boolean;
    showProviderName: boolean;
    JobsMenuOptionsComponent: JobsMenuOptions;
    assayTypes?: string[];
    excludedAssayProviders?: string[];
}

// If your App extends AppContext to add attributes other than Assay use this e.g.:
// type MyAppContext = ExtendableAppContext<WithMyAppContext & WithAssayAppContext>;
export interface WithAssayAppContext {
    assay: AssayAppContext;
}

// If your App only extends the AppContext to add support for SampleType use this.
export type AppContextWithAssay = ExtendableAppContext<WithAssayAppContext>;

export const useAssayAppContext = (): AssayAppContext => {
    const appContext = useAppContext<AppContextWithAssay>();

    if (appContext.assay === undefined) {
        throw new Error('AppContext was not initialized with an assay attribute (AssayAppContext)');
    }

    return appContext.assay;
};
