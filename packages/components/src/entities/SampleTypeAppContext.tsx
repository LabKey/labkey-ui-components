import { ExtendableAppContext, useAppContext } from '../internal/AppContext';
import { DomainDetails } from '../internal/components/domainproperties/models';

export interface SampleTypeAppContext {
    dataClassAliasCaption?: string;
    dataClassParentageLabel?: string;
    dataClassTypeCaption?: string;
    getMetricUnitOptions: () => any[];
    hideConditionalFormatting: boolean;
    isValidParentOptionFn?: (row: any, isDataClass: boolean) => boolean;
    readOnlyQueryNames?: string[];
    showParentLabelPrefix: boolean;
    showStudyProperties: boolean;
    useSeparateDataClassesAliasMenu: boolean;
    validateNewSampleTypeUnit: (sampleSet: DomainDetails, newUnit: string) => Promise<any>;
}

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
