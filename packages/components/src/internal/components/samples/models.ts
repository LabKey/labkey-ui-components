import { ComponentType } from 'react';
import { List } from 'immutable';
import { Draft, immerable, produce } from 'immer';
import { Filter } from '@labkey/api';

import { OperationConfirmationData, QueryModel, User } from '../../..';

import { SampleStateType } from './constants';
import { ALIQUOT_FILTER_MODE } from './SampleAliquotViewSelector';
import { SamplesEditButtonSections } from './utils';

export enum SampleCreationType {
    Independents = 'New samples',
    Derivatives = 'Derivatives',
    PooledSamples = 'Pooled Samples',
    Aliquots = 'Aliquots',
}

export enum SampleCreationTypeGroup {
    samples,
    aliquots,
}

export interface SampleCreationTypeModel {
    type: SampleCreationType;
    description?: string;
    quantityLabel?: string;
    disabledDescription?: string;
    minParentsPerSample: number;
    typeGroup: SampleCreationTypeGroup;
    iconSrc?: string;
    iconUrl?: string;
    disabled?: boolean;
    selected?: boolean;
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
    selection: List<any>;
    sampleSet: string;
    determineSampleData: boolean;
    determineStorage?: boolean;
    determineLineage?: boolean;
}

export interface SamplesSelectionResultProps {
    sampleTypeDomainFields: GroupedSampleFields;
    aliquots: any[];
    noStorageSamples: any[];
    selectionInfoError: any;
    sampleItems: Record<string, any>;
    sampleLineageKeys: string[];
    sampleLineage: Record<string, any>; // mapping from sample rowId to sample record containing lineage
    editStatusData: OperationConfirmationData; // data about which samples can and cannot be edited due to their status
}

export interface GroupedSampleFields {
    aliquotFields: string[];
    metaFields: string[];
    metricUnit: string;
}

export interface FindField {
    nounSingular: string;
    nounPlural: string;
    name: string;
    helpText?: string;
    helpTextTitle?: string;
    label: string;
    storageKeyPrefix: string;
}

export interface SampleAliquotsStats {
    aliquotCount: number;
    inStorageCount: number;
    jobsCount?: number;
    aliquotIds?: number[];
}

export interface SampleStatus {
    label: string;
    statusType: SampleStateType;
    description?: string;
}

export interface SampleStorageButtonsComponentProps {
    user: User;
    afterStorageUpdate?: () => void;
    queryModel?: QueryModel;
    isPicklist?: boolean;
    nounPlural?: string;
}

export type SampleStorageButton = ComponentType<SampleStorageButtonsComponentProps>;

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
    excludedCreateMenuKeys?: List<string>;
    excludedManageMenuKeys?: SamplesEditButtonSections[];
    hideButtons?: SamplesEditButtonSections[];
    initAliquotMode?: ALIQUOT_FILTER_MODE;
    onTabbedViewAliquotSelectorUpdate?: (filter: Filter.IFilter, filterColumnToRemove?: string) => void;
    showBulkUpdate?: () => void;
    toggleEditWithGridUpdate?: () => void;
    metricFeatureArea?: string;
}
