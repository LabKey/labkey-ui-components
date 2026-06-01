/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import assayDefJSON from '../test/data/assayDefinitionModel.json';
import assayDefNoSampleIdJSON from '../test/data/assayDefinitionModelNoSampleId.json';

import { SchemaQuery } from '../public/SchemaQuery';

import { QueryInfo } from '../public/QueryInfo';

import { AssayDefinitionModel, AssayDomainTypes } from './AssayDefinitionModel';
import { getTestAPIWrapper } from './APIWrapper';
import { getQueryTestAPIWrapper } from './query/APIWrapper';

describe('AssayDefinitionModel', () => {
    test('with getSampleColumn()', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const sampleColumn = modelWithSampleId.getSampleColumn();
        expect(sampleColumn).toBeTruthy();
        expect(sampleColumn.domain).toBe('Result');
        expect(sampleColumn.column.isLookup()).toBeTruthy();
        expect(sampleColumn.column.fieldKey).toBe('SampleID');
    });

    test('without getSampleColumn()', () => {
        const modelWithout = AssayDefinitionModel.create(assayDefNoSampleIdJSON);
        const nonSampleColumn = modelWithout.getSampleColumn();
        expect(nonSampleColumn).toBeUndefined();
    });

    test('getSampleColumn with invalid domainType', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const sampleColumn = modelWithSampleId.getSampleColumn(AssayDomainTypes.BATCH);
        expect(sampleColumn).toBeUndefined();
    });

    test('getSampleColumn with domainType', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const sampleColumn = modelWithSampleId.getSampleColumn(AssayDomainTypes.RESULT);
        expect(sampleColumn.column.fieldKey).toBe('SampleID');
    });

    test('hasLookup() with sample lookup', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        expect(modelWithSampleId.hasLookup(new SchemaQuery('samples', 'Samples'))).toBeTruthy();
        expect(modelWithSampleId.hasLookup(new SchemaQuery('samples', 'Samples'), true)).toBeTruthy();
        expect(modelWithSampleId.hasLookup(new SchemaQuery('samples', 'Samples'), false, true)).toBeTruthy();
        expect(modelWithSampleId.hasLookup(new SchemaQuery('study', 'Study'))).toBeTruthy();
        expect(modelWithSampleId.hasLookup(new SchemaQuery('study', 'Study'), true)).toBeTruthy();
        expect(modelWithSampleId.hasLookup(new SchemaQuery('study', 'Study'), false, true)).toBeFalsy();
        expect(modelWithSampleId.hasLookup(new SchemaQuery('study', 'Other'))).toBeFalsy();
        expect(modelWithSampleId.hasLookup(new SchemaQuery('study', 'Other'), true)).toBeFalsy();
        expect(modelWithSampleId.hasLookup(new SchemaQuery('study', 'Other'), false, true)).toBeFalsy();
    });

    test('hasLookup() without sample lookup', () => {
        const modelWithout = AssayDefinitionModel.create(assayDefNoSampleIdJSON);
        expect(modelWithout.hasLookup(new SchemaQuery('samples', 'Samples'))).toBeFalsy();
        expect(modelWithout.hasLookup(new SchemaQuery('samples', 'Samples'), true)).toBeFalsy();
        expect(modelWithout.hasLookup(new SchemaQuery('samples', 'Samples'), false, true)).toBeFalsy();
        expect(modelWithout.hasLookup(new SchemaQuery('study', 'Study'))).toBeTruthy();
        expect(modelWithout.hasLookup(new SchemaQuery('study', 'Study'), true)).toBeTruthy();
        expect(modelWithout.hasLookup(new SchemaQuery('study', 'Study'), false, true)).toBeFalsy();
    });

    test('getSampleColumnFieldKeys()', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const fieldKeys = modelWithSampleId.getSampleColumnFieldKeys();
        expect(fieldKeys.length).toBe(1);
        expect(fieldKeys[0]).toBe('SampleID');
    });

    test('getDomainColumns()', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const batchColumns = modelWithSampleId.getDomainColumns(AssayDomainTypes.BATCH);
        expect(batchColumns.size).toBe(2);
        expect(batchColumns.has('ParticipantVisitResolver')).toBeFalsy();
        expect(batchColumns.has('participantvisitresolver')).toBeTruthy();
        expect(batchColumns.has('targetstudy')).toBeTruthy();

        const runColumns = modelWithSampleId.getDomainColumns(AssayDomainTypes.RUN);
        expect(runColumns.size).toBe(0);

        const dataColumns = modelWithSampleId.getDomainColumns(AssayDomainTypes.RESULT);
        expect(dataColumns.size).toBe(4);
        expect(dataColumns.has('Date')).toBeFalsy();
        expect(dataColumns.has('date')).toBeTruthy();
    });

    test('getDomainFileColumns', () => {
        const model = new AssayDefinitionModel();
        expect(model.getDomainFileColumns(AssayDomainTypes.RESULT).length).toBe(0);

        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        expect(modelWithSampleId.getDomainFileColumns(AssayDomainTypes.RESULT).length).toBe(0);

        const modelWithFiles = AssayDefinitionModel.create({
            domains: {
                'GPAT 1 Batch Fields': [],
                'GPAT 1 Run Fields': [],
                'GPAT 1 Data Fields': [
                    { inputType: 'file', fieldKey: 'f1' },
                    { inputType: 'text', fieldKey: 'other' },
                    { inputType: 'file', fieldKey: 'f2' },
                ],
            },
            domainTypes: {
                Run: 'GPAT 1 Run Fields',
                Batch: 'GPAT 1 Batch Fields',
                Result: 'GPAT 1 Data Fields',
            },
        });
        const columns = modelWithFiles.getDomainFileColumns(AssayDomainTypes.RESULT);
        expect(columns.map(c => c.fieldKey)).toStrictEqual(['f1', 'f2']);
    });

    test('isSampleColInResults', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const sampleColumn = modelWithSampleId.getSampleColumn();
        expect(modelWithSampleId.isSampleColInResults(undefined, undefined)).toBeFalsy();
        expect(modelWithSampleId.isSampleColInResults(undefined, sampleColumn.domain)).toBeFalsy();
        expect(modelWithSampleId.isSampleColInResults(sampleColumn.column, undefined)).toBeFalsy();
        expect(modelWithSampleId.isSampleColInResults(sampleColumn.column, sampleColumn.domain)).toBeTruthy();
        expect(modelWithSampleId.isSampleColInResults(sampleColumn.column, AssayDomainTypes.RESULT)).toBeTruthy();
        expect(modelWithSampleId.isSampleColInResults(sampleColumn.column, AssayDomainTypes.RUN)).toBeFalsy();
        expect(modelWithSampleId.isSampleColInResults(sampleColumn.column, AssayDomainTypes.BATCH)).toBeFalsy();
    });

    test('getResultsSampleTypeQueryInfo', async () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        expect(
            await modelWithSampleId.getResultsSampleTypeQueryInfo(
                getTestAPIWrapper(jest.fn, {
                    query: getQueryTestAPIWrapper(jest.fn, {
                        getQueryDetails: jest.fn().mockResolvedValue(new QueryInfo({})),
                    }),
                })
            )
        ).toBeDefined();

        // should be undefined if sample column is lookup to All Samples (i.e. exp.Material)
        const json = assayDefJSON;
        json.domains['GPAT 1 Data Fields'][0].lookup.schema = 'exp';
        json.domains['GPAT 1 Data Fields'][0].lookup.schemaName = 'exp';
        json.domains['GPAT 1 Data Fields'][0].lookup.table = 'Material';
        json.domains['GPAT 1 Data Fields'][0].lookup.queryName = 'Material';
        const modelWithAllSampleId = AssayDefinitionModel.create(json);
        expect(
            await modelWithAllSampleId.getResultsSampleTypeQueryInfo(
                getTestAPIWrapper(jest.fn, {
                    query: getQueryTestAPIWrapper(jest.fn, {
                        getQueryDetails: jest.fn().mockResolvedValue(new QueryInfo({})),
                    }),
                })
            )
        ).toBeUndefined();
    });
});
