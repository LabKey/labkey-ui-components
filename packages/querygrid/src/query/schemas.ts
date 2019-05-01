import { SchemaQuery } from '@glass/base';

// EXP
const EXP_SCHEMA = 'exp';
export const EXP_TABLES = {
    ASSAY_HEAT_MAP:         SchemaQuery.create(EXP_SCHEMA, 'AssaysHeatMap'),
    ASSAY_RUNS:             SchemaQuery.create(EXP_SCHEMA, 'AssayRuns'),
    DATA:                   SchemaQuery.create(EXP_SCHEMA, 'Data'),
    DATA_CLASSES:           SchemaQuery.create(EXP_SCHEMA, 'DataClasses'),
    MATERIALS:              SchemaQuery.create(EXP_SCHEMA, 'Materials'),
    PROTOCOLS:              SchemaQuery.create(EXP_SCHEMA, 'Protocols'),
    SCHEMA:                 EXP_SCHEMA,
    SAMPLE_SETS:            SchemaQuery.create(EXP_SCHEMA, 'SampleSets'),
    SAMPLE_SET_HEAT_MAP:    SchemaQuery.create(EXP_SCHEMA, 'SampleSetHeatMap')
};

// SAMPLE SETS
const SAMPLE_SET_SCHEMA = 'samples';
export const SAMPLE_SETS = {
    SCHEMA: SAMPLE_SET_SCHEMA,
    EXPRESSION_SYSTEM: SchemaQuery.create(SAMPLE_SET_SCHEMA, 'ExpressionSystemSamples'),
    MIXTURE_BATCHES:   SchemaQuery.create(SAMPLE_SET_SCHEMA, 'MixtureBatches'),
    RAW_MATERIALS:     SchemaQuery.create(SAMPLE_SET_SCHEMA, 'RawMaterials'),
    SAMPLES:           SchemaQuery.create(SAMPLE_SET_SCHEMA, 'Samples')
};

export const SCHEMAS = {
    EXP_TABLES: EXP_TABLES,
    SAMPLE_SETS: SAMPLE_SETS
};