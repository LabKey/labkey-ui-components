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
import { initQueryGridState } from '../../global';
import { ASSAY_DEFINITION_MODEL, TEST_ASSAY_STATE_MODEL } from '../../../test/data/constants';

import sampleSet2QueryInfo from '../../../test/data/sampleSet2-getQueryDetails.json';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';

import {
    allowReimportAssayRun,
    GENERAL_ASSAY_PROVIDER_NAME,
    getImportItemsForAssayDefinitions,
    getRunPropertiesFileName
} from './actions';
import {makeTestQueryModel} from "../../../public/QueryModel/testUtils";
import {SchemaQuery} from "../../../public/SchemaQuery";
import {AssayStateModel} from "./models";
import {QueryInfo} from "../../../public/QueryInfo";

beforeAll(() => {
    initQueryGridState();
});

describe('allowReimportAssayRun', () => {
    test('require insert permissions', () => {
        expect(allowReimportAssayRun(TEST_USER_READER, 'a', 'a')).toBe(false);
        expect(allowReimportAssayRun(TEST_USER_EDITOR, 'a', 'a')).toBe(true);
    });
    test('match containerId', () => {
        expect(allowReimportAssayRun(TEST_USER_EDITOR, undefined, undefined)).toBe(false);
        expect(allowReimportAssayRun(TEST_USER_EDITOR, null, undefined)).toBe(false);
        expect(allowReimportAssayRun(TEST_USER_EDITOR, '', '')).toBe(false);
        expect(allowReimportAssayRun(TEST_USER_EDITOR, 'a', 'A')).toBe(false);
        expect(allowReimportAssayRun(TEST_USER_EDITOR, 'B', 'B')).toBe(true);
    });
});

describe('getImportItemsForAssayDefinitions', () => {
    test('empty list', () => {
        const sampleModel = makeTestQueryModel(SchemaQuery.create('samples', 'samples'));
        const items = getImportItemsForAssayDefinitions(new AssayStateModel(), sampleModel);
        expect(items.size).toBe(0);
    });

    test('with expected match', () => {
        const assayStateModel = new AssayStateModel({ definitions: [ASSAY_DEFINITION_MODEL] });
        let queryInfo = QueryInfo.create(sampleSet2QueryInfo);

        // with a query name that DOES NOT match the assay def sampleColumn lookup
        queryInfo = queryInfo.set('schemaQuery', SchemaQuery.create('samples', 'Sample set 1')) as QueryInfo;
        let sampleModel = makeTestQueryModel(queryInfo.schemaQuery, queryInfo);
        let items = getImportItemsForAssayDefinitions(assayStateModel, sampleModel);
        expect(items.size).toBe(0);

        // with a query name that DOES match the assay def sampleColumn lookup
        queryInfo = queryInfo.set('schemaQuery', SchemaQuery.create('samples', 'Sample set 10')) as QueryInfo;
        sampleModel = makeTestQueryModel(queryInfo.schemaQuery, queryInfo);
        items = getImportItemsForAssayDefinitions(assayStateModel, sampleModel);
        expect(items.size).toBe(1);
    });

    test('providerType filter', () => {
        let items = getImportItemsForAssayDefinitions(TEST_ASSAY_STATE_MODEL, undefined, undefined);
        expect(items.size).toBe(5);
        items = getImportItemsForAssayDefinitions(TEST_ASSAY_STATE_MODEL, undefined, GENERAL_ASSAY_PROVIDER_NAME);
        expect(items.size).toBe(2);
        items = getImportItemsForAssayDefinitions(TEST_ASSAY_STATE_MODEL, undefined, 'NAb');
        expect(items.size).toBe(1);
    });
});

describe('getRunPropertiesFileName', () => {
    test('abc', () => {
        expect(getRunPropertiesFileName(undefined)).toBe(undefined);
        expect(getRunPropertiesFileName({})).toBe(undefined);
        expect(getRunPropertiesFileName({ DataOutputs: [] })).toBe(undefined);
        expect(getRunPropertiesFileName({ DataOutputs: [{ displayValue: 'test1' }, { displayValue: 'test2' }] })).toBe(
            undefined
        );
        expect(getRunPropertiesFileName({ DataOutputs: [{ displayValue: 'test1' }] })).toBe('test1');
    });
});
