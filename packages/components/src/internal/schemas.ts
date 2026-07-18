/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List } from 'immutable';

import { SchemaQuery } from '../public/SchemaQuery';

import { ViewInfo } from './ViewInfo';

// Created By / Modified By
export const CBMB = List<string>(['Created', 'CreatedBy', 'Modified', 'ModifiedBy']);

// ASSAY
const ASSAY_SCHEMA = 'assay';
export const ASSAY_TABLES = {
    ASSAY_LIST: new SchemaQuery(ASSAY_SCHEMA, 'AssayList'),
    ASSAY_DETAILS_SQ: new SchemaQuery(ASSAY_SCHEMA, 'AssayList', ViewInfo.DETAIL_NAME),
    ASSAY_RUN_COUNTS: new SchemaQuery(ASSAY_SCHEMA, 'AssayRunCounts'),
    ASSAY_RUNS: new SchemaQuery(ASSAY_SCHEMA, 'AssayRuns'),
    ASSAY_RUNS_PER_SAMPLE: new SchemaQuery(ASSAY_SCHEMA, 'AssayRunsPerSample'),
    ASSAY_RUNS_PER_SAMPLE_CHILD_FOLDER: new SchemaQuery(ASSAY_SCHEMA, 'AssayRunsPerSampleChildFolder'),
    RESULTS_QUERYNAME: 'Data',
    SCHEMA: ASSAY_SCHEMA,
};

// EXP
const EXP_SCHEMA = 'exp';
export const EXP_TABLES = {
    DATA: new SchemaQuery(EXP_SCHEMA, 'Data'),
    DATA_CLASSES: new SchemaQuery(EXP_SCHEMA, 'DataClasses'),
    DATA_CLASS_CATEGORY_TYPE: new SchemaQuery(EXP_SCHEMA, 'DataClassCategoryType'),
    MATERIALS: new SchemaQuery(EXP_SCHEMA, 'Materials'),
    PROTOCOLS: new SchemaQuery(EXP_SCHEMA, 'Protocols'),
    RUN_GROUPS: new SchemaQuery(EXP_SCHEMA, 'RunGroups'),
    SCHEMA: EXP_SCHEMA,
    SAMPLE_SETS: new SchemaQuery(EXP_SCHEMA, 'SampleSets'),
    SAMPLE_SETS_DETAILS: new SchemaQuery(EXP_SCHEMA, 'SampleSets', ViewInfo.DETAIL_NAME),
    SAMPLE_STATUS: new SchemaQuery(EXP_SCHEMA, 'SampleStatus'),
    DATA_COLORS: new SchemaQuery(EXP_SCHEMA, 'DataColors'),
};

// CORE
const CORE_SCHEMA = 'core';
export const CORE_TABLES = {
    SCHEMA: CORE_SCHEMA,
    DATA_STATES: new SchemaQuery(CORE_SCHEMA, 'DataStates'),
    PRINCIPALS: new SchemaQuery(CORE_SCHEMA, 'Principals'),
    SITE_USERS: new SchemaQuery(CORE_SCHEMA, 'SiteUsers'),
    USERS: new SchemaQuery(CORE_SCHEMA, 'Users'),
    USER_API_KEYS: new SchemaQuery(CORE_SCHEMA, 'UserApiKeys'),
};

// DATA CLASSES
const DATA_CLASS_SCHEMA = 'exp.data';
export const DATA_CLASSES = {
    SCHEMA: DATA_CLASS_SCHEMA,
    CELL_LINE: new SchemaQuery(DATA_CLASS_SCHEMA, 'CellLine'),
    CONSTRUCT: new SchemaQuery(DATA_CLASS_SCHEMA, 'Construct'),
    COMPOUND: new SchemaQuery(DATA_CLASS_SCHEMA, 'Compound'),
    EXPRESSION_SYSTEM: new SchemaQuery(DATA_CLASS_SCHEMA, 'ExpressionSystem'),
    MOLECULE: new SchemaQuery(DATA_CLASS_SCHEMA, 'Molecule'),
    MOLECULE_SET: new SchemaQuery(DATA_CLASS_SCHEMA, 'MoleculeSet'),
    MOLECULAR_SPECIES: new SchemaQuery(DATA_CLASS_SCHEMA, 'MolecularSpecies'),
    MOLECULAR_SPECIES_SEQ: new SchemaQuery(DATA_CLASS_SCHEMA, 'MolecularSpeciesSequence'),
    NUC_SEQUENCE: new SchemaQuery(DATA_CLASS_SCHEMA, 'NucSequence'),
    PROTEIN_SEQUENCE: new SchemaQuery(DATA_CLASS_SCHEMA, 'ProtSequence'),
    VECTOR: new SchemaQuery(DATA_CLASS_SCHEMA, 'Vector'),

    INGREDIENTS: new SchemaQuery(DATA_CLASS_SCHEMA, 'Ingredients'),
    MIXTURES: new SchemaQuery(DATA_CLASS_SCHEMA, 'Mixtures'),
};

// INVENTORY
const INVENTORY_SCHEMA = 'inventory';
export const INVENTORY = {
    SCHEMA: INVENTORY_SCHEMA,
    ITEMS: new SchemaQuery(INVENTORY_SCHEMA, 'Item'),
    ITEM_SAMPLES: new SchemaQuery(INVENTORY_SCHEMA, 'ItemSamples'),
    SAMPLE_ITEMS: new SchemaQuery(INVENTORY_SCHEMA, 'SampleItems'),
    CHECKED_OUT_BY_FIELD: 'checkedOutBy',
    INVENTORY_COLS: [
        'LabelColor',
        'DisplayUnit',
        'StorageStatus',
        'StoredAmountDisplay',
        'StorageLocation',
        'StorageRow',
        'StorageCol',
        'FreezeThawCount',
        'EnteredStorage',
        'CheckedOut',
        'CheckedOutBy',
        'StorageComment',
    ],
};

// SAMPLE SETS
const SAMPLE_SET_SCHEMA = 'samples';
export const SAMPLE_SETS = {
    SCHEMA: SAMPLE_SET_SCHEMA,
    EXPRESSION_SYSTEM: new SchemaQuery(SAMPLE_SET_SCHEMA, 'ExpressionSystemSamples'),
    MIXTURE_BATCHES: new SchemaQuery(SAMPLE_SET_SCHEMA, 'MixtureBatches'),
    RAW_MATERIALS: new SchemaQuery(SAMPLE_SET_SCHEMA, 'RawMaterials'),
    SAMPLES: new SchemaQuery(SAMPLE_SET_SCHEMA, 'Samples'),
};

// SAMPLE MANAGEMENT
const SAMPLE_MANAGEMENT_SCHEMA = 'samplemanagement';
export const SAMPLE_MANAGEMENT = {
    SCHEMA: SAMPLE_MANAGEMENT_SCHEMA,
    SAMPLE_TYPE_INSIGHTS: new SchemaQuery(SAMPLE_MANAGEMENT_SCHEMA, 'SampleTypeInsights'),
    SAMPLE_STATUS_COUNTS: new SchemaQuery(SAMPLE_MANAGEMENT_SCHEMA, 'SampleStatusCounts'),
    SOURCE_SAMPLES: new SchemaQuery(SAMPLE_MANAGEMENT_SCHEMA, 'SourceSamples'),
};

// WORKFLOW
export const WORKFLOW_SCHEMA = 'workflow';
export const WORKFLOW = {
    SCHEMA: WORKFLOW_SCHEMA,
    JOB_TYPES_SCHEMA: 'workflow.jobtypes',
    JOB: new SchemaQuery(WORKFLOW_SCHEMA, 'Job'),
    ACTION: new SchemaQuery(WORKFLOW_SCHEMA, 'Action'),
    JOB_TEMPLATE: new SchemaQuery(WORKFLOW_SCHEMA, 'JobTemplate'),
    JOB_PRIORITY: new SchemaQuery(WORKFLOW_SCHEMA, 'WorkflowJobPriority'),
    JOB_INPUT_SAMPLES: new SchemaQuery(WORKFLOW_SCHEMA, 'JobInputSamples'),
};

// STUDY
const STUDY_SCHEMA = 'study';
export const STUDY_TABLES = {
    SCHEMA: STUDY_SCHEMA,
    COHORT: new SchemaQuery(STUDY_SCHEMA, 'Cohort'),
};

// LIST
const LIST_METADATA_SCHEMA = 'ListManager';
export const LIST_METADATA_TABLES = {
    SCHEMA: LIST_METADATA_SCHEMA,
    LIST_MANAGER: new SchemaQuery(LIST_METADATA_SCHEMA, 'ListManager'),
    PICKLISTS: new SchemaQuery(LIST_METADATA_SCHEMA, 'Picklists'),
};

const PICKLIST_SCHEMA = 'lists';
export const PICKLIST_TABLES = {
    SCHEMA: PICKLIST_SCHEMA,
};

const AUDIT_SCHEMA = 'auditlog';
export const AUDIT_TABLES = {
    SCHEMA: AUDIT_SCHEMA,
};

const PLATE_SCHEMA = 'plate';
const PLATE_TABLES = {
    CONTROL_SAMPLES: new SchemaQuery(PLATE_SCHEMA, 'ControlSamples'),
    HIT_SELECTION_SUMMARY: new SchemaQuery(PLATE_SCHEMA, 'HitSelectionSummary'),
    PLATE: new SchemaQuery(PLATE_SCHEMA, 'Plate'),
    PLATE_SET: new SchemaQuery(PLATE_SCHEMA, 'PlateSet'),
    PLATE_SOURCE: new SchemaQuery(PLATE_SCHEMA, 'PlateSource'),
    PLATE_TYPE: new SchemaQuery(PLATE_SCHEMA, 'PlateType'),
    PRIMARY_HIT_SELECTION_SUMMARY: new SchemaQuery(PLATE_SCHEMA, 'PrimaryHitSelectionSummary'),
    REFORMAT_TARGET_PLATE_SETS: new SchemaQuery(PLATE_SCHEMA, 'ReformatTargetPlateSets'),
    SAMPLES_IN_PLATE_SETS: new SchemaQuery(PLATE_SCHEMA, 'SamplesInPlateSets'),
    SCHEMA: PLATE_SCHEMA,
    WELL: new SchemaQuery(PLATE_SCHEMA, 'Well'),
    WELL_GROUP: new SchemaQuery(PLATE_SCHEMA, 'WellGroup'),
};

export const SCHEMAS = {
    ASSAY_TABLES,
    AUDIT_TABLES,
    EXP_TABLES,
    CORE_TABLES,
    SAMPLE_SETS,
    DATA_CLASSES,
    CBMB,
    STUDY_TABLES,
    INVENTORY,
    LIST_METADATA_TABLES,
    PICKLIST_TABLES,
    PLATE_TABLES,
    SAMPLE_MANAGEMENT,
    WORKFLOW,
};
