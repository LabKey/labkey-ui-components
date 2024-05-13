import { fromJS, List, Map, Set } from 'immutable';

import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn, QueryLookup } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import sampleSet2QueryInfo from '../../../test/data/sampleSet2-getQueryDetails.json';

import {
    addColumns,
    changeColumn,
    fillColumnCells,
    getFolderValueFromDataRow,
    parseIntIfNumber,
    removeColumn,
    splitPrefixedNumber,
} from './actions';
import { CellMessage, EditorModel, ValueDescriptor } from './models';

describe('column mutation actions', () => {
    const queryInfo = QueryInfo.fromJsonForTests(sampleSet2QueryInfo);
    const insertColumnFieldKeys = List(queryInfo.getInsertColumns().map(col => col.fieldKey));
    const editorModel = new EditorModel({
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
        columns: insertColumnFieldKeys,
        id: 'insert-samples|samples/sample set 2',
        isPasting: false,
        focusColIdx: 1,
        focusRowIdx: 1,
        rowCount: 3,
        selectedColIdx: 1,
        selectedRowIdx: 1,
        selectionCells: Set<string>(),
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
        new SchemaQuery('samples', 'Sample Set 2'),
        queryInfo,
        dataRows,
        dataKeys,
        dataKeys.length,
        editorModel.id
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
        } as QueryLookup,
        multiValue: false,
        name: 'MaterialInputs/Sample set 3',
        required: false,
        shownInInsertView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
    });

    describe('addColumns', () => {
        test('no columns provided', () => {
            const updates = addColumns(
                editorModel,
                queryModel.queryInfo,
                fromJS(queryModel.rows),
                new ExtendedMap<string, QueryColumn>()
            );
            expect(updates.editorModelChanges).toBe(undefined);
        });

        test('add at beginning', () => {
            const updates = addColumns(
                editorModel,
                queryModel.queryInfo,
                fromJS(queryModel.rows),
                new ExtendedMap<string, QueryColumn>({ [queryColumn.fieldKey]: queryColumn })
            );
            expect(updates.editorModelChanges.cellMessages.size).toBe(1);
            expect(updates.editorModelChanges.cellMessages.has('2-0')).toBe(true);
            expect(updates.editorModelChanges.cellValues.get('0-0').size).toBe(0);
            expect(updates.editorModelChanges.cellValues.get('1-0').get(0).display).toBe('S-1');
            expect(updates.editorModelChanges.cellValues.get('2-0').get(0).display).toBe('Description 1');
            expect(updates.editorModelChanges.cellValues.get('1-1').get(0).display).toBe('S-2');
            expect(updates.editorModelChanges.cellValues.get('2-1').get(0).display).toBe('Description 2');
            expect(updates.editorModelChanges.columns.get(0)).toEqual(queryColumn.fieldKey);
            expect(updates.editorModelChanges.columns.size).toEqual(editorModel.columns.size + 1);
            expect(updates.queryInfo.getColumnIndex('Description')).toBe(
                queryModel.queryInfo.getColumnIndex('Description') + 1
            );
            expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(0);
            expect(updates.data.findEntry(rowValues => rowValues.has(queryColumn.fieldKey))).toBeTruthy();
        });

        test('add at beginning, insert fieldKey does not exist', () => {
            const updates = addColumns(
                editorModel,
                queryModel.queryInfo,
                fromJS(queryModel.rows),
                new ExtendedMap<string, QueryColumn>({ [queryColumn.fieldKey]: queryColumn }),
                'Bogus'
            );
            expect(updates.editorModelChanges.cellMessages.size).toBe(1);
            expect(updates.editorModelChanges.cellMessages.has('2-0')).toBe(true);
            expect(updates.editorModelChanges.cellValues.get('0-0').size).toBe(0);
            expect(updates.editorModelChanges.cellValues.get('1-0').get(0).display).toBe('S-1');
            expect(updates.editorModelChanges.cellValues.get('2-0').get(0).display).toBe('Description 1');
            expect(updates.editorModelChanges.cellValues.get('1-1').get(0).display).toBe('S-2');
            expect(updates.editorModelChanges.cellValues.get('2-1').get(0).display).toBe('Description 2');
            expect(updates.editorModelChanges.columns.get(0)).toEqual(queryColumn.fieldKey);
            expect(updates.editorModelChanges.columns.size).toEqual(editorModel.columns.size + 1);
            expect(updates.queryInfo.getColumnIndex('Description')).toBe(
                queryModel.queryInfo.getColumnIndex('Description') + 1
            );
            expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(0);
            expect(updates.data.findEntry(rowValues => rowValues.has(queryColumn.fieldKey))).toBeTruthy();
        });

        test('add at end', () => {
            const insertCols = queryModel.queryInfo.getInsertColumns();
            const lastInsertColKey = insertCols[insertCols.length - 1].fieldKey;
            const updates = addColumns(
                editorModel,
                queryModel.queryInfo,
                fromJS(queryModel.rows),
                new ExtendedMap<string, QueryColumn>({ [queryColumn.fieldKey]: queryColumn }),
                lastInsertColKey
            );
            expect(updates.editorModelChanges.cellMessages.size).toBe(1);
            expect(updates.editorModelChanges.cellMessages.has('1-0')).toBe(true);
            expect(updates.editorModelChanges.cellValues.get('0-0').get(0).display).toBe('S-1');
            expect(updates.editorModelChanges.cellValues.get('1-0').get(0).display).toBe('Description 1');
            expect(updates.editorModelChanges.cellValues.get('0-1').get(0).display).toBe('S-2');
            expect(updates.editorModelChanges.cellValues.get('1-1').get(0).display).toBe('Description 2');
            expect(updates.editorModelChanges.columns.get(updates.editorModelChanges.columns.size - 1)).toEqual(
                queryColumn.fieldKey
            );
            expect(updates.queryInfo.getColumnIndex('description')).toBe(
                queryModel.queryInfo.getColumnIndex('description')
            );
            expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(
                queryModel.queryInfo.getColumnIndex(lastInsertColKey) + 1
            );
            expect(updates.data.findEntry(rowValues => rowValues.has(queryColumn.fieldKey))).toBeTruthy();
        });

        test('add in the middle', () => {
            const nameColIndex = queryModel.queryInfo.getColumnIndex('name');

            const updates = addColumns(
                editorModel,
                queryModel.queryInfo,
                fromJS(queryModel.rows),
                new ExtendedMap<string, QueryColumn>({ [queryColumn.fieldKey]: queryColumn }),
                'Name'
            );

            expect(updates.editorModelChanges.cellMessages.size).toBe(1);
            expect(updates.editorModelChanges.cellMessages.has('2-0')).toBe(true);
            expect(updates.editorModelChanges.cellValues.get('0-0').get(0).display).toBe('S-1');
            expect(updates.editorModelChanges.cellValues.get('2-0').get(0).display).toBe('Description 1');
            expect(updates.editorModelChanges.cellValues.get('0-1').get(0).display).toBe('S-2');
            expect(updates.editorModelChanges.cellValues.get('2-1').get(0).display).toBe('Description 2');
            expect(updates.editorModelChanges.columns.findIndex(fieldKey => fieldKey === queryColumn.fieldKey)).toEqual(
                updates.editorModelChanges.columns.findIndex(fieldKey => fieldKey === 'Name') + 1
            );

            expect(updates.queryInfo.getColumnIndex('name')).toBe(nameColIndex);
            expect(updates.queryInfo.getColumnIndex('description')).toBe(
                queryModel.queryInfo.getColumnIndex('description') + 1
            );
            expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(nameColIndex + 1);
            expect(updates.data.findEntry(rowValues => rowValues.has(queryColumn.fieldKey))).toBeTruthy();
        });
    });

    describe('changeColumn', () => {
        test('column not found', () => {
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
            expect(editorModel.cellMessages.size).toBe(1);

            const updates = changeColumn(
                editorModel,
                queryModel.queryInfo,
                fromJS(queryModel.rows),
                'DESCRIPTION', // case-insensitive
                queryColumn
            );

            expect(updates.editorModelChanges.cellMessages.size).toBe(0);
            expect(updates.editorModelChanges.cellValues.get('1-0')).toBeFalsy();
            expect(updates.editorModelChanges.cellValues.get('1-1')).toBeFalsy();
            expect(updates.editorModelChanges.cellValues.get('1-2')).toBeFalsy();
            expect(updates.editorModelChanges.columns.find(fieldKey => fieldKey === 'Description')).toBeUndefined();
            expect(updates.editorModelChanges.columns.findIndex(fieldKey => fieldKey === queryColumn.fieldKey)).toEqual(
                editorModel.columns.findIndex(fieldKey => fieldKey === 'Description')
            );

            const colIndex = queryModel.queryInfo.columns.keyArray.findIndex(column => column === 'description');
            expect(updates.queryInfo.getColumn('Description')).toBeFalsy();
            expect(updates.queryInfo.getColumn(queryColumn.fieldKey)).toBeTruthy();
            const newColIndex = updates.queryInfo.columns.keyArray.findIndex(
                column => column === queryColumn.fieldKey.toLowerCase()
            );
            expect(newColIndex).toBe(colIndex);
            expect(updates.data.findEntry(rowValues => rowValues.has('Description)'))).toBeFalsy();
            expect(updates.data.findEntry(rowValues => rowValues.has(queryColumn.fieldKey))).toBeTruthy();
        });
    });

    describe('removeColumn', () => {
        test('column not found', () => {
            const updates = removeColumn(editorModel, queryModel.queryInfo, fromJS(queryModel.rows), 'Modified'); // not an insert column, so cannot be removed
            expect(updates.editorModelChanges).toBe(undefined);
        });

        test('first column', () => {
            const firstInputColumn = queryModel.queryInfo.getInsertColumns()[0];
            const updates = removeColumn(
                editorModel,
                queryModel.queryInfo,
                fromJS(queryModel.rows),
                firstInputColumn.fieldKey
            );

            expect(updates.editorModelChanges.cellMessages.size).toBe(1);
            expect(updates.editorModelChanges.cellValues.get('0-0').get(0).display).toBe('Description 1');
            expect(updates.editorModelChanges.cellValues.get('0-1').get(0).display).toBe('Description 2');
            expect(updates.editorModelChanges.columns.size).toEqual(editorModel.columns.size - 1);
            expect(
                updates.editorModelChanges.columns.find(fieldKey => fieldKey === firstInputColumn.fieldKey)
            ).toBeUndefined();
            expect(updates.data.find(row => row.has(firstInputColumn.fieldKey))).toBeFalsy();
        });

        test('last column', () => {
            const insertCols = queryModel.queryInfo.getInsertColumns();
            const lastInputColumn = insertCols[insertCols.length - 1];
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
            expect(updates.editorModelChanges.columns.size).toEqual(editorModel.columns.size - 1);
            expect(
                updates.editorModelChanges.columns.find(fieldKey => fieldKey === lastInputColumn.fieldKey)
            ).toBeUndefined();
            expect(updates.data.find(row => row.has(lastInputColumn.fieldKey))).toBeFalsy();
        });

        test('middle column', () => {
            const fieldKey = 'Description';
            const updates = removeColumn(editorModel, queryModel.queryInfo, fromJS(queryModel.rows), fieldKey);

            expect(updates.editorModelChanges.cellMessages.size).toBe(0);
            expect(updates.editorModelChanges.cellValues.get('0-0').get(0).display).toBe('S-1');
            expect(updates.editorModelChanges.cellValues.has('1-0')).toBe(false);
            expect(updates.editorModelChanges.columns.size).toEqual(editorModel.columns.size - 1);
            expect(updates.editorModelChanges.columns.find(fk => fk === fieldKey)).toBeUndefined();
            expect(updates.data.find(row => row.has(fieldKey))).toBeFalsy();
        });
    });
});

describe('fillColumnCells', () => {
    const data = fromJS({ 123: {}, 456: {}, 789: {} });
    const dataKeys = fromJS([123, 456, 789]);

    const editorModel = new EditorModel({ id: 'generate|fill|sequence' }).merge({
        cellMessages: Map<string, CellMessage>({
            '1-0': 'description 1 message',
        }),
        cellValues: Map<string, List<ValueDescriptor>>({
            '0-0': List<ValueDescriptor>([
                {
                    display: 'S-1',
                    raw: 1,
                },
            ]),
            '0-1': List<ValueDescriptor>([
                {
                    display: 'S-2',
                    raw: 2,
                },
            ]),
            '0-2': List<ValueDescriptor>([
                {
                    display: 'S-3',
                    raw: 3,
                },
            ]),
            '1-0': List<ValueDescriptor>([
                {
                    display: '1',
                    raw: 1,
                },
            ]),
            '1-1': List<ValueDescriptor>([
                {
                    display: '3',
                    raw: 3,
                },
            ]),
            '1-2': List<ValueDescriptor>([
                {
                    display: '5',
                    raw: 5,
                },
            ]),
            '2-0': List<ValueDescriptor>([
                {
                    display: '3.0',
                    raw: 3.0,
                },
            ]),
            '2-1': List<ValueDescriptor>([
                {
                    display: '1.5',
                    raw: 1.5,
                },
            ]),
            '2-2': List<ValueDescriptor>([
                {
                    display: '0',
                    raw: 0,
                },
            ]),
            '3-0': List<ValueDescriptor>([
                {
                    display: 'Lookup 1',
                    raw: 1,
                },
            ]),
            '3-1': List<ValueDescriptor>([
                {
                    display: 'Lookup 2',
                    raw: 2,
                },
            ]),
            '3-2': List<ValueDescriptor>([
                {
                    display: 'Lookup 2',
                    raw: 2,
                },
            ]),
            '4-0': List<ValueDescriptor>([
                {
                    display: 'S-1',
                    raw: 'S-1',
                },
            ]),
            '4-1': List<ValueDescriptor>([
                {
                    display: 2,
                    raw: 2,
                },
            ]),
            '4-2': List<ValueDescriptor>([
                {
                    display: 'Lookup 5',
                    raw: 5,
                },
            ]),
            '5-0': List<ValueDescriptor>([
                {
                    display: 'qwer',
                    raw: 'qwer',
                },
            ]),
            '5-1': List<ValueDescriptor>([
                {
                    display: 'asdf',
                    raw: 'asdf',
                },
            ]),
            '5-2': List<ValueDescriptor>([
                {
                    display: 'zxcv',
                    raw: 'zxcv',
                },
            ]),
            '6-0': List<ValueDescriptor>([
                {
                    display: '2023-06-01',
                    raw: '2023-06-01',
                },
            ]),
            '6-1': List<ValueDescriptor>([
                {
                    display: '',
                    raw: '',
                },
            ]),
            '6-2': List<ValueDescriptor>([
                {
                    display: '2023-04-16',
                    raw: '2023-04-16',
                },
            ]),
            '7-0': List<ValueDescriptor>([
                {
                    display: '2023-06-01 10:42',
                    raw: '2023-06-01 10:42',
                },
            ]),
            '7-1': List<ValueDescriptor>([
                {
                    display: '',
                    raw: '',
                },
            ]),
            '7-2': List<ValueDescriptor>([
                {
                    display: '2023-04-16 11:11',
                    raw: '2023-04-16 11:11',
                },
            ]),
        }),
        columns: List(['a', 'b', 'c', 'd', 'e']),
        rowCount: 10,
    }) as EditorModel;

    const textCol = new QueryColumn({
        fieldKey: 'textCol',
        lookup: undefined,
    });

    beforeAll(() => {
        global.console.warn = jest.fn();
    });

    test('single initialSelection', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            ['0-0'],
            ['0-1', '0-2', '0-3'],
            dataKeys,
            data
        );
        // Filled values should be copies of the initial selection
        for (let i = 1; i <= 3; i++) {
            expect(cellValues.get(`0-${i}`).get(0).display).toEqual('S-1');
            expect(cellValues.get(`0-${i}`).get(0).raw).toEqual(1);
        }
    });

    test('prefixed number, multi initialSelection', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            ['0-0', '0-1', '0-2'],
            ['0-3', '0-4'],
            dataKeys,
            data
        );
        expect(cellValues.get('0-3').get(0).display).toEqual('S-4');
        expect(cellValues.get('0-3').get(0).raw).toEqual('S-4');
        expect(cellValues.get('0-4').get(0).display).toEqual('S-5');
        expect(cellValues.get('0-4').get(0).raw).toEqual('S-5');
    });

    test('integer, multi initialSelection, forward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            ['1-0', '1-1', '1-2'],
            ['1-3', '1-4'],
            dataKeys,
            data
        );
        expect(cellValues.get('1-3').get(0).display).toEqual('7');
        expect(cellValues.get('1-3').get(0).raw).toEqual(7);
        expect(cellValues.get('1-4').get(0).display).toEqual('9');
        expect(cellValues.get('1-4').get(0).raw).toEqual(9);
    });

    test('integer, multi initialSelection, backward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            ['1-1', '1-2'],
            ['1-0'],
            dataKeys,
            data
        );
        expect(cellValues.get('1-0').get(0).display).toEqual('1');
        expect(cellValues.get('1-0').get(0).raw).toEqual(1);
    });

    test('float, multi initialSelection, forward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            ['2-0', '2-1', '2-2'],
            ['2-3', '2-4'],
            dataKeys,
            data
        );
        expect(cellValues.get('2-3').get(0).display).toEqual('-1.5');
        expect(cellValues.get('2-3').get(0).raw).toEqual(-1.5);
        expect(cellValues.get('2-4').get(0).display).toEqual('-3');
        expect(cellValues.get('2-4').get(0).raw).toEqual(-3);
    });

    test('float, multi initialSelection, backward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            ['2-1', '2-2'],
            ['2-0'],
            dataKeys,
            data
        );
        expect(cellValues.get('2-0').get(0).display).toEqual('3');
        expect(cellValues.get('2-0').get(0).raw).toEqual(3);
    });

    test('date, single row initialSelection, forward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            ['6-0'],
            ['6-1', '6-2', '6-3'],
            dataKeys,
            data
        );
        // Filled values should be copies of the initial selection
        for (let i = 1; i <= 3; i++) {
            expect(cellValues.get(`6-${i}`).get(0).display).toEqual(`2023-06-0${i + 1}`);
            expect(cellValues.get(`6-${i}`).get(0).raw).toEqual(`2023-06-0${i + 1}`);
        }
    });

    test('date, single row initialSelection, backward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            ['6-2'],
            ['6-0', '6-1'],
            dataKeys,
            data
        );
        // Filled values should be copies of the initial selection
        for (let i = 0; i <= 2; i++) {
            expect(cellValues.get(`6-${i}`).get(0).display).toEqual(`2023-04-${14 + i}`);
            expect(cellValues.get(`6-${i}`).get(0).raw).toEqual(`2023-04-${14 + i}`);
        }
    });

    test('datetime, single row initialSelection, forward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            ['7-0'],
            ['7-1', '7-2', '7-3'],
            dataKeys,
            data
        );
        // Filled values should be copies of the initial selection
        for (let i = 1; i <= 3; i++) {
            expect(cellValues.get(`7-${i}`).get(0).display).toEqual(`2023-06-0${i + 1} 10:42`);
            expect(cellValues.get(`7-${i}`).get(0).raw).toEqual(`2023-06-0${i + 1} 10:42`);
        }
    });

    test('datetime, single row initialSelection, backward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            ['7-2'],
            ['7-0', '7-1'],
            dataKeys,
            data
        );
        // Filled values should be copies of the initial selection
        for (let i = 0; i <= 2; i++) {
            expect(cellValues.get(`7-${i}`).get(0).display).toEqual(`2023-04-${14 + i} 11:11`);
            expect(cellValues.get(`7-${i}`).get(0).raw).toEqual(`2023-04-${14 + i} 11:11`);
        }
    });

    test('text, multi initialSelection, forward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            ['5-0', '5-1', '5-2'],
            ['5-3', '5-4', '5-5'],
            dataKeys,
            data
        );
        expect(cellValues.get('5-3').get(0).display).toEqual('qwer');
        expect(cellValues.get('5-3').get(0).raw).toEqual('qwer');
        expect(cellValues.get('5-4').get(0).display).toEqual('asdf');
        expect(cellValues.get('5-4').get(0).raw).toEqual('asdf');
        expect(cellValues.get('5-5').get(0).display).toEqual('zxcv');
        expect(cellValues.get('5-5').get(0).raw).toEqual('zxcv');
    });
});

describe('getFolderValueFromDataRow', () => {
    const dataEmpty = fromJS({ '123': {}, '456': {}, '789': {} });
    const dataWithout = fromJS({ '123': { test: 'a' }, '456': { test: 'b' }, '789': { test: 'c' } });
    const dataFolder = fromJS({
        '123': { test: 'a', folder: 'f1' },
        '456': { test: 'b', Folder: 'f2' },
        '789': { test: 'c', FOLDER: 'f3' },
    });
    const dataContainer = fromJS({
        '123': { test: 'a', container: 'c1' },
        '456': { test: 'b', Container: 'c2' },
        '789': { test: 'c', CONTAINER: 'c3' },
    });
    const dataKeys = fromJS(['123', '456', '789']);

    test('undefined', () => {
        expect(getFolderValueFromDataRow('0-0', dataKeys, dataEmpty)).toBe(undefined);
        expect(getFolderValueFromDataRow('1-1', dataKeys, dataEmpty)).toBe(undefined);
        expect(getFolderValueFromDataRow('2-2', dataKeys, dataEmpty)).toBe(undefined);
        expect(getFolderValueFromDataRow('0-0', dataKeys, dataWithout)).toBe(undefined);
        expect(getFolderValueFromDataRow('1-1', dataKeys, dataWithout)).toBe(undefined);
        expect(getFolderValueFromDataRow('2-2', dataKeys, dataWithout)).toBe(undefined);
    });

    test('defined', () => {
        expect(getFolderValueFromDataRow('0-0', dataKeys, dataFolder)).toBe('f1');
        expect(getFolderValueFromDataRow('1-1', dataKeys, dataFolder)).toBe('f2');
        expect(getFolderValueFromDataRow('2-2', dataKeys, dataFolder)).toBe('f3');
        expect(getFolderValueFromDataRow('0-0', dataKeys, dataContainer)).toBe('c1');
        expect(getFolderValueFromDataRow('1-1', dataKeys, dataContainer)).toBe('c2');
        expect(getFolderValueFromDataRow('2-2', dataKeys, dataContainer)).toBe('c3');
    });
});

describe('parseIntIfNumber', () => {
    test('empty', () => {
        expect(parseIntIfNumber(undefined)).toBe(undefined);
        expect(parseIntIfNumber(null)).toBe(null);
        expect(parseIntIfNumber('')).toBe('');
        expect(parseIntIfNumber(' ')).toBe(' ');
    });

    test('string', () => {
        expect(parseIntIfNumber('0')).toBe(0);
        expect(parseIntIfNumber('1')).toBe(1);
        expect(parseIntIfNumber(' 1 ')).toBe(1);
        expect(parseIntIfNumber('1_2')).toBe('1_2');
    });

    test('number', () => {
        expect(parseIntIfNumber(0)).toBe(0);
        expect(parseIntIfNumber(1)).toBe(1);
        expect(parseIntIfNumber(1.2)).toBe(1);
        expect(parseIntIfNumber(1.9)).toBe(1);
    });
});

describe('splitPrefixedNumber', () => {
    test('parses string as expected', () => {
        expect(splitPrefixedNumber('ABC-123')).toEqual(['ABC-', '123']);
        expect(splitPrefixedNumber('ABC 123')).toEqual(['ABC ', '123']);
        expect(splitPrefixedNumber('ABC-1.23')).toEqual(['ABC-', '1.23']);
        expect(splitPrefixedNumber('ABC-1.23.4')).toEqual(['ABC-1.', '23.4']);
        expect(splitPrefixedNumber('ABC.0')).toEqual(['ABC.', '0']);
        expect(splitPrefixedNumber('ABC.1.2')).toEqual(['ABC.', '1.2']);
        expect(splitPrefixedNumber('ABC')).toEqual(['ABC', undefined]);
        expect(splitPrefixedNumber('ABC-')).toEqual(['ABC-', undefined]);
        expect(splitPrefixedNumber('123')).toEqual([undefined, '123']);
        expect(splitPrefixedNumber('123.45')).toEqual([undefined, '123.45']);
    });

    test('param as number', () => {
        expect(splitPrefixedNumber(123)).toEqual([undefined, '123']);
    });

    test('param empty', () => {
        expect(splitPrefixedNumber(undefined)).toEqual([undefined, undefined]);
        expect(splitPrefixedNumber(null)).toEqual([undefined, undefined]);
        expect(splitPrefixedNumber('')).toEqual([undefined, undefined]);
    });
});
