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
