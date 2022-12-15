/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { List } from 'immutable';

import { SchemaQuery } from '../public/SchemaQuery';

import { ViewInfo } from './ViewInfo';

// Created By / Modified By
export const CBMB = List<string>(['Created', 'CreatedBy', 'Modified', 'ModifiedBy']);

// ASSAY
const ASSAY_SCHEMA = 'assay';
export const ASSAY_TABLES = {
    ASSAY_LIST: SchemaQuery.create(ASSAY_SCHEMA, 'AssayList'),
    ASSAY_DETAILS_SQ: SchemaQuery.create(ASSAY_SCHEMA, 'AssayList', ViewInfo.DETAIL_NAME),
    SCHEMA: ASSAY_SCHEMA,
    RESULTS_QUERYNAME: 'Data',
};

// EXP
const EXP_SCHEMA = 'exp';
export const EXP_TABLES = {
    ASSAY_RUNS: SchemaQuery.create(EXP_SCHEMA, 'AssayRuns'),
    DATA: SchemaQuery.create(EXP_SCHEMA, 'Data'),
    DATA_CLASSES: SchemaQuery.create(EXP_SCHEMA, 'DataClasses'),
    DATA_CLASS_CATEGORY_TYPE: SchemaQuery.create(EXP_SCHEMA, 'DataClassCategoryType'),
    MATERIALS: SchemaQuery.create(EXP_SCHEMA, 'Materials'),
    PROTOCOLS: SchemaQuery.create(EXP_SCHEMA, 'Protocols'),
    SCHEMA: EXP_SCHEMA,
    SAMPLE_SETS: SchemaQuery.create(EXP_SCHEMA, 'SampleSets'),
    SAMPLE_SETS_DETAILS: SchemaQuery.create(EXP_SCHEMA, 'SampleSets', ViewInfo.DETAIL_NAME),
    SAMPLE_STATUS: SchemaQuery.create(EXP_SCHEMA, 'SampleStatus'),
};

// CORE
const CORE_SCHEMA = 'core';
export const CORE_TABLES = {
    SCHEMA: CORE_SCHEMA,
    DATA_STATES: SchemaQuery.create(CORE_SCHEMA, 'DataStates'),
    USERS: SchemaQuery.create(CORE_SCHEMA, 'Users'),
};

// DATA CLASSES
const DATA_CLASS_SCHEMA = 'exp.data';
export const DATA_CLASSES = {
    SCHEMA: DATA_CLASS_SCHEMA,
    CELL_LINE: SchemaQuery.create(DATA_CLASS_SCHEMA, 'CellLine'),
    CONSTRUCT: SchemaQuery.create(DATA_CLASS_SCHEMA, 'Construct'),
    EXPRESSION_SYSTEM: SchemaQuery.create(DATA_CLASS_SCHEMA, 'ExpressionSystem'),
    MOLECULE: SchemaQuery.create(DATA_CLASS_SCHEMA, 'Molecule'),
    MOLECULE_SET: SchemaQuery.create(DATA_CLASS_SCHEMA, 'MoleculeSet'),
    MOLECULAR_SPECIES: SchemaQuery.create(DATA_CLASS_SCHEMA, 'MolecularSpecies'),
    MOLECULAR_SPECIES_SEQ: SchemaQuery.create(DATA_CLASS_SCHEMA, 'MolecularSpeciesSequence'),
    NUC_SEQUENCE: SchemaQuery.create(DATA_CLASS_SCHEMA, 'NucSequence'),
    PROTEIN_SEQUENCE: SchemaQuery.create(DATA_CLASS_SCHEMA, 'ProtSequence'),
    VECTOR: SchemaQuery.create(DATA_CLASS_SCHEMA, 'Vector'),

    INGREDIENTS: SchemaQuery.create(DATA_CLASS_SCHEMA, 'Ingredients'),
    MIXTURES: SchemaQuery.create(DATA_CLASS_SCHEMA, 'Mixtures'),
};

// INVENTORY
const INVENTORY_SCHEMA = 'inventory';
export const INVENTORY = {
    SCHEMA: INVENTORY_SCHEMA,
    ITEMS: SchemaQuery.create(INVENTORY_SCHEMA, 'Item'),
    SAMPLE_ITEMS: SchemaQuery.create(INVENTORY_SCHEMA, 'SampleItems'),
    CHECKED_OUT_BY_FIELD: 'checkedOutBy',
    INVENTORY_COLS: [
        'LabelColor',
        'DisplayUnit',
        'StorageStatus',
        'StoredAmountDisplay',
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
    ],
};

// SAMPLE SETS
const SAMPLE_SET_SCHEMA = 'samples';
export const SAMPLE_SETS = {
    SCHEMA: SAMPLE_SET_SCHEMA,
    EXPRESSION_SYSTEM: SchemaQuery.create(SAMPLE_SET_SCHEMA, 'ExpressionSystemSamples'),
    MIXTURE_BATCHES: SchemaQuery.create(SAMPLE_SET_SCHEMA, 'MixtureBatches'),
    RAW_MATERIALS: SchemaQuery.create(SAMPLE_SET_SCHEMA, 'RawMaterials'),
    SAMPLES: SchemaQuery.create(SAMPLE_SET_SCHEMA, 'Samples'),
};

// SAMPLE MANAGEMENT
const SAMPLE_MANAGEMENT_SCHEMA = 'samplemanagement';
export const SAMPLE_MANAGEMENT = {
    SCHEMA: SAMPLE_MANAGEMENT_SCHEMA,
    SAMPLE_TYPE_INSIGHTS: SchemaQuery.create(SAMPLE_MANAGEMENT_SCHEMA, 'SampleTypeInsights'),
    SAMPLE_STATUS_COUNTS: SchemaQuery.create(SAMPLE_MANAGEMENT_SCHEMA, 'SampleStatusCounts'),
    SOURCE_SAMPLES: SchemaQuery.create(SAMPLE_MANAGEMENT_SCHEMA, 'SourceSamples'),
    INPUT_SAMPLES_SQ: SchemaQuery.create(SAMPLE_MANAGEMENT_SCHEMA, 'InputSamples'),
    JOBS: SchemaQuery.create(SAMPLE_MANAGEMENT_SCHEMA, 'Jobs'),
};

// STUDY
const STUDY_SCHEMA = 'study';
export const STUDY_TABLES = {
    SCHEMA: STUDY_SCHEMA,
    COHORT: SchemaQuery.create(STUDY_SCHEMA, 'Cohort'),
};

// LIST
const LIST_METADATA_SCHEMA = 'ListManager';
export const LIST_METADATA_TABLES = {
    SCHEMA: LIST_METADATA_SCHEMA,
    LIST_MANAGER: SchemaQuery.create(LIST_METADATA_SCHEMA, 'ListManager'),
    PICKLISTS: SchemaQuery.create(LIST_METADATA_SCHEMA, 'Picklists'),
};

const PICKLIST_SCHEMA = 'lists';
export const PICKLIST_TABLES = {
    SCHEMA: PICKLIST_SCHEMA,
};

export const SCHEMAS = {
    ASSAY_TABLES,
    EXP_TABLES,
    CORE_TABLES,
    SAMPLE_SETS,
    DATA_CLASSES,
    CBMB,
    STUDY_TABLES,
    INVENTORY,
    LIST_METADATA_TABLES,
    PICKLIST_TABLES,
    SAMPLE_MANAGEMENT,
};
