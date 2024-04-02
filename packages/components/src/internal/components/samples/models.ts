import { ComponentType } from 'react';
import { immerable, produce } from 'immer';
import { Filter, Query } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { User } from '../base/models/User';
import { AppURL } from '../../url/AppURL';

import { SamplesEditButtonSections } from './utils';
import { ALIQUOT_FILTER_MODE, SampleStateType } from './constants';

export enum SampleCreationType {
    Aliquots = 'Aliquots',
    Derivatives = 'Derivatives',
    FromSources = 'New samples from sources',
    Independents = 'New samples',
    PooledSamples = 'Pooled Samples',
}

export interface SampleCreationTypeModel {
    description?: string;
    disabled?: boolean;
    disabledDescription?: string;
    iconSrc?: string;
    iconUrl?: string;
    minParentsPerSample: number;
    quantityLabel?: string;
    selected?: boolean;
    type: SampleCreationType;
}

export const CHILD_SAMPLE_CREATION: SampleCreationTypeModel = {
    type: SampleCreationType.FromSources,
    description: 'Create multiple output samples per source.',
    minParentsPerSample: 1,
    iconSrc: 'derivatives',
    quantityLabel: 'New Samples per Source',
};

export const DERIVATIVE_CREATION: SampleCreationTypeModel = {
    type: SampleCreationType.Derivatives,
    description: 'Create multiple output samples per parent.',
    disabledDescription: 'Only one parent sample type is allowed when creating derivative samples.',
    minParentsPerSample: 1,
    iconSrc: 'derivatives',
    quantityLabel: 'Derivatives per Parent',
};

export const POOLED_SAMPLE_CREATION: SampleCreationTypeModel = {
    type: SampleCreationType.PooledSamples,
    description: 'Put multiple samples into pooled outputs.',
    minParentsPerSample: 2,
    iconSrc: 'pooled',
    quantityLabel: 'New Samples per Parent Group',
};

export const ALIQUOT_CREATION: SampleCreationTypeModel = {
    type: SampleCreationType.Aliquots,
    description: 'Create aliquot copies from each parent sample.',
    minParentsPerSample: 1,
    iconSrc: 'aliquots',
    quantityLabel: 'Aliquots per Parent',
};

export interface GroupedSampleFields {
    // aliquot-specific
    aliquotFields: string[];
    // aliquot & parent rename to sharedFields
    independentFields: string[];
    // parent only
    metaFields: string[];
    metricUnit: string;
}

export interface FindField {
    helpText?: string;
    helpTextTitle?: string;
    label: string;
    name: string;
    nounPlural: string;
    nounSingular: string;
    storageKeyPrefix: string;
}

export interface SampleStatus {
    description?: string;
    label: string;
    statusType: SampleStateType;
}

export interface StorageActionStatusCounts {
    actionable: number;
    canBeAdded?: number;
    checkedIn?: number;
    checkedOut?: number;
    inStorage?: number;
    invalidStatus?: number;
    noPermissions?: number;
    notInStorage?: number;
    total: number;
}

// Note: this should stay in sync with the freezermanager/src/components/AddSamplesToStorageModal.tsx props
interface AddSamplesToStorageModalComponentProps {
    actionStatusCounts?: StorageActionStatusCounts;
    onCancel: () => any;
    onSuccess?: () => any;
    samplesSelectionKey?: string;
    user: User;
}

export type AddSamplesToStorageModal = ComponentType<AddSamplesToStorageModalComponentProps>;

// Note: this should stay in sync with the freezermanager/src/components/StorageButton.tsx props
interface SampleStorageButtonComponentProps {
    afterStorageUpdate?: () => void;
    isPicklist?: boolean;
    metricFeatureArea?: string;
    nounPlural?: string;
    queryModel: QueryModel;
    user: User;
}

export type SampleStorageButton = ComponentType<SampleStorageButtonComponentProps>;

// Note: this should stay in sync with the workflow/src/Components/JobsButton.tsx props
interface JobsButtonsComponentProps {
    isAssay?: boolean;
    metricFeatureArea?: string;
    model: QueryModel;
    user: User;
}

export type JobsButton = ComponentType<JobsButtonsComponentProps>;

// Note: this is meant to correspond to the JobsMenuOptions component in workflow/src/Components/JobsButton.tsx
export type JobsMenuOptions = ComponentType<JobsButtonsComponentProps>;

// Note: this should stay in sync with the workflow/src/Components/WorkflowGrid.tsx props
interface WorkflowGridComponentProps {
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    gridPrefix?: string;
    sampleAliquotType?: ALIQUOT_FILTER_MODE;
    sampleId?: number;
    sampleLSID?: string;
    showAliquotViewSelector?: boolean;
    showStartButton?: boolean;
    showTemplateTabs?: boolean;
    user: User;
    visibleTabs?: string[];
}

export type WorkflowGrid = ComponentType<WorkflowGridComponentProps>;

export class SampleState {
    [immerable] = true;

    readonly rowId: number;
    readonly label: string;
    readonly description: string;
    readonly stateType: string;
    readonly publicData: boolean;
    readonly inUse: boolean;
    readonly isLocal: boolean;
    readonly containerPath: string;

    constructor(values?: Partial<SampleState>) {
        Object.assign(this, values);
        if (this.publicData === undefined) {
            Object.assign(this, { publicData: false });
        }
    }

    set(name: string, value: any): SampleState {
        return this.mutate({ [name]: value });
    }

    mutate(props: Partial<SampleState>): SampleState {
        return produce<SampleState>(this, draft => {
            Object.assign(draft, props);
        });
    }
}

export interface SampleGridButtonProps {
    afterSampleActionComplete?: () => void;
    afterSampleDelete?: (rowsToKeep: any[]) => void;
    createBtnParentKey?: string;
    createBtnParentType?: string;
    excludeAddButton?: boolean;
    excludedMenuKeys?: SamplesEditButtonSections[];
    includesMedia?: boolean;
    initAliquotMode?: ALIQUOT_FILTER_MODE;
    metricFeatureArea?: string;
    navigate?: (url: string | AppURL) => void;
    onTabbedViewAliquotSelectorUpdate?: (filter: Filter.IFilter, filterColumnToRemove?: string) => void;
    sampleFinderBaseProps?: Record<string, any>;
    showBulkUpdate?: () => void;
    toggleEditWithGridUpdate?: () => void;
}
