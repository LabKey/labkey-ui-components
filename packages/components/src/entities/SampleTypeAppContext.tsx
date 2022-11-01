import { Filter } from '@labkey/api';

import { ExtendableAppContext, useAppContext } from '../internal/AppContext';
import { DomainDetails } from '../internal/components/domainproperties/models';
import { User } from '../internal/components/base/models/User';
import { SchemaQuery } from '../public/SchemaQuery';
import { ALIQUOT_FILTER_MODE } from '../internal/components/samples/constants';
import { QueryConfigMap } from '../public/QueryModel/withQueryModels';

import { ReferencingNotebooks, SampleStorageMenu, SampleStorageLocation } from './models';
import { JobsButton, SampleStorageButton, WorkflowGrid } from '../internal/components/samples/models';
import {DetailRenderer} from "../internal/components/forms/detail/DetailDisplay";

export interface SampleTypeAppContext {
    JobsButtonComponent: JobsButton;
    ReferencingNotebooksComponent: ReferencingNotebooks;
    SampleStorageButtonComponent: SampleStorageButton;
    SampleStorageLocationComponent: SampleStorageLocation;
    SampleStorageMenuComponent: SampleStorageMenu;
    WorkflowGridComponent: WorkflowGrid;
    assayProviderType?: string;
    dataClassAliasCaption?: string;
    dataClassParentageLabel?: string;
    dataClassTypeCaption?: string;
    detailRenderer?: DetailRenderer;
    getMetricUnitOptions: () => any[];
    getWorkflowGridQueryConfigs?: (
        visibleTabs: string[],
        gridPrefix: string,
        user: User,
        schemaQuery?: SchemaQuery,
        initialFilters?: Filter.IFilter[],
        sampleLSID?: string,
        sourceLSID?: string,
        activeSampleAliquotType?: ALIQUOT_FILTER_MODE,
        containerPath?: string
    ) => QueryConfigMap;
    hideConditionalFormatting: boolean;
    isValidParentOptionFn?: (row: any, isDataClass: boolean) => boolean;
    linagePagePermissions: string[];
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
