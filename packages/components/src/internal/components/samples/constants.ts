import { FindField } from './models';

export const SAMPLE_INVENTORY_ITEM_SELECTION_KEY = 'inventoryItems';

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

export const IS_ALIQUOT_FIELD = 'isAliquot';

export const SAMPLE_STATE_COLUMN_NAME = 'SampleState';
export const SAMPLE_STATE_TYPE_COLUMN_NAME = 'SampleState/StatusType';
export const SAMPLE_STATE_DESCRIPTION_COLUMN_NAME = 'SampleState/Description';

export enum SampleOperation {
    EditMetadata ,
    EditLineage,
    AddToStorage,
    UpdateStorageMetadata,
    RemoveFromStorage,
    AddToPicklist,
    RemoveFromPicklist,
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
        SampleOperation.RemoveFromPicklist,
        SampleOperation.Delete,
        SampleOperation.AddToWorkflow,
        SampleOperation.RemoveFromWorkflow,
        SampleOperation.AddAssayData,
        SampleOperation.LinkToStudy,
        SampleOperation.RecallFromStudy,
    ]),
    [SampleStateType.Locked]: new Set([SampleOperation.AddToPicklist, SampleOperation.RemoveFromPicklist]),
};

export const operationRestrictionMessage = {
    [SampleOperation.EditMetadata]: {
        all: 'updating of their data without also changing the status',
        singular: 'updating of its data',
        plural: 'updating of their data',
        recommendation: 'Either change the status here or remove these samples from your selection.'
    },
    [SampleOperation.EditLineage]: {
        all: 'updating of their lineage',
        singular: 'updating of its lineage',
        plural: 'updating of their lineage',
    }
}
