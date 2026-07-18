/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { immerable, produce } from 'immer';

export interface SampleColorModel {
    archived: boolean;
    color: string;
    label: string;
    rowId?: number;
}

export enum EntityCreationType {
    Aliquots = 'Aliquot',
    Derivatives = 'Derive',
    FromSources = 'From sources',
    Independents = 'Independent',
    PooledSamples = 'Pool',
}

export interface EntityCreationTypeModel {
    description?: string;
    disabled?: boolean;
    disabledDescription?: string;
    iconSrc?: string;
    iconUrl?: string;
    minParentsPerSample: number;
    quantityLabel?: string;
    selected?: boolean;
    type: EntityCreationType;
    typeChoiceLabel?: string;
}

export const INDEPENDENT_SAMPLE_CREATION: EntityCreationTypeModel = {
    type: EntityCreationType.Independents,
    description: 'Create samples.',
    minParentsPerSample: 0,
    quantityLabel: 'New Samples',
};

export const DERIVATIVE_CREATION: EntityCreationTypeModel = {
    type: EntityCreationType.Derivatives,
    description: 'Create samples of different types from each selected sample.',
    disabledDescription: 'Only one parent sample type is allowed when creating derivative samples.',
    minParentsPerSample: 1,
    iconSrc: 'derivatives',
    quantityLabel: 'Derivatives Per Parent',
    typeChoiceLabel: 'Derivative Type',
};

export const POOLED_SAMPLE_CREATION: EntityCreationTypeModel = {
    type: EntityCreationType.PooledSamples,
    description: 'Combine selected samples to create new samples.',
    minParentsPerSample: 2,
    iconSrc: 'pooled',
    quantityLabel: 'New Samples from Pool',
    typeChoiceLabel: 'Sample Type',
};

export const ALIQUOT_CREATION: EntityCreationTypeModel = {
    type: EntityCreationType.Aliquots,
    description: 'Create copies that inherit data from each parent sample.',
    minParentsPerSample: 1,
    iconSrc: 'aliquots',
    quantityLabel: 'Aliquots Per Parent',
};

export interface GroupedSampleFields {
    aliquotFields: string[]; // aliquot-specific (lowercase column fieldKey)
    independentFields: string[]; // aliquot & parent rename to sharedFields (lowercase column fieldKey)
    metaFields: string[]; // parent only (lowercase column fieldKey)
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

export enum SampleStateType {
    Available = 'Available',
    Consumed = 'Consumed',
    Locked = 'Locked',
}

export interface SampleStatus {
    color: string;
    description?: string;
    label: string;
    rowId?: number;
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
    readonly color: string;

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

    toSampleStatus(): SampleStatus {
        return {
            description: this.description,
            label: this.label,
            color: this.color,
            rowId: this.rowId ?? undefined,
            statusType: SampleStateType[this.stateType],
        };
    }
}
