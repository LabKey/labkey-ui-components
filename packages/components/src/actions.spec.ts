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
import { List, Map, OrderedMap } from 'immutable';

import {
    getEditorModel,
    getQueryGridModel,
    resetQueryGridState,
    updateEditorModel,
    updateQueryGridModel,
} from './global';
import { QueryInfo } from './internal/components/base/models/QueryInfo';
import { QueryColumn, QueryGridModel, SchemaQuery } from './internal/components/base/models/model';
import { CellMessage, EditorModel, ValueDescriptor } from './models';
import { addColumns, changeColumn, removeColumn, updateEditorData } from './actions';

import mixturesQueryInfo from './test/data/mixtures-getQueryDetails.json';
import sampleSet2QueryInfo from './test/data/sampleSet2-getQueryDetails.json';
import emptyEditorGridModel from './test/data/sampleSet2-emptyEditableGrid.json';
// FIXME, when the editableGridWithData file is read in, the objects are automatically
//  converted to Maps, which means accessing them like objects doesn't work.  That's a problem.
// const editableGridWithData = require("./test/data/sampleSet2-editableGridWithData.json");

const editableGridWithData = {
    cellMessages: Map<string, CellMessage>({
        '1-0': 'description 1 message',
    }),
    cellValues: Map<string, List<ValueDescriptor>>({
        '0-0': List<ValueDescriptor>([
            {
                display: 'S-1',
                raw: 'S-1',
            },
        ]),
        '0-1': List<ValueDescriptor>([
            {
                display: 'S-2',
                raw: 'S-2',
            },
        ]),
        '0-2': List<ValueDescriptor>([
            {
                display: 'S-3',
                raw: 'S-3',
            },
        ]),
        '1-0': List<ValueDescriptor>([
            {
                display: 'Description 1',
                raw: 'Description 1',
            },
        ]),
        '1-1': List<ValueDescriptor>([
            {
                display: 'Description 2',
                raw: 'Description 2',
            },
        ]),
        '1-2': List<ValueDescriptor>([
            {
                display: 'Description 3',
                raw: 'Description 3',
            },
        ]),
        '5-0': List<ValueDescriptor>([
            {
                display: 'requirement 1',
                raw: 'requirement 1',
            },
        ]),
    }),
    colCount: 5,
    id: 'insert-samples|samples/sample set 2',
    isPasting: false,
    focusColIdx: 1,
    focusRowIdx: 1,
    numPastedRows: 0,
    rowCount: 3,
    selectedColIdx: 1,
    selectedRowIdx: 1,
    selectionCells: [],
};

const schemaQ = new SchemaQuery({
    schemaName: 'samples',
    queryName: 'Sample Set 2',
});

const queryGridModel = new QueryGridModel({
    schema: schemaQ.schemaName,
    query: schemaQ.queryName,
    id: 'insert-samples|samples/sample set 2',
    queryInfo: QueryInfo.fromJSON(sampleSet2QueryInfo),
    editable: true,
    data: Map<any, Map<string, any>>({
        '1': Map<string, any>({
            Description: 'S-1 Description',
        }),
        '2': Map<string, any>({
            Description: 'S-2 Description',
        }),
    }),
    dataIds: List<any>(['1', '2']),
});

const editor = new EditorModel({
    id: queryGridModel.getId(),
});

const rowData = List<any>(['S-5', 'S-5 description']);

const queryColumn = new QueryColumn({
    caption: 'Sample set 3 Parents',
    conceptURI: null,
    defaultValue: null,
    description: 'Contains optional parent entity for this Sample set 3',
    fieldKey: 'MaterialInputs/Sample set 3',
    fieldKeyArray: ['MaterialInputs/Sample set 3'],
    lookup: {
        displayColumn: 'Name',
        isPublic: true,
        keyColumn: 'RowId',
        multiValued: 'junction',
        queryName: 'Sample set 3',
        schemaName: 'samples',
        table: 'MaterialInputs',
    },
    multiValue: false,
    name: 'MaterialInputs/Sample set 3',
    required: false,
    shownInInsertView: true,
    sortable: true,
    type: 'Text (String)',
    userEditable: true,
    removeFromViews: false,
});

beforeEach(() => {
    resetQueryGridState();
});

describe('updateEditorData', () => {
    test('update empty grid', () => {
        updateEditorModel(editor, emptyEditorGridModel, false);
        updateEditorData(queryGridModel, rowData, 3);
        const updatedEditor = getEditorModel(queryGridModel.getId());
        expect(updatedEditor.rowCount).toBe(3);
        expect(updatedEditor.cellValues.size).toBe(6);
        expect(updatedEditor.cellMessages.size).toBe(6);
    });

    test('change one row in the middle', () => {
        updateEditorModel(editor, editableGridWithData, false);
        const originalEditor = getEditorModel(queryGridModel.getId());
        expect(originalEditor.rowCount).toBe(3);
        updateEditorData(queryGridModel, rowData, 1, 1);
        const updatedEditor = getEditorModel(queryGridModel.getId());
        expect(updatedEditor.rowCount).toBe(3);
        expect(updatedEditor.cellValues.get('0-1').get(0).display).toBe('S-5');
        expect(updatedEditor.cellValues.get('1-1').get(0).display).toBe('S-5 description');
    });

    test('add one row at the end', () => {
        updateEditorModel(editor, editableGridWithData, false);
        const originalEditor = getEditorModel(queryGridModel.getId());
        expect(originalEditor.rowCount).toBe(3);
        updateEditorData(queryGridModel, rowData, 1, originalEditor.rowCount);
        const updatedEditor = getEditorModel(queryGridModel.getId());
        expect(updatedEditor.rowCount).toBe(4);
        expect(updatedEditor.cellValues.get('0-3').get(0).display).toBe('S-5');
        expect(updatedEditor.cellValues.get('1-3').get(0).display).toBe('S-5 description');
    });

    test('add multiple rows in the middle, increasing grid size', () => {
        updateEditorModel(editor, editableGridWithData, false);
        const originalEditor = getEditorModel(queryGridModel.getId());
        expect(originalEditor.rowCount).toBe(3);
        updateEditorData(queryGridModel, rowData, 3, 1);
        const updatedEditor = getEditorModel(queryGridModel.getId());
        expect(updatedEditor.rowCount).toBe(4);
        expect(updatedEditor.cellValues.get('0-1').get(0).display).toBe('S-5');
        expect(updatedEditor.cellValues.get('0-2').get(0).display).toBe('S-5');
        expect(updatedEditor.cellValues.get('0-3').get(0).display).toBe('S-5');
        expect(updatedEditor.cellValues.get('1-1').get(0).display).toBe('S-5 description');
        expect(updatedEditor.cellValues.get('1-2').get(0).display).toBe('S-5 description');
        expect(updatedEditor.cellValues.get('1-3').get(0).display).toBe('S-5 description');
    });

    test('add multiple rows with column offset', () => {
        updateEditorModel(editor, editableGridWithData, false);
        updateEditorData(queryGridModel, rowData.slice(1).toList(), 2, 1, 1);
        const updatedEditor = getEditorModel(queryGridModel.getId());
        expect(updatedEditor.rowCount).toBe(3);

        expect(updatedEditor.cellValues.get('0-1').get(0).display).toBe('S-2');
        expect(updatedEditor.cellValues.get('0-2').get(0).display).toBe('S-3');
        expect(updatedEditor.cellValues.get('1-1').get(0).display).toBe('S-5 description');
        expect(updatedEditor.cellValues.get('1-2').get(0).display).toBe('S-5 description');
    });

    test('lookup with undefined value', () => {
        const qgModel = new QueryGridModel({
            schema: schemaQ.schemaName,
            query: schemaQ.queryName,
            id: 'mixtures',
            queryInfo: QueryInfo.fromJSON(mixturesQueryInfo),
            editable: true,
            data: Map<any, Map<string, any>>({
                '1': Map<string, any>({
                    Description: 'Mixture-1 Description',
                }),
                '2': Map<string, any>({
                    Description: 'Mixture-2 Description',
                }),
            }),
            dataIds: List<any>(['1', '2']),
        });
        const emptyGridModel = {
            cellMessages: {},
            cellValues: {},
            colCount: 5,
            id: 'mixtures',
            isPasting: false,
            focusColIdx: -1,
            focusRowIdx: -1,
            numPastedRows: 0,
            rowCount: 1,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: [],
        };
        const editorModel = new EditorModel({
            id: qgModel.getId(),
        });
        const rowData = List<any>(['update name', 'update description', undefined, undefined, '', 'extra data']);
        updateEditorModel(editorModel, emptyGridModel, false);
        updateEditorData(qgModel, rowData, 1);
        const updatedEditor = getEditorModel(qgModel.getId());
        expect(updatedEditor.rowCount).toBe(1);
        expect(updatedEditor.cellValues.get('0-0').get(0).display).toBe('update name');
        expect(updatedEditor.cellValues.get('1-0').get(0).display).toBe('update description');
        expect(updatedEditor.cellValues.get('2-0').get(0).display).toBe(undefined);
        expect(updatedEditor.cellValues.get('3-0').get(0).display).toBe(undefined);
        expect(updatedEditor.cellValues.get('4-0').get(0).display).toBe('');
        expect(updatedEditor.cellValues.get('5-0').get(0).display).toBe('extra data');
    });
});

describe('changeColumn', () => {
    test('column not found', () => {
        updateQueryGridModel(queryGridModel, {}, undefined, false);
        updateEditorModel(editor, editableGridWithData, false);
        const editorModel = getEditorModel(queryGridModel.getId());
        changeColumn(queryGridModel, 'Nonesuch', queryColumn);
        const updatedModel = getEditorModel(queryGridModel.getId());
        expect(updatedModel).toBe(editorModel);
    });

    test('has values and messages', () => {
        updateQueryGridModel(queryGridModel, {}, undefined, false);
        updateEditorModel(editor, editableGridWithData, false);
        const editorModel = getEditorModel(queryGridModel.getId());
        expect(editorModel.cellMessages.size).toBe(1);
        changeColumn(queryGridModel, 'Description', queryColumn);
        const updatedEditor = getEditorModel(queryGridModel.getId());
        expect(updatedEditor.cellMessages.size).toBe(0);
        expect(updatedEditor.cellValues.get('1-0')).toBeFalsy();
        expect(updatedEditor.cellValues.get('1-1')).toBeFalsy();
        expect(updatedEditor.cellValues.get('1-2')).toBeFalsy();
        const updatedGridModel = getQueryGridModel(queryGridModel.getId());
        const colIndex = queryGridModel.queryInfo.columns.keySeq().findIndex(column => column === 'description');
        expect(updatedGridModel.getColumn('Description')).toBeFalsy();
        expect(updatedGridModel.getColumn(queryColumn.fieldKey)).toBeTruthy();
        const newColIndex = updatedGridModel.queryInfo.columns
            .keySeq()
            .findIndex(column => column === queryColumn.fieldKey.toLowerCase());
        expect(newColIndex).toBe(colIndex);
        expect(updatedGridModel.data.findEntry(rowValues => rowValues.has('Description)'))).toBeFalsy();
        expect(updatedGridModel.data.findEntry(rowValues => rowValues.has(queryColumn.fieldKey))).toBeTruthy();
    });
});

describe('addColumns', () => {
    test('no columns provided', () => {
        updateQueryGridModel(queryGridModel, {}, undefined, false);
        updateEditorModel(editor, editableGridWithData, false);
        const editorModel = getEditorModel(queryGridModel.getId());
        addColumns(queryGridModel, OrderedMap<string, QueryColumn>());
        const updatedModel = getEditorModel(queryGridModel.getId());
        expect(updatedModel).toBe(editorModel);
    });

    test('add at beginning', () => {
        updateQueryGridModel(queryGridModel, {}, undefined, false);
        updateEditorModel(editor, editableGridWithData, false);
        addColumns(
            queryGridModel,
            OrderedMap<string, QueryColumn>([[queryColumn.fieldKey, queryColumn]])
        );
        const updatedEditor = getEditorModel(queryGridModel.getId());
        expect(updatedEditor.cellMessages.size).toBe(1);
        expect(updatedEditor.cellMessages.has('2-0')).toBe(true);
        expect(updatedEditor.cellValues.get('0-0').size).toBe(0);
        expect(updatedEditor.cellValues.get('1-0').get(0).display).toBe('S-1');
        expect(updatedEditor.cellValues.get('2-0').get(0).display).toBe('Description 1');
        expect(updatedEditor.cellValues.get('1-1').get(0).display).toBe('S-2');
        expect(updatedEditor.cellValues.get('2-1').get(0).display).toBe('Description 2');
        const updatedGridModel = getQueryGridModel(queryGridModel.getId());
        expect(updatedGridModel.getColumnIndex('Description')).toBe(queryGridModel.getColumnIndex('Description') + 1);
        expect(updatedGridModel.getColumnIndex(queryColumn.fieldKey)).toBe(0);
        expect(updatedGridModel.data.findEntry(rowValues => rowValues.has(queryColumn.fieldKey))).toBeTruthy();
    });

    test('add at end', () => {
        updateQueryGridModel(queryGridModel, {}, undefined, false);
        updateEditorModel(editor, editableGridWithData, false);
        const lastInsertColKey = queryGridModel.getInsertColumns().last().fieldKey;
        addColumns(
            queryGridModel,
            OrderedMap<string, QueryColumn>([[queryColumn.fieldKey, queryColumn]]),
            lastInsertColKey
        );
        const updatedEditor = getEditorModel(queryGridModel.getId());
        expect(updatedEditor.cellMessages.size).toBe(1);
        expect(updatedEditor.cellMessages.has('1-0')).toBe(true);
        expect(updatedEditor.cellValues.get('0-0').get(0).display).toBe('S-1');
        expect(updatedEditor.cellValues.get('1-0').get(0).display).toBe('Description 1');
        expect(updatedEditor.cellValues.get('0-1').get(0).display).toBe('S-2');
        expect(updatedEditor.cellValues.get('1-1').get(0).display).toBe('Description 2');
        const updatedGridModel = getQueryGridModel(queryGridModel.getId());
        expect(updatedGridModel.getColumnIndex('description')).toBe(queryGridModel.getColumnIndex('description'));
        expect(updatedGridModel.getColumnIndex(queryColumn.fieldKey)).toBe(
            queryGridModel.getColumnIndex(lastInsertColKey) + 1
        );
        expect(updatedGridModel.data.findEntry(rowValues => rowValues.has(queryColumn.fieldKey))).toBeTruthy();
    });

    test('add in the middle', () => {
        updateQueryGridModel(queryGridModel, {}, undefined, false);
        const nameColIndex = queryGridModel.getColumnIndex('name');
        updateEditorModel(editor, editableGridWithData, false);
        addColumns(
            queryGridModel,
            OrderedMap<string, QueryColumn>([[queryColumn.fieldKey, queryColumn]]),
            'Name'
        );
        const updatedEditor = getEditorModel(queryGridModel.getId());

        expect(updatedEditor.cellMessages.size).toBe(1);
        expect(updatedEditor.cellMessages.has('2-0')).toBe(true);
        expect(updatedEditor.cellValues.get('0-0').get(0).display).toBe('S-1');
        expect(updatedEditor.cellValues.get('2-0').get(0).display).toBe('Description 1');
        expect(updatedEditor.cellValues.get('0-1').get(0).display).toBe('S-2');
        expect(updatedEditor.cellValues.get('2-1').get(0).display).toBe('Description 2');
        const updatedGridModel = getQueryGridModel(queryGridModel.getId());

        expect(updatedGridModel.getColumnIndex('name')).toBe(nameColIndex);
        expect(updatedGridModel.getColumnIndex('description')).toBe(queryGridModel.getColumnIndex('description') + 1);
        expect(updatedGridModel.getColumnIndex(queryColumn.fieldKey)).toBe(nameColIndex + 1);
        expect(updatedGridModel.data.findEntry(rowValues => rowValues.has(queryColumn.fieldKey))).toBeTruthy();
    });
});

describe('removeColumn', () => {
    test('column not found', () => {
        updateQueryGridModel(queryGridModel, {}, undefined, false);
        updateEditorModel(editor, editableGridWithData, false);
        const originalEditor = getEditorModel(queryGridModel.getId());
        removeColumn(queryGridModel, 'Modified'); // not an insert column, so cannot be removed
        const updatedEditor = getEditorModel(queryGridModel.getId());
        expect(updatedEditor).toBe(originalEditor);
    });

    test('first column', () => {
        updateQueryGridModel(queryGridModel, {}, undefined, false);
        updateEditorModel(editor, editableGridWithData, false);
        const firstInputColumn = queryGridModel.getInsertColumns().first();
        removeColumn(queryGridModel, firstInputColumn.fieldKey);
        const updatedEditor = getEditorModel(queryGridModel.getId());
        expect(updatedEditor.cellMessages.size).toBe(1);
        expect(updatedEditor.cellValues.get('0-0').get(0).display).toBe('Description 1');
        expect(updatedEditor.cellValues.get('0-1').get(0).display).toBe('Description 2');
        const updatedGridModel = getQueryGridModel(queryGridModel.getId());
        expect(updatedGridModel.data.find(row => row.has(firstInputColumn.fieldKey))).toBeFalsy();
    });

    test('last column', () => {
        updateQueryGridModel(queryGridModel, {}, undefined, false);
        updateEditorModel(editor, editableGridWithData, false);
        const lastInputColumn = queryGridModel.getInsertColumns().last();
        removeColumn(queryGridModel, lastInputColumn.fieldKey);
        const updatedEditor = getEditorModel(queryGridModel.getId());
        expect(updatedEditor.cellMessages.size).toBe(1);
        expect(updatedEditor.cellValues.get('0-0').get(0).display).toBe('S-1');
        expect(updatedEditor.cellValues.get('0-1').get(0).display).toBe('S-2');
        expect(updatedEditor.cellValues.has('5-0')).toBe(false);
        const updatedGridModel = getQueryGridModel(queryGridModel.getId());
        expect(updatedGridModel.data.find(row => row.has(lastInputColumn.fieldKey))).toBeFalsy();
    });

    test('middle column', () => {
        updateQueryGridModel(queryGridModel, {}, undefined, false);
        updateEditorModel(editor, editableGridWithData, false);
        removeColumn(queryGridModel, 'Description');
        const updatedEditor = getEditorModel(queryGridModel.getId());
        expect(updatedEditor.cellMessages.size).toBe(0);
        expect(updatedEditor.cellValues.get('0-0').get(0).display).toBe('S-1');
        expect(updatedEditor.cellValues.has('1-0')).toBe(false);
        const updatedGridModel = getQueryGridModel(queryGridModel.getId());
        expect(updatedGridModel.data.find(row => row.has('Description'))).toBeFalsy();
    });
});
