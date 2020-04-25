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
import { fromJS, List } from 'immutable';

import { getStateQueryGridModel } from '../../models';
import { initQueryGridState } from '../../global';
import { ASSAY_DEFINITION_MODEL } from '../../test/data/constants';
import sampleSet2QueryInfo from '../../test/data/sampleSet2-getQueryDetails.json';
import { AssayDefinitionModel, QueryInfo, SchemaQuery } from '../../index';

import { getImportItemsForAssayDefinitions, getRunPropertiesFileName } from './actions';

beforeAll(() => {
    initQueryGridState();
});

describe('getImportItemsForAssayDefinitions', () => {
    test('empty list', () => {
        const assayDefs = List<AssayDefinitionModel>();
        const sampleModel = getStateQueryGridModel('jestTest-0', SchemaQuery.create('samples', 'samples'));
        const items = getImportItemsForAssayDefinitions(assayDefs, sampleModel);
        expect(items.size).toBe(0);
    });

    test('with expected match', () => {
        const assayDefs = List<AssayDefinitionModel>([ASSAY_DEFINITION_MODEL]);
        let queryInfo = QueryInfo.create(sampleSet2QueryInfo);

        // with a query name that DOES NOT match the assay def sampleColumn lookup
        queryInfo = queryInfo.set('schemaQuery', SchemaQuery.create('samples', 'Sample set 1')) as QueryInfo;
        let sampleModel = getStateQueryGridModel('jestTest-1', queryInfo.schemaQuery, { queryInfo });
        let items = getImportItemsForAssayDefinitions(assayDefs, sampleModel);
        expect(items.size).toBe(0);

        // with a query name that DOES match the assay def sampleColumn lookup
        queryInfo = queryInfo.set('schemaQuery', SchemaQuery.create('samples', 'Sample set 10')) as QueryInfo;
        sampleModel = getStateQueryGridModel('jestTest-2', queryInfo.schemaQuery, { queryInfo });
        items = getImportItemsForAssayDefinitions(assayDefs, sampleModel);
        expect(items.size).toBe(1);
    });
});

describe('getRunPropertiesFileName', () => {
    test('abc', () => {
        expect(getRunPropertiesFileName(undefined)).toBe(undefined);
        expect(getRunPropertiesFileName(fromJS({}))).toBe(undefined);
        expect(getRunPropertiesFileName(fromJS({ DataOutputs: [] }))).toBe(undefined);
        expect(
            getRunPropertiesFileName(fromJS({ DataOutputs: [{ displayValue: 'test1' }, { displayValue: 'test2' }] }))
        ).toBe(undefined);
        expect(getRunPropertiesFileName(fromJS({ DataOutputs: [{ displayValue: 'test1' }] }))).toBe('test1');
    });
});
