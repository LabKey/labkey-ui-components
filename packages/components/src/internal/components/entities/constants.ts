import { SCHEMAS } from '../../..';

import { EntityDataType } from './models';
import { DELETE_SAMPLES_TOPIC } from "../../util/helpLinks";

export const DATA_DELETE_CONFIRMATION_ACTION = 'getDataDeleteConfirmationData.api';
export const SAMPLE_DELETE_CONFIRMATION_ACTION = 'getMaterialDeleteConfirmationData.api';

export const PARENT_DATA_GRID_PREFIX = 'parent-data';

export const SampleTypeDataType: EntityDataType = {
    typeListingSchemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
    instanceSchemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
    deleteConfirmationActionName: SAMPLE_DELETE_CONFIRMATION_ACTION,
    nounSingular: 'sample',
    nounPlural: 'samples',
    nounAsParentSingular: 'Parent',
    typeNounSingular: 'Sample Type',
    descriptionSingular: 'parent sample type',
    descriptionPlural: 'parent sample types',
    uniqueFieldKey: 'Name',
    dependencyText: 'derived sample or assay data dependencies',
    deleteHelpLinkTopic: DELETE_SAMPLES_TOPIC,
    inputColumnName: 'Inputs/Materials/First',
    inputTypeColumnName: 'Inputs/Materials/First/SampleSet',
    inputTypeValueField: 'lsid',
    insertColumnNamePrefix: 'MaterialInputs/',
};

export const DataClassDataType: EntityDataType = {
    typeListingSchemaQuery: SCHEMAS.EXP_TABLES.DATA_CLASSES,
    instanceSchemaName: SCHEMAS.DATA_CLASSES.SCHEMA,
    deleteConfirmationActionName: DATA_DELETE_CONFIRMATION_ACTION,
    nounSingular: 'data',
    nounPlural: 'data',
    typeNounSingular: 'Data Type',
    nounAsParentSingular: 'Parent',
    descriptionSingular: 'parent type',
    descriptionPlural: 'parent types',
    uniqueFieldKey: 'Name',
    dependencyText: 'derived sample dependencies',
    deleteHelpLinkTopic: 'dataClass', // no topic specific to deleting data classes yet, so we refer to data classes in general
    inputColumnName: 'Inputs/Data/First',
    inputTypeColumnName: 'Inputs/Data/First/DataClass',
    inputTypeValueField: 'rowId',
    insertColumnNamePrefix: 'DataInputs/',
};
