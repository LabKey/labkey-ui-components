import { ExtendableAppContext, SampleTypeAppContext, useAppContext } from '../internal/AppContext';

// If your App extends AppContext to add attributes other than SampleType use this e.g.:
// type MyAppContext = ExtendableAppContext<WithMyAppContext & WithSampleTypeAppContext>;
export interface WithSampleTypeAppContext {
    sampleType: SampleTypeAppContext;
}

// If your App only extends the AppContext to add support for SampleType use this.
export type AppContextWithSampleType = ExtendableAppContext<WithSampleTypeAppContext>;

export const useSampleTypeAppContext = (): SampleTypeAppContext => {
    const appContext = useAppContext<AppContextWithSampleType>();

    if (appContext.sampleType === undefined) {
        throw new Error('AppContext was not initialized with a sampleType attribute (SampleTypeAppContext)');
    }

    return appContext.sampleType;
};
