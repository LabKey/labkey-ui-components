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

import {
    getEditorModel,
    getLookupStore,
    getQueryGridModel,
    getQueryGridModelsForSchema,
    getQueryGridModelsForSchemaQuery,
    removeQueryGridModel,
    resetQueryGridState,
    updateEditorModel,
    updateLookupStore,
    updateQueryGridModel,
    updateSelections,
} from './global';

import { EditorModel, LookupStore } from './models';
import { QueryColumn, QueryGridModel, SchemaQuery } from './components/base/models/model';
import { GRID_CHECKBOX_OPTIONS } from './components/base/models/constants';

beforeEach(() => {
    resetQueryGridState();
});

describe('model updates', () => {
    test('update non-existent model', () => {
        const model = new QueryGridModel({
            id: 'test1',
            pageNumber: 4,
        });
        const updatedModel = new QueryGridModel({
            id: 'test1',
            pageNumber: 10,
        });
        updateQueryGridModel(model, { pageNumber: 10 }, undefined, false);
        expect(getQueryGridModel('test1')).toEqual(updatedModel);
    });

    test('update existing model', () => {
        const schemaQ = new SchemaQuery({
            schemaName: 'sch',
            queryName: 'query',
        });
        const model = new QueryGridModel({
            id: 'test2',
            schema: schemaQ.schemaName,
            query: schemaQ.queryName,
            maxRows: 4,
        });
        updateQueryGridModel(model, {}, undefined, false);
        const sqList = getQueryGridModelsForSchemaQuery(schemaQ);
        expect(sqList).toContain(model);
        expect(sqList.size).toBe(1);
        const updatedSchemaQ = new SchemaQuery({
            schemaName: 'sch2',
            queryName: 'query',
        });

        updateQueryGridModel(model, {
            schema: updatedSchemaQ.schemaName,
        });
        const updatedModel = new QueryGridModel({
            id: 'test2',
            schema: updatedSchemaQ.schemaName,
            query: updatedSchemaQ.queryName,
            maxRows: 4,
        });
        expect(getQueryGridModel('test2')).toEqual(updatedModel);
    });

    test('multiple models for one schemaName', () => {
        const schemaQ = new SchemaQuery({
            schemaName: 'schema',
            queryName: 'q1',
        });
        const schemaQ2 = new SchemaQuery({
            schemaName: 'schema',
            queryName: 'q2',
        });
        const model1 = new QueryGridModel({
            schema: schemaQ.schemaName,
            query: schemaQ.queryName,
            id: 'model1',
        });
        const model2 = new QueryGridModel({
            schema: schemaQ2.schemaName,
            query: schemaQ2.queryName,
            id: 'model2',
        });
        updateQueryGridModel(model1, {}, undefined, false);
        updateQueryGridModel(model2, {}, undefined, false);
        const sqList = getQueryGridModelsForSchema(schemaQ.schemaName);
        expect(sqList.size).toBe(2);
        expect(sqList).toContain(model1);
        expect(sqList).toContain(model2);
    });

    test('multiple models for one schemaQuery', () => {
        const schemaQ = new SchemaQuery({
            schemaName: 'schema',
            queryName: 'q1',
        });

        const model1 = new QueryGridModel({
            schema: schemaQ.schemaName,
            query: schemaQ.queryName,
            id: 'model1',
        });
        const model2 = new QueryGridModel({
            schema: schemaQ.schemaName,
            query: schemaQ.queryName,
            id: 'model2',
        });
        updateQueryGridModel(model1, {}, undefined, false);
        updateQueryGridModel(model2, {}, undefined, false);
        const sqList = getQueryGridModelsForSchemaQuery(schemaQ);
        expect(sqList.size).toBe(2);
        expect(sqList).toContain(model1);
        expect(sqList).toContain(model2);
    });

    test('remove model not yet added', () => {
        const model = new QueryGridModel({
            id: 'removeWithoutAddTest',
        });
        removeQueryGridModel(model);
        expect(getQueryGridModel('removeWithoutAddTest')).toBe(undefined);
    });
});

describe('selections', () => {
    test('no dataIds', () => {
        const modelId = 'noDataIds';
        const model = new QueryGridModel({
            id: modelId,
            totalRows: 0,
        });
        updateSelections(model, { selectedIds: List(['4', '5']) });
        const updatedModel = getQueryGridModel(modelId);
        expect(updatedModel.selectedState).toBe(GRID_CHECKBOX_OPTIONS.SOME);
    });

    test('undefined selectedIds', () => {
        const modelId = 'noData1';
        const model = new QueryGridModel({
            id: modelId,
        });
        updateSelections(model, { selectedIds: undefined });
        const updatedModel = getQueryGridModel(modelId);
        expect(updatedModel.selectedLoaded).toBe(true);
    });

    test('empty selectedIds', () => {
        const modelId = 'noData2';
        const model = new QueryGridModel({
            id: modelId,
        });
        updateSelections(model, { selectedIds: List() });
        const updatedModel = getQueryGridModel(modelId);
        expect(updatedModel.selectedLoaded).toBe(true);
    });

    test('page selection', () => {
        const modelId = 'pageSelected';
        const model = new QueryGridModel({
            id: modelId,
            maxRows: 2,
            totalRows: 12,
            dataIds: List(['1', '3', '5', '7']),
        });
        updateSelections(model, { selectedIds: List(['1', '5']) });
        let updatedModel = getQueryGridModel(modelId);
        expect(updatedModel.selectedQuantity).toBe(2);
        expect(updatedModel.selectedState).toBe(GRID_CHECKBOX_OPTIONS.ALL);
        expect(updatedModel.selectedLoaded).toBe(true);
        updateSelections(model, { selectedIds: List(['7']) });
        updatedModel = getQueryGridModel(modelId);
        expect(updatedModel.selectedQuantity).toBe(1);
        expect(updatedModel.selectedState).toBe(GRID_CHECKBOX_OPTIONS.SOME);
        expect(updatedModel.selectedLoaded).toBe(true);
    });

    test('all selected', () => {
        const modelId = 'allSelected';
        const props = {
            id: modelId,
            maxRows: 3,
            totalRows: 5,
            dataIds: List(['10', '12', '14', '16', '18']),
        };
        const model = new QueryGridModel(props);
        const selectedIds = List(['18', '16', '12', '14', '10']);
        updateSelections(model, { selectedIds });
        props['selectedIds'] = selectedIds;
        props['selectedState'] = GRID_CHECKBOX_OPTIONS.ALL;
        props['selectedLoaded'] = true;
        props['selectedQuantity'] = 5;

        const updatedModel = new QueryGridModel(props);
        expect(getQueryGridModel(modelId)).toEqual(updatedModel);
    });
});

describe('editors', () => {
    test('fail if not found', () => {
        expect(() => updateEditorModel(new EditorModel(), {})).toThrow();
    });

    test('empty updates', () => {
        const modelId = 'emptyUpdates';
        const editor = new EditorModel({
            id: modelId,
            isPasting: true,
        });
        updateEditorModel(editor, {}, false);
        expect(getEditorModel(modelId)).toEqual(editor);
    });

    test('non-empty updates', () => {
        const modelId = 'nonEmptyUpdates';
        const editor = new EditorModel({
            id: modelId,
            numPastedRows: 5,
            rowCount: 14,
        });
        updateEditorModel(editor, { numPastedRows: 8, colCount: 5 }, false);
        const updatedModel = getEditorModel(modelId);
        expect(updatedModel.id).toBe(modelId);
        expect(updatedModel.numPastedRows).toBe(8);
        expect(updatedModel.rowCount).toBe(14);
        expect(updatedModel.colCount).toBe(5);
    });
});

describe('lookupStore', () => {
    test('fail if not found', () => {
        expect(() => updateLookupStore(new LookupStore(), {})).toThrow();
    });

    test('empty updates', () => {
        const col = new QueryColumn({
            fieldKey: 'field1',
            lookup: {
                schemaName: 'schema',
                queryName: 'query',
            },
        });
        const columnKey = 'schema|query|field1';
        const updated = {
            key: columnKey,
        };
        const store = new LookupStore(updated);

        updateLookupStore(store, {}, false);
        expect(getLookupStore(col)).toEqual(store);
        updateLookupStore(store, {}, false);
        expect(getLookupStore(col)).toEqual(store);
    });

    test('non-empty updates', () => {
        const col = new QueryColumn({
            fieldKey: 'field1',
            lookup: {
                schemaName: 'schema',
                queryName: 'query',
            },
        });
        const columnKey = 'schema|query|field1';
        const store = new LookupStore({
            key: columnKey,
        });
        const updates = {
            key: columnKey,
            loadCount: 5,
        };
        const updatedStore = new LookupStore(updates);

        updateLookupStore(store, undefined, false);
        expect(getLookupStore(col)).toEqual(store);
        updateLookupStore(updatedStore, updates, false);
        expect(getLookupStore(col)).toEqual(updatedStore);
    });
});
