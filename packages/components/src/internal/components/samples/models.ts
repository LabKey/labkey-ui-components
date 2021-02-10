export enum SampleCreationType
{
    Independents = "New samples",
    Derivatives = "Derivatives",
    PooledSamples = "Pooled Samples",
    Aliquots = "Aliquots"
}

export interface SampleCreationTypeModel
{
    type: SampleCreationType,
    description?: string,
    disabledDescription?: string,
    minParentsPerSample: number,
    iconSrc?: string,
    iconUrl?: string,
    disabled?: boolean,
    selected?: boolean,
}

export const INDEPENDENT_SAMPLE_CREATION: SampleCreationTypeModel = {
    type: SampleCreationType.Independents,
    minParentsPerSample: 0,
};

export const CHILD_SAMPLE_CREATION: SampleCreationTypeModel = {
    type: SampleCreationType.Independents,
    description: "Create multiple output samples per parent.",
    minParentsPerSample: 1,
    iconSrc: 'derivatives'
};

export const DERIVATIVE_CREATION: SampleCreationTypeModel = {
    type: SampleCreationType.Derivatives,
    description: "Create multiple output samples per parent.",
    disabledDescription: "Only one parent sample type is allowed when creating derivative samples.",
    minParentsPerSample: 1,
    iconSrc: 'derivatives'
};

export const POOLED_SAMPLE_CREATION: SampleCreationTypeModel = {
    type: SampleCreationType.PooledSamples,
    description: "Put multiple samples into pooled outputs.",
    minParentsPerSample: 2,
    iconSrc: "pooled"
};

export const ALIQUOT_CREATION: SampleCreationTypeModel = {
    type: SampleCreationType.Aliquots,
    description: "Create aliquot copies from each parent sample.",
    minParentsPerSample: 1,
    iconSrc: "aliquots"
};
