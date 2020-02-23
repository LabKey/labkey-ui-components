import { SCHEMAS } from '../..';
import { EntityDataType } from './models';

export const DATA_DELETE_CONFIRMATION_ACTION = 'getDataDeleteConfirmationData.api';
export const SAMPLE_DELETE_CONFIRMATION_ACTION = 'getMaterialDeleteConfirmationData.api';

export const SampleTypeDataType : EntityDataType = {
    typeListingSchemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
    instanceSchemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
    deleteConfirmationActionName: SAMPLE_DELETE_CONFIRMATION_ACTION,
    nounSingular: "Sample",
    nounPlural: "Samples",
    descriptionSingular: "parent sample type",
    descriptionPlural: "parent sample types",
    uniqueFieldKey: 'Name'
};

export const DataClassDataType : EntityDataType = {
    typeListingSchemaQuery: SCHEMAS.EXP_TABLES.DATA_CLASSES,
    instanceSchemaName: SCHEMAS.DATA_CLASSES.SCHEMA,
    deleteConfirmationActionName: DATA_DELETE_CONFIRMATION_ACTION,
    nounSingular: "data",
    nounPlural: "data",
    descriptionSingular: "parent type",
    descriptionPlural: "parent types",
    uniqueFieldKey: 'Name'
};
