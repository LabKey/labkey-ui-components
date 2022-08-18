import { Query } from '@labkey/api';

import { IDomainField } from '../domainproperties/models';

import { SAMPLE_TYPE } from '../domainproperties/PropDescType';

import { FindField } from './models';
import { naturalSortByProperty } from '../../../public/sort';

export const SAMPLE_INVENTORY_ITEM_SELECTION_KEY = 'inventoryItems';

export const MAX_SELECTED_SAMPLES = 10000;

export const FIND_BY_IDS_QUERY_PARAM = 'findByIdsKey';

export const UNIQUE_ID_FIND_FIELD: FindField = {
    nounSingular: 'Barcode',
    nounPlural: 'Barcodes',
    name: 'uniqueIds',
    helpTextTitle: 'Barcode Fields',
    helpText:
        'The ids provided will be matched against all Unique ID fields or any fields marked as Barcodes as defined in your sample types.',
    label: 'Barcodes',
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

export const SAMPLE_STATUS_REQUIRED_COLUMNS = [
    SAMPLE_STATE_COLUMN_NAME,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SAMPLE_STATE_DESCRIPTION_COLUMN_NAME,
];

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

export const DEFAULT_SAMPLE_FIELD_CONFIG = {
    required: true,
    dataType: SAMPLE_TYPE,
    conceptURI: SAMPLE_TYPE.conceptURI,
    rangeURI: SAMPLE_TYPE.rangeURI,
    lookupSchema: 'exp',
    lookupQuery: 'Materials',
    lookupType: { ...SAMPLE_TYPE },
    name: 'SampleID',
    label: 'Sample ID',
} as Partial<IDomainField>;

export const ALIQUOTED_FROM_COL = 'AliquotedFrom';
const STATUS_COL = 'Status';

export const SAMPLE_STORAGE_COLUMNS = [
    'StorageLocation',
    'StorageRow',
    'StorageCol',
    'StoredAmount',
    'Units',
    'FreezeThawCount',
    'EnteredStorage',
    'CheckedOut',
    'CheckedOutBy',
    'StorageComment',
];

export const SAMPLE_STORAGE_COLUMNS_WITH_SUBSELECT_EXPR = [
    'SourceProtocolLSID',
    'StorageStatus',
    'SampleTypeUnits',
    'StoredAmount',
    'Units',
    'FreezeThawCount',
    'CheckedOutBy',
    'StorageRow',
    'StorageCol',
    'CheckedOut',
];

export const SAMPLE_INSERT_EXTRA_COLUMNS = [...SAMPLE_STORAGE_COLUMNS, ALIQUOTED_FROM_COL];

export const SAMPLE_EXPORT_CONFIG = {
    'exportAlias.name': DEFAULT_SAMPLE_FIELD_CONFIG.label,
    'exportAlias.aliquotedFromLSID': ALIQUOTED_FROM_COL,
    'exportAlias.sampleState': STATUS_COL,
};

export const SAMPLE_DATA_EXPORT_CONFIG = {
    ...SAMPLE_EXPORT_CONFIG,
    includeColumn: ['AliquotedFromLSID'],
};

export const COMMON_AUDIT_QUERIES = [
    { value: 'attachmentauditevent', label: 'Attachment Events' },
    { value: 'domainauditevent', label: 'Domain Events' },
    { value: 'domainpropertyauditevent', label: 'Domain Property Events' },
    { value: 'queryupdateauditevent', label: 'Data Update Events', hasDetail: true },
    { value: 'inventoryauditevent', label: 'Freezer Management Events', hasDetail: true },
    { value: 'listauditevent', label: 'List Events' },
    {
        value: 'groupauditevent',
        label: 'Roles and Assignment Events',
        containerFilter: Query.ContainerFilter.allFolders,
    },
    { value: 'samplesetauditevent', label: 'Sample Type Events' },
    { value: 'sampletimelineevent', label: 'Sample Timeline Events', hasDetail: true },
    { value: 'userauditevent', label: 'User Events', containerFilter: Query.ContainerFilter.allFolders },
];

export const ASSAY_AUDIT_QUERY = { value: 'experimentauditevent', label: 'Assay Events' };
export const WORKFLOW_AUDIT_QUERY = { value: 'samplesworkflowauditevent', label: 'Sample Workflow Events', hasDetail: true };
export const SOURCE_AUDIT_QUERY = { value: 'sourcesauditevent', label: 'Sources Events', hasDetail: true };
