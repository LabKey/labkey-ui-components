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
import { fromJS, List, OrderedMap } from 'immutable';

import assayDefJSON from '../../../../test/data/assayDefinitionModel.json';
import assayDefNoSampleIdJSON from '../../../../test/data/assayDefinitionModelNoSampleId.json';

import {
    AssayDefinitionModel,
    AssayDomainTypes,
    SchemaQuery,
} from '../../../..';

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

    test('with getSampleColumn()', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        const sampleColumn = modelWithSampleId.getSampleColumn();
        expect(sampleColumn.column.name).toBe('SampleID');
    });

    test('without getSampleColumn()', () => {
        const modelWithout = AssayDefinitionModel.create(assayDefNoSampleIdJSON);
        const nonSampleColumn = modelWithout.getSampleColumn();
        expect(nonSampleColumn).toBe(null);
    });

    test('hasLookup()', () => {
        const modelWithSampleId = AssayDefinitionModel.create(assayDefJSON);
        expect(modelWithSampleId.hasLookup(SchemaQuery.create('samples', 'Samples'))).toBeTruthy();
        expect(modelWithSampleId.hasLookup(SchemaQuery.create('study', 'Study'))).toBeTruthy();
        expect(modelWithSampleId.hasLookup(SchemaQuery.create('study', 'Other'))).toBeFalsy();
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
});

