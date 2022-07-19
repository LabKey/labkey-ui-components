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
import { List, Map, OrderedMap, fromJS } from 'immutable';

import { Filter } from '@labkey/api';

import { EditorModel, EXPORT_TYPES, makeTestQueryModel, QueryColumn, QueryInfo, SchemaQuery } from '..';

import sampleSet2QueryInfo from '../test/data/sampleSet2-getQueryDetails.json';

import {
    addColumns,
    changeColumn,
    removeColumn,
    genCellKey,
    parseCellKey,
    getExportParams,
} from './actions';
import { CellMessage, ValueDescriptor } from './models';

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

const dataRows = {
    '1': {
        Description: 'S-1 Description',
    },
    '2': {
        Description: 'S-2 Description',
    },
};

const dataKeys = ['1', '2'];

const queryModel = makeTestQueryModel(
    schemaQ,
    QueryInfo.fromJSON(sampleSet2QueryInfo),
    dataRows,
    dataKeys,
    dataKeys.length,
    'insert-samples|samples/sample set 2'
);

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

describe('changeColumn', () => {
    test('column not found', () => {
        const editorModel = new EditorModel({ id: queryModel.id }).merge(editableGridWithData) as EditorModel;
        const updates = changeColumn(
            editorModel,
            queryModel.queryInfo,
            fromJS(queryModel.rows),
            'Nonesuch',
            queryColumn
        );
        expect(updates.editorModelChanges).toBe(undefined);
    });

    test('has values and messages', () => {
        const editorModel = new EditorModel({ id: queryModel.id }).merge(editableGridWithData) as EditorModel;
        expect(editorModel.cellMessages.size).toBe(1);

        const updates = changeColumn(
            editorModel,
            queryModel.queryInfo,
            fromJS(queryModel.rows),
            'Description',
            queryColumn
        );

        expect(updates.editorModelChanges.cellMessages.size).toBe(0);
        expect(updates.editorModelChanges.cellValues.get('1-0')).toBeFalsy();
        expect(updates.editorModelChanges.cellValues.get('1-1')).toBeFalsy();
        expect(updates.editorModelChanges.cellValues.get('1-2')).toBeFalsy();

        const colIndex = queryModel.queryInfo.columns.keySeq().findIndex(column => column === 'description');
        expect(updates.queryInfo.getColumn('Description')).toBeFalsy();
        expect(updates.queryInfo.getColumn(queryColumn.fieldKey)).toBeTruthy();
        const newColIndex = updates.queryInfo.columns
            .keySeq()
            .findIndex(column => column === queryColumn.fieldKey.toLowerCase());
        expect(newColIndex).toBe(colIndex);
        expect(updates.data.findEntry(rowValues => rowValues.has('Description)'))).toBeFalsy();
        expect(updates.data.findEntry(rowValues => rowValues.has(queryColumn.fieldKey))).toBeTruthy();
    });
});

describe('addColumns', () => {
    test('no columns provided', () => {
        const editorModel = new EditorModel({ id: queryModel.id }).merge(editableGridWithData) as EditorModel;
        const updates = addColumns(
            editorModel,
            queryModel.queryInfo,
            fromJS(queryModel.rows),
            OrderedMap<string, QueryColumn>()
        );
        expect(updates.editorModelChanges).toBe(undefined);
    });

    test('add at beginning', () => {
        const editorModel = new EditorModel({ id: queryModel.id }).merge(editableGridWithData) as EditorModel;
        const updates = addColumns(
            editorModel,
            queryModel.queryInfo,
            fromJS(queryModel.rows),
            OrderedMap<string, QueryColumn>([[queryColumn.fieldKey, queryColumn]])
        );
        expect(updates.editorModelChanges.cellMessages.size).toBe(1);
        expect(updates.editorModelChanges.cellMessages.has('2-0')).toBe(true);
        expect(updates.editorModelChanges.cellValues.get('0-0').size).toBe(0);
        expect(updates.editorModelChanges.cellValues.get('1-0').get(0).display).toBe('S-1');
        expect(updates.editorModelChanges.cellValues.get('2-0').get(0).display).toBe('Description 1');
        expect(updates.editorModelChanges.cellValues.get('1-1').get(0).display).toBe('S-2');
        expect(updates.editorModelChanges.cellValues.get('2-1').get(0).display).toBe('Description 2');
        expect(updates.queryInfo.getColumnIndex('Description')).toBe(
            queryModel.queryInfo.getColumnIndex('Description') + 1
        );
        expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(0);
        expect(updates.data.findEntry(rowValues => rowValues.has(queryColumn.fieldKey))).toBeTruthy();
    });

    test('add at end', () => {
        const editorModel = new EditorModel({ id: queryModel.id }).merge(editableGridWithData) as EditorModel;
        const lastInsertColKey = queryModel.queryInfo.getInsertColumns().last().fieldKey;
        const updates = addColumns(
            editorModel,
            queryModel.queryInfo,
            fromJS(queryModel.rows),
            OrderedMap<string, QueryColumn>([[queryColumn.fieldKey, queryColumn]]),
            lastInsertColKey
        );
        expect(updates.editorModelChanges.cellMessages.size).toBe(1);
        expect(updates.editorModelChanges.cellMessages.has('1-0')).toBe(true);
        expect(updates.editorModelChanges.cellValues.get('0-0').get(0).display).toBe('S-1');
        expect(updates.editorModelChanges.cellValues.get('1-0').get(0).display).toBe('Description 1');
        expect(updates.editorModelChanges.cellValues.get('0-1').get(0).display).toBe('S-2');
        expect(updates.editorModelChanges.cellValues.get('1-1').get(0).display).toBe('Description 2');
        expect(updates.queryInfo.getColumnIndex('description')).toBe(
            queryModel.queryInfo.getColumnIndex('description')
        );
        expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(
            queryModel.queryInfo.getColumnIndex(lastInsertColKey) + 1
        );
        expect(updates.data.findEntry(rowValues => rowValues.has(queryColumn.fieldKey))).toBeTruthy();
    });

    test('add in the middle', () => {
        const editorModel = new EditorModel({ id: queryModel.id }).merge(editableGridWithData) as EditorModel;
        const nameColIndex = queryModel.queryInfo.getColumnIndex('name');

        const updates = addColumns(
            editorModel,
            queryModel.queryInfo,
            fromJS(queryModel.rows),
            OrderedMap<string, QueryColumn>([[queryColumn.fieldKey, queryColumn]]),
            'Name'
        );

        expect(updates.editorModelChanges.cellMessages.size).toBe(1);
        expect(updates.editorModelChanges.cellMessages.has('2-0')).toBe(true);
        expect(updates.editorModelChanges.cellValues.get('0-0').get(0).display).toBe('S-1');
        expect(updates.editorModelChanges.cellValues.get('2-0').get(0).display).toBe('Description 1');
        expect(updates.editorModelChanges.cellValues.get('0-1').get(0).display).toBe('S-2');
        expect(updates.editorModelChanges.cellValues.get('2-1').get(0).display).toBe('Description 2');

        expect(updates.queryInfo.getColumnIndex('name')).toBe(nameColIndex);
        expect(updates.queryInfo.getColumnIndex('description')).toBe(
            queryModel.queryInfo.getColumnIndex('description') + 1
        );
        expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(nameColIndex + 1);
        expect(updates.data.findEntry(rowValues => rowValues.has(queryColumn.fieldKey))).toBeTruthy();
    });
});

describe('removeColumn', () => {
    test('column not found', () => {
        const editorModel = new EditorModel({ id: queryModel.id }).merge(editableGridWithData) as EditorModel;
        const updates = removeColumn(editorModel, queryModel.queryInfo, fromJS(queryModel.rows), 'Modified'); // not an insert column, so cannot be removed
        expect(updates.editorModelChanges).toBe(undefined);
    });

    test('first column', () => {
        const editorModel = new EditorModel({ id: queryModel.id }).merge(editableGridWithData) as EditorModel;
        const firstInputColumn = queryModel.queryInfo.getInsertColumns().first();
        const updates = removeColumn(
            editorModel,
            queryModel.queryInfo,
            fromJS(queryModel.rows),
            firstInputColumn.fieldKey
        );

        expect(updates.editorModelChanges.cellMessages.size).toBe(1);
        expect(updates.editorModelChanges.cellValues.get('0-0').get(0).display).toBe('Description 1');
        expect(updates.editorModelChanges.cellValues.get('0-1').get(0).display).toBe('Description 2');
        expect(updates.data.find(row => row.has(firstInputColumn.fieldKey))).toBeFalsy();
    });

    test('last column', () => {
        const editorModel = new EditorModel({ id: queryModel.id }).merge(editableGridWithData) as EditorModel;
        const lastInputColumn = queryModel.queryInfo.getInsertColumns().last();
        const updates = removeColumn(
            editorModel,
            queryModel.queryInfo,
            fromJS(queryModel.rows),
            lastInputColumn.fieldKey
        );

        expect(updates.editorModelChanges.cellMessages.size).toBe(1);
        expect(updates.editorModelChanges.cellValues.get('0-0').get(0).display).toBe('S-1');
        expect(updates.editorModelChanges.cellValues.get('0-1').get(0).display).toBe('S-2');
        expect(updates.editorModelChanges.cellValues.has('5-0')).toBe(false);
        expect(updates.data.find(row => row.has(lastInputColumn.fieldKey))).toBeFalsy();
    });

    test('middle column', () => {
        const editorModel = new EditorModel({ id: queryModel.id }).merge(editableGridWithData) as EditorModel;
        const updates = removeColumn(editorModel, queryModel.queryInfo, fromJS(queryModel.rows), 'Description');

        expect(updates.editorModelChanges.cellMessages.size).toBe(0);
        expect(updates.editorModelChanges.cellValues.get('0-0').get(0).display).toBe('S-1');
        expect(updates.editorModelChanges.cellValues.has('1-0')).toBe(false);
        expect(updates.data.find(row => row.has('Description'))).toBeFalsy();
    });
});

describe('CellKey', () => {
    test('genCellKey', () => {
        expect(genCellKey(0, 0)).toBe('0-0');
        expect(genCellKey(1, 2)).toBe('1-2');
    });

    test('parseCellKey', () => {
        expect(parseCellKey('0-0').colIdx).toBe(0);
        expect(parseCellKey('0-0').rowIdx).toBe(0);
        expect(parseCellKey('1-2').colIdx).toBe(1);
        expect(parseCellKey('1-2').rowIdx).toBe(2);
    });
});

describe('getExportParams', () => {
    const schemaName = 'test';
    const queryName = 'query';
    const schemaQuery = SchemaQuery.create(schemaName, queryName);
    test('no options or advanced options', () => {
        expect(getExportParams(EXPORT_TYPES.TSV, schemaQuery)).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
            'query.selectionKey': undefined,
        });
    });

    test('with schema view', () => {
        expect(getExportParams(EXPORT_TYPES.TSV, SchemaQuery.create(schemaName, queryName, 'testView'))).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
            'query.selectionKey': undefined,
            'query.viewName': 'testView',
        });
    });

    test('as csv', () => {
        expect(getExportParams(EXPORT_TYPES.CSV, schemaQuery)).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
            'query.selectionKey': undefined,
            delim: 'COMMA',
        });
    });

    test('with options, no advanced options', () => {
        expect(
            getExportParams(EXPORT_TYPES.TSV, schemaQuery, {
                showRows: 'SELECTED',
                selectionKey: 'selection-key',
                columns: 'Field1,Field2',
                sorts: '-Field2,Field1',
                filters: List([Filter.create('Field3', 'value', Filter.Types.NEQ)]),
            })
        ).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['SELECTED'],
            'query.selectionKey': 'selection-key',
            'query.columns': 'Field1,Field2',
            'query.sort': '-Field2,Field1',
            'query.Field3~neq': ['value'],
        });
    });

    test('with includeColumn', () => {
        expect(
            getExportParams(
                EXPORT_TYPES.TSV,
                schemaQuery,
                {
                    selectionKey: 'selection-key',
                    columns: 'Field1,Field2',
                    sorts: '-Field2,Field1',
                    filters: List([Filter.create('Field3', 'value', Filter.Types.NEQ)]),
                },
                {
                    includeColumn: ['extra1', 'extra2'],
                }
            )
        ).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
            'query.selectionKey': 'selection-key',
            'query.columns': 'Field1,Field2,extra1,extra2',
            'query.sort': '-Field2,Field1',
            'query.Field3~neq': ['value'],
            includeColumn: ['extra1', 'extra2'],
        });
    });

    test('with includeColumn, no columns', () => {
        expect(
            getExportParams(
                EXPORT_TYPES.TSV,
                schemaQuery,
                {
                    selectionKey: 'selection-key',
                    sorts: '-Field2,Field1',
                    filters: List([Filter.create('Field3', 'value', Filter.Types.NEQ)]),
                },
                {
                    includeColumn: ['extra1', 'extra2'],
                }
            )
        ).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
            'query.selectionKey': 'selection-key',
            'query.sort': '-Field2,Field1',
            'query.Field3~neq': ['value'],
            includeColumn: ['extra1', 'extra2'],
        });
    });

    test('with excludeColumn', () => {
        expect(
            getExportParams(
                EXPORT_TYPES.TSV,
                schemaQuery,
                {
                    selectionKey: 'selection-key',
                    sorts: '-Field2,Field1',
                    columns: 'Field1,Field2,Field3',
                    filters: List([Filter.create('Field3', 'value', Filter.Types.NEQ)]),
                },
                {
                    excludeColumn: ['Field3', 'extra2'],
                }
            )
        ).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
            'query.selectionKey': 'selection-key',
            'query.sort': '-Field2,Field1',
            'query.columns': 'Field1,Field2',
            'query.Field3~neq': ['value'],
            excludeColumn: ['Field3', 'extra2'],
        });
    });

    test('with includeColumn and excludeColumn', () => {
        expect(
            getExportParams(
                EXPORT_TYPES.TSV,
                schemaQuery,
                {
                    selectionKey: 'selection-key',
                    sorts: '-Field2,Field1',
                    columns: 'Field1,Field2,Field3',
                    filters: List([Filter.create('Field3', 'value', Filter.Types.NEQ)]),
                },
                {
                    includeColumn: ['extra1', 'extra2'],
                    excludeColumn: ['Field3', 'extra2'],
                }
            )
        ).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
            'query.selectionKey': 'selection-key',
            'query.sort': '-Field2,Field1',
            'query.columns': 'Field1,Field2,extra1',
            'query.Field3~neq': ['value'],
            includeColumn: ['extra1', 'extra2'],
            excludeColumn: ['Field3', 'extra2'],
        });
    });
});
