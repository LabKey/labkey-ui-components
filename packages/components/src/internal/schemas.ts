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
import { List, Map } from 'immutable';
import { Query } from '@labkey/api';

// Have to import SchemaQuery like this or SchemaQuery.create fails because SchemaQuery is undefined.
import { QueryInfo, SchemaDetails, SchemaQuery } from '..';

// Created By / Modified By
export const CBMB = List<string>(['Created', 'CreatedBy', 'Modified', 'ModifiedBy']);

// ASSAY
const ASSAY_SCHEMA = 'assay';
export const ASSAY_TABLES = {
    ASSAY_LIST: SchemaQuery.create(ASSAY_SCHEMA, 'AssayList'),
    SCHEMA: ASSAY_SCHEMA,
};

// EXP
const EXP_SCHEMA = 'exp';
export const EXP_TABLES = {
    ASSAY_HEAT_MAP: SchemaQuery.create(EXP_SCHEMA, 'AssaysHeatMap'),
    ASSAY_RUNS: SchemaQuery.create(EXP_SCHEMA, 'AssayRuns'),
    DATA: SchemaQuery.create(EXP_SCHEMA, 'Data'),
    DATA_CLASSES: SchemaQuery.create(EXP_SCHEMA, 'DataClasses'),
    DATA_CLASS_CATEGORY_TYPE: SchemaQuery.create(EXP_SCHEMA, 'DataClassCategoryType'),
    MATERIALS: SchemaQuery.create(EXP_SCHEMA, 'Materials'),
    PROTOCOLS: SchemaQuery.create(EXP_SCHEMA, 'Protocols'),
    SCHEMA: EXP_SCHEMA,
    SAMPLE_SETS: SchemaQuery.create(EXP_SCHEMA, 'SampleSets'),
    SAMPLE_SET_HEAT_MAP: SchemaQuery.create(EXP_SCHEMA, 'SampleSetHeatMap'),
};

// CORE
const CORE_SCHEMA = 'core';
export const CORE_TABLES = {
    SCHEMA: CORE_SCHEMA,
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
    SAMPLE_ITEMS: SchemaQuery.create(INVENTORY_SCHEMA, 'SampleItems'),
}

// SAMPLE SETS
const SAMPLE_SET_SCHEMA = 'samples';
export const SAMPLE_SETS = {
    SCHEMA: SAMPLE_SET_SCHEMA,
    EXPRESSION_SYSTEM: SchemaQuery.create(SAMPLE_SET_SCHEMA, 'ExpressionSystemSamples'),
    MIXTURE_BATCHES: SchemaQuery.create(SAMPLE_SET_SCHEMA, 'MixtureBatches'),
    RAW_MATERIALS: SchemaQuery.create(SAMPLE_SET_SCHEMA, 'RawMaterials'),
    SAMPLES: SchemaQuery.create(SAMPLE_SET_SCHEMA, 'Samples'),
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
    LIST_MANAGER: SchemaQuery.create(LIST_METADATA_SCHEMA, "ListManager"),
    PICKLISTS: SchemaQuery.create(LIST_METADATA_SCHEMA, "Picklists")
}

export const SCHEMAS = {
    ASSAY_TABLES,
    EXP_TABLES,
    CORE_TABLES,
    SAMPLE_SETS,
    DATA_CLASSES,
    CBMB,
    STUDY_TABLES,
    INVENTORY,
    LIST_METADATA_TABLES
};

export function fetchSchemas(schemaName?: string): Promise<List<Map<string, SchemaDetails>>> {
    return new Promise((resolve, reject) => {
        Query.getSchemas({
            apiVersion: 9.3,
            schemaName,
            success: schemas => {
                resolve(
                    processSchemas(schemas)
                        .filter(schema => {
                            const start = schemaName ? schemaName.length + 1 : 0;
                            return schema.fullyQualifiedName.substring(start).indexOf('.') === -1;
                        })
                        .sortBy(schema => schema.schemaName.toLowerCase())
                        .toList()
                );
            },
            failure: error => {
                reject(error);
            },
        });
    });
}

export function processSchemas(schemas: any, allSchemas?: Map<string, SchemaDetails>): Map<string, SchemaDetails> {
    let top = false;
    if (allSchemas === undefined) {
        top = true;
        allSchemas = Map<string, SchemaDetails>().asMutable();
    }

    for (const schemaName in schemas) {
        if (schemas.hasOwnProperty(schemaName)) {
            const schema = schemas[schemaName];
            allSchemas.set(schema.fullyQualifiedName.toLowerCase(), SchemaDetails.create(schema));
            if (schema.schemas !== undefined) {
                processSchemas(schema.schemas, allSchemas);
            }
        }
    }

    return top ? allSchemas.asImmutable() : allSchemas;
}

// DO NOT USE THIS if you're looking for QueryInfo
export function fetchGetQueries(schemaName: string): Promise<List<QueryInfo>> {
    return new Promise((resolve, reject) => {
        Query.getQueries({
            schemaName,
            success: data => {
                const queries = List<QueryInfo>(
                    data.queries.map(getQueryResult =>
                        QueryInfo.create({
                            ...getQueryResult,
                            schemaName,
                        })
                    )
                )
                    .sort((a, b) => {
                        if (a.name && b.name) {
                            const aLower = a.name.toLowerCase();
                            const bLower = b.name.toLowerCase();

                            return aLower === bLower ? 0 : aLower > bLower ? 1 : -1;
                        }

                        return a.name === b.name ? 0 : a.name > b.name ? 1 : -1;
                    })
                    .toList();

                resolve(queries);
            },
            failure: error => {
                reject(error);
            },
        });
    });
}
