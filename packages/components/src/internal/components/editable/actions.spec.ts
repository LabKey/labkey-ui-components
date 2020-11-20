import { List, Map } from 'immutable';

import { getEditorModel, resetQueryGridState, updateEditorModel } from '../../global';
import emptyEditorGridModel from '../../../test/data/sampleSet2-emptyEditableGrid.json';

import { QueryGridModel } from '../../QueryGridModel';
import { EditorModel, QueryInfo, SchemaQuery } from '../../..';
import mixturesQueryInfo from '../../../test/data/mixtures-getQueryDetails.json';

import { updateEditorData } from './actions';
import { CellMessage, ValueDescriptor } from '../../models';
import sampleSet2QueryInfo from '../../../test/data/sampleSet2-getQueryDetails.json';

// FIXME: Test data here is duplicated from internal/actions.spec.ts

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
