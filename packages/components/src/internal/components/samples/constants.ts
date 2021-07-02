import { FindField } from './models';

export const SAMPLE_INVENTORY_ITEM_SELECTION_KEY = 'inventoryItems';

export const SESSION_STORAGE_KEY_SUFFIX = '-find-ids';
export const UNIQUE_ID_FIND_FIELD: FindField = {
    nounSingular: 'Barcode',
    nounPlural: 'Barcodes',
    name: 'uniqueIds',
    helpTextTitle: 'Unique ID Fields',
    helpText: 'The ids provided will be matched against all of the fields of type Unique ID defined in your sample types.',
    label: 'Barcodes (Unique ID field)',
    storageKey: 'uniqueId' + SESSION_STORAGE_KEY_SUFFIX
};
export const SAMPLE_ID_FIND_FIELD: FindField = {
    nounSingular: 'Sample ID',
    nounPlural: 'Sample IDs',
    name: 'sampleIds',
    label: 'Sample IDs',
    storageKey: 'sampleId' + SESSION_STORAGE_KEY_SUFFIX
};
