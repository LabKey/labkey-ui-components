import { ComponentType } from 'react';
import { List } from 'immutable';
import { Draft, immerable, produce } from 'immer';
import { Filter } from '@labkey/api';

import { SampleStateType } from './constants';
import { ALIQUOT_FILTER_MODE } from './SampleAliquotViewSelector';
import { SamplesEditButtonSections } from './utils';
import {OperationConfirmationData} from "../entities/models";
import {QueryModel} from "../../../public/QueryModel/QueryModel";
import {User} from "../base/models/User";
import {AppURL} from "../../url/AppURL";

export enum SampleCreationType {
    Aliquots = 'Aliquots',
    Derivatives = 'Derivatives',
    Independents = 'New samples',
    PooledSamples = 'Pooled Samples',
}

export enum SampleCreationTypeGroup {
    samples,
    aliquots,
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
    typeGroup: SampleCreationTypeGroup;
}

export const CHILD_SAMPLE_CREATION: SampleCreationTypeModel = {
    type: SampleCreationType.Independents,
    description: 'Create multiple output samples per parent.',
    minParentsPerSample: 1,
    iconSrc: 'derivatives',
    quantityLabel: 'New samples per parent',
    typeGroup: SampleCreationTypeGroup.samples,
};

export const DERIVATIVE_CREATION: SampleCreationTypeModel = {
    type: SampleCreationType.Derivatives,
    description: 'Create multiple output samples per parent.',
    disabledDescription: 'Only one parent sample type is allowed when creating derivative samples.',
    minParentsPerSample: 1,
    iconSrc: 'derivatives',
    quantityLabel: 'Derivatives per parent',
    typeGroup: SampleCreationTypeGroup.samples,
};

export const POOLED_SAMPLE_CREATION: SampleCreationTypeModel = {
    type: SampleCreationType.PooledSamples,
    description: 'Put multiple samples into pooled outputs.',
    minParentsPerSample: 2,
    iconSrc: 'pooled',
    quantityLabel: 'New samples per parent group',
    typeGroup: SampleCreationTypeGroup.samples,
};

export const ALIQUOT_CREATION: SampleCreationTypeModel = {
    type: SampleCreationType.Aliquots,
    description: 'Create aliquot copies from each parent sample.',
    minParentsPerSample: 1,
    iconSrc: 'aliquots',
    quantityLabel: 'Aliquots per parent',
    typeGroup: SampleCreationTypeGroup.aliquots,
};

export interface SamplesSelectionProviderProps {
    determineLineage?: boolean;
    determineSampleData: boolean;
    determineStorage?: boolean;
    sampleSet: string;
    selection: List<any>;
}

export interface SamplesSelectionResultProps {
    aliquots: any[];
    editStatusData: OperationConfirmationData; // data about which samples can and cannot be edited due to their status
    noStorageSamples: any[];
    sampleItems: Record<string, any>;
    // mapping from sample rowId to sample record containing lineage
    sampleLineage: Record<string, any>;
    sampleLineageKeys: string[];
    sampleTypeDomainFields: GroupedSampleFields;
    selectionInfoError: any;
}

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

export interface SampleAliquotsStats {
    aliquotCount: number;
    aliquotIds?: number[];
    inStorageCount: number;
    jobsCount?: number;
}

export interface SampleStatus {
    description?: string;
    label: string;
    statusType: SampleStateType;
}

interface SampleStorageButtonComponentProps {
    afterStorageUpdate?: () => void;
    isPicklist?: boolean;
    metricFeatureArea?: string;
    nounPlural?: string;
    queryModel: QueryModel;
    user: User;
}

export type SampleStorageButton = ComponentType<SampleStorageButtonComponentProps>;

interface JobsButtonsComponentProps {
    metricFeatureArea?: string;
    model: QueryModel;
    user: User;
}

export type JobsButton = ComponentType<JobsButtonsComponentProps>;

export class SampleState {
    [immerable] = true;

    readonly rowId: number;
    readonly label: string;
    readonly description: string;
    readonly stateType: string;
    readonly publicData: boolean;
    readonly inUse: boolean;

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
        return produce(this, (draft: Draft<SampleState>) => {
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
    showBulkUpdate?: () => void;
    subMenuWidth?: number;
    toggleEditWithGridUpdate?: () => void;
}
