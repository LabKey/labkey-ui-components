import { List } from 'immutable';
import { Filter } from '@labkey/api';

import assayDefJSON from '../test/data/assayDefinitionModel.json';
import assayDefNoSampleIdJSON from '../test/data/assayDefinitionModelNoSampleId.json';

import { SchemaQuery } from '../public/SchemaQuery';

import { AssayDefinitionModel, AssayDomainTypes } from './AssayDefinitionModel';

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
        expect(nonSampleColumn).toBe(null);
    });

    test('getSampleColumn with invalid domainType', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const sampleColumn = modelWithSampleId.getSampleColumn(AssayDomainTypes.BATCH);
        expect(sampleColumn).toBe(null);
    });

    test('getSampleColumn with domainType', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const sampleColumn = modelWithSampleId.getSampleColumn(AssayDomainTypes.RESULT);
        expect(sampleColumn.column.fieldKey).toBe('SampleID');
    });

    test('hasLookup()', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        expect(modelWithSampleId.hasLookup(new SchemaQuery('samples', 'Samples'))).toBeTruthy();
        expect(modelWithSampleId.hasLookup(new SchemaQuery('study', 'Study'))).toBeTruthy();
        expect(modelWithSampleId.hasLookup(new SchemaQuery('study', 'Other'))).toBeFalsy();
    });

    test('getSampleColumnFieldKeys()', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const fieldKeys = modelWithSampleId.getSampleColumnFieldKeys();
        expect(fieldKeys.size).toBe(1);
        expect(fieldKeys.get(0)).toBe('SampleID');
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

    test('createSampleFilter, no columns', () => {
        const model = new AssayDefinitionModel();
        const filter = model.createSampleFilter(List.of(), [1, 2], Filter.Types.IN);
        expect(filter).toBeUndefined();
    });

    test('createSampleFilter, single column', () => {
        const model = new AssayDefinitionModel();
        const filter = model.createSampleFilter(List.of('a'), [1, 2], Filter.Types.IN);
        expect(filter.getURLParameterName()).toBe('query.a/RowId~in');
        expect(filter.getURLParameterValue()).toBe('1;2');
    });

    test('createSampleFilter, multiple columns', () => {
        const model = new AssayDefinitionModel();
        const filter = model.createSampleFilter(List.of('a', 'b'), [1, 2], Filter.Types.IN);
        expect(filter.getURLParameterName()).toBe('query.*~where');
        expect(filter.getURLParameterValue()).toBe(
            'RowId IN (SELECT RowId FROM Data WHERE "a"."RowId" IN (1,2) UNION SELECT RowId FROM Data WHERE "b"."RowId" IN (1,2))'
        );
    });

    // Issue 48364
    test('createSampleFilter, multiple columns with space in name', () => {
        const model = new AssayDefinitionModel();
        const filter = model.createSampleFilter(List.of('sample result', 'b'), [1, 2], Filter.Types.IN);
        expect(filter.getURLParameterName()).toBe('query.*~where');
        expect(filter.getURLParameterValue()).toBe(
            'RowId IN (SELECT RowId FROM Data WHERE "sample result"."RowId" IN (1,2) UNION SELECT RowId FROM Data WHERE "b"."RowId" IN (1,2))'
        );
    });
});
