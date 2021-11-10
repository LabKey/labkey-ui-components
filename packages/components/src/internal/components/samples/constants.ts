import { FindField } from './models';

export const SAMPLE_INVENTORY_ITEM_SELECTION_KEY = 'inventoryItems';

export const MAX_SELECTED_SAMPLES = 10000;

export const FIND_BY_IDS_QUERY_PARAM = 'findByIdsKey';

export const UNIQUE_ID_FIND_FIELD: FindField = {
    nounSingular: 'Barcode',
    nounPlural: 'Barcodes',
    name: 'uniqueIds',
    helpTextTitle: 'Unique ID Fields',
    helpText:
        'The ids provided will be matched against all of the fields of type Unique ID defined in your sample types.',
    label: 'Barcodes (Unique ID field)',
    storageKeyPrefix: 'u:',
};
export const SAMPLE_ID_FIND_FIELD: FindField = {
    nounSingular: 'Sample ID',
    nounPlural: 'Sample IDs',
    name: 'sampleIds',
    label: 'Sample IDs',
    storageKeyPrefix: 's:',
};

export const IS_ALIQUOT_COL = 'IsAliquot';

export const SAMPLE_STATE_COLUMN_NAME = 'SampleState';
export const SAMPLE_STATE_TYPE_COLUMN_NAME = 'SampleState/StatusType';
export const SAMPLE_STATE_DESCRIPTION_COLUMN_NAME = 'SampleState/Description';

export enum SampleOperation {
    EditMetadata,
    EditLineage,
    AddToStorage,
    UpdateStorageMetadata,
    RemoveFromStorage,
    AddToPicklist,
    Delete,
    AddToWorkflow,
    RemoveFromWorkflow,
    AddAssayData,
    LinkToStudy,
    RecallFromStudy,
}

export enum SampleStateType {
    Available = 'Available',
    Consumed = 'Consumed',
    Locked = 'Locked',
}

export const permittedOps = {
    [SampleStateType.Available]: new Set(
        Object.keys(SampleOperation)
            .filter(val => !isNaN(parseInt(val)))
            .map(val => parseInt(val))
    ),
    [SampleStateType.Consumed]: new Set([
        SampleOperation.EditMetadata,
        SampleOperation.EditLineage,
        SampleOperation.RemoveFromStorage,
        SampleOperation.AddToPicklist,
        SampleOperation.Delete,
        SampleOperation.AddToWorkflow,
        SampleOperation.RemoveFromWorkflow,
        SampleOperation.AddAssayData,
        SampleOperation.LinkToStudy,
        SampleOperation.RecallFromStudy,
    ]),
    [SampleStateType.Locked]: new Set([SampleOperation.AddToPicklist]),
};

export const STATUS_DATA_RETRIEVAL_ERROR = 'There was a problem retrieving the current sample status data.';

export const operationRestrictionMessage = {
    [SampleOperation.EditMetadata]: {
        all: 'updating of their data without also changing the status',
        singular: 'updating of its data',
        plural: 'updating of their data',
        recommendation: 'Either change the status here or remove these samples from your selection',
    },
    [SampleOperation.EditLineage]: {
        all: 'updating of their lineage',
        singular: 'updating of its lineage',
        plural: 'updating of their lineage',
    },
    [SampleOperation.AddToStorage]: {
        all: 'adding them to storage',
        singular: 'adding it to storage',
        plural: 'adding them to storage',
    },
    [SampleOperation.UpdateStorageMetadata]: {
        all: 'updating their storage data',
        singular: 'updating its storage data',
        plural: 'updating their storage data',
    },
    [SampleOperation.RemoveFromStorage]: {
        all: 'removing them from storage',
        singular: 'removing it from storage',
        plural: 'removing them from storage',
    },
    [SampleOperation.AddToPicklist]: {
        all: 'adding them to a picklist',
        singular: 'adding it to a picklist',
        plural: 'adding them to a picklist',
    },
    // [SampleOperation.Delete]: {
    //    Not needed because included from the server side response
    // },
    [SampleOperation.AddToWorkflow]: {
        all: 'adding them to a job',
        singular: 'adding it to a job',
        plural: 'adding them to a job',
    },
    [SampleOperation.RemoveFromWorkflow]: {
        all: 'removing them from a job',
        singular: 'removing it from a job',
        plural: 'removing them from a job',
    },
    [SampleOperation.AddAssayData]: {
        all: 'adding associated assay data',
        singular: 'adding associated assay data',
        plural: 'adding associated assay data',
    },
    // [SampleOperation.LinkToStudy]: {
    //    Not needed because check is done on LKS page
    // },
    // [SampleOperation.RecallFromStudy]: {
    //    Not needed because only possible from LKS
    // }
};
