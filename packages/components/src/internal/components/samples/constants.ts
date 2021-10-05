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

export const SAMPLE_STATE_TYPE_COLUMN_NAME = 'SampleState/StatusType';

export enum SampleOperations {
    EditMetadata=1,
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
    RecallFromStudy
}

export const permittedOps = {
    'Available': new Set(Object.keys(SampleOperations)),
    'Consumed': new Set([
        SampleOperations.EditMetadata,
        SampleOperations.EditLineage,
        SampleOperations.RemoveFromStorage,
        SampleOperations.AddToPicklist,
        SampleOperations.RemoveFromPicklist,
        SampleOperations.Delete,
        SampleOperations.AddToWorkflow,
        SampleOperations.RemoveFromWorkflow,
        SampleOperations.AddAssayData,
        SampleOperations.LinkToStudy,
        SampleOperations.RecallFromStudy
    ]),
    'Locked': new Set([
        SampleOperations.AddToPicklist,
        SampleOperations.RemoveFromPicklist
    ]),
};
