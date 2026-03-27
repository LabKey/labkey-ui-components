import { List, Map, Set } from 'immutable';

import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn, QueryLookup } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import sampleSet2QueryInfo from '../../../test/data/sampleSet2-getQueryDetails.json';

import { ComponentsAPIWrapper, getTestAPIWrapper } from '../../APIWrapper';

import { Row } from '../../query/selectRows';

import { DATETIME_RANGE_URI, TIME_RANGE_URI } from '../domainproperties/constants';

import {
    addColumns,
    changeColumn,
    detectPadLength,
    generateColumnFillValues,
    initEditorModel,
    loadEditorModelData,
    parseIntIfNumber,
    parsePastedLookup,
    removeColumn,
    removeColumns,
    resolveValueDescriptors,
    splitPrefixedNumber,
    updateColumnLookup,
    validateAndInsertPastedData,
} from './actions';
import { CellMessage, EditorModel, ValueDescriptor } from './models';
import { genCellKey } from './utils';
import sampleSetQueryInfoJSON from '../../../test/data/sampleSetAllFieldTypes-getQueryDetails.json';
import { MockEditableGridLoader } from './utils.test';
import { MULTI_CHOICE_TYPE } from '../domainproperties/PropDescType';
import { joinMultiValueForExport } from '../../util/utils';

describe('column mutation actions', () => {
    const queryInfo = QueryInfo.fromJsonForTests(sampleSet2QueryInfo);
    const insertColumnFieldKeys = List(queryInfo.getInsertColumns().map(col => col.fieldKey.toLowerCase()));
    const firstFK = insertColumnFieldKeys.get(0);
    const secondFk = insertColumnFieldKeys.get(1);
    const sixthFk = insertColumnFieldKeys.get(5);
    const editorModel = new EditorModel({
        cellMessages: Map<string, CellMessage>({
            [genCellKey(secondFk, 0)]: 'description 1 message',
        }),
        cellValues: Map<string, List<ValueDescriptor>>({
            [genCellKey(firstFK, 0)]: List<ValueDescriptor>([
                {
                    display: 'S-1',
                    raw: 'S-1',
                },
            ]),
            [genCellKey(firstFK, 1)]: List<ValueDescriptor>([
                {
                    display: 'S-2',
                    raw: 'S-2',
                },
            ]),
            [genCellKey(firstFK, 2)]: List<ValueDescriptor>([
                {
                    display: 'S-3',
                    raw: 'S-3',
                },
            ]),
            [genCellKey(secondFk, 0)]: List<ValueDescriptor>([
                {
                    display: 'Description 1',
                    raw: 'Description 1',
                },
            ]),
            [genCellKey(secondFk, 1)]: List<ValueDescriptor>([
                {
                    display: 'Description 2',
                    raw: 'Description 2',
                },
            ]),
            [genCellKey(secondFk, 2)]: List<ValueDescriptor>([
                {
                    display: 'Description 3',
                    raw: 'Description 3',
                },
            ]),
            [genCellKey(sixthFk, 0)]: List<ValueDescriptor>([
                {
                    display: 'requirement 1',
                    raw: 'requirement 1',
                },
            ]),
        }),
        queryInfo,
        orderedColumns: insertColumnFieldKeys,
        columnMap: insertColumnFieldKeys.reduce((result, key) => {
            return result.set(key, queryInfo.getColumn(key));
        }, Map<string, any>()),
        id: 'insert-samples|samples/sample set 2',
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
            const updates = addColumns(editorModel, new ExtendedMap<string, QueryColumn>());
            expect(updates).toEqual({});
        });

        test('add at beginning', () => {
            const addedFk = queryColumn.fieldKey;
            const updates = addColumns(
                editorModel,
                new ExtendedMap<string, QueryColumn>({ [queryColumn.fieldKey]: queryColumn })
            );
            expect(updates.cellMessages).toEqual(editorModel.cellMessages);
            expect(updates.cellValues.get(genCellKey(addedFk, 0))).not.toBeUndefined();
            expect(updates.cellValues.get(genCellKey(addedFk, 1))).not.toBeUndefined();
            expect(updates.cellValues.get(genCellKey(addedFk, 2))).not.toBeUndefined();
            expect(updates.orderedColumns.get(0)).toEqual(queryColumn.fieldKey.toLowerCase());
            expect(updates.orderedColumns.size).toEqual(editorModel.orderedColumns.size + 1);
            expect(updates.queryInfo.getColumnIndex('Description')).toBe(
                queryModel.queryInfo.getColumnIndex('Description') + 1
            );
            expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(0);
        });

        test('add at beginning, insert fieldKey does not exist', () => {
            const updates = addColumns(
                editorModel,
                new ExtendedMap<string, QueryColumn>({ [queryColumn.fieldKey]: queryColumn }),
                'Bogus'
            );
            expect(updates.cellMessages).toEqual(editorModel.cellMessages);
            expect(updates.orderedColumns.get(0)).toEqual(queryColumn.fieldKey.toLowerCase());
            expect(updates.orderedColumns.size).toEqual(editorModel.orderedColumns.size + 1);
            expect(updates.queryInfo.getColumnIndex('Description')).toBe(
                queryModel.queryInfo.getColumnIndex('Description') + 1
            );
            expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(0);
        });

        test('add at end', () => {
            const insertCols = queryModel.queryInfo.getInsertColumns();
            const lastInsertColKey = insertCols[insertCols.length - 1].fieldKey;
            const updates = addColumns(
                editorModel,
                new ExtendedMap<string, QueryColumn>({ [queryColumn.fieldKey]: queryColumn }),
                lastInsertColKey
            );
            expect(updates.cellMessages).toEqual(editorModel.cellMessages);
            expect(updates.orderedColumns.get(updates.orderedColumns.size - 1)).toEqual(
                queryColumn.fieldKey.toLowerCase()
            );
            expect(updates.queryInfo.getColumnIndex('description')).toBe(
                queryModel.queryInfo.getColumnIndex('description')
            );
            expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(
                queryModel.queryInfo.getColumnIndex(lastInsertColKey) + 1
            );
        });

        test('add in the middle', () => {
            const nameColIndex = queryModel.queryInfo.getColumnIndex('name');
            const updates = addColumns(
                editorModel,
                new ExtendedMap<string, QueryColumn>({ [queryColumn.fieldKey]: queryColumn }),
                'Name'
            );

            expect(updates.cellMessages).toEqual(editorModel.cellMessages);
            expect(updates.orderedColumns.indexOf(queryColumn.fieldKey.toLowerCase())).toEqual(
                updates.orderedColumns.indexOf('name') + 1
            );
            expect(updates.queryInfo.getColumnIndex('name')).toBe(nameColIndex);
            expect(updates.queryInfo.getColumnIndex('description')).toBe(
                queryModel.queryInfo.getColumnIndex('description') + 1
            );
            expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(nameColIndex + 1);
        });
    });

    describe('changeColumn', () => {
        test('column not found', () => {
            const updates = changeColumn(editorModel, 'Nonesuch', queryColumn);
            expect(updates).toEqual({});
        });

        test('has values and messages', () => {
            const updates = changeColumn(
                editorModel,
                'DESCRIPTION', // case-insensitive
                queryColumn
            );

            expect(updates.cellMessages.size).toBe(0);
            expect(updates.orderedColumns.find(fieldKey => fieldKey === 'Description')).toBeUndefined();
            expect(updates.orderedColumns.indexOf(queryColumn.fieldKey.toLowerCase())).toEqual(
                editorModel.orderedColumns.indexOf('description')
            );
            expect(updates.queryInfo.getColumn('Description')).toBeFalsy();
            expect(updates.queryInfo.getColumn(queryColumn.fieldKey)).toBeTruthy();
        });
    });

    describe('removeColumn', () => {
        test('column not found', () => {
            let updates = removeColumn(editorModel, 'Modified'); // not an insert column, so cannot be removed
            expect(updates).toEqual({});
            updates = removeColumns(editorModel, ['Modified']);
            expect(updates).toEqual({});
        });

        function verifyRemoveFirstColumnUpdates(updates: Partial<EditorModel>, fieldKeyFirst: string) {
            expect(updates.cellMessages.size).toBe(1);
            expect(updates.cellValues.has(genCellKey(firstFK, 0))).toBe(false);
            expect(updates.cellValues.has(genCellKey(firstFK, 1))).toBe(false);
            expect(updates.cellValues.has(genCellKey(firstFK, 2))).toBe(false);
            expect(updates.cellValues.get(genCellKey(secondFk, 0)).get(0).display).toBe('Description 1');
            expect(updates.cellValues.get(genCellKey(secondFk, 1)).get(0).display).toBe('Description 2');
            expect(updates.cellValues.get(genCellKey(secondFk, 2)).get(0).display).toBe('Description 3');
            expect(updates.cellValues.get(genCellKey(sixthFk, 0)).get(0).display).toBe('requirement 1');
            expect(updates.orderedColumns.size).toEqual(editorModel.orderedColumns.size - 1);
            expect(updates.orderedColumns.find(fieldKey => fieldKey === fieldKeyFirst)).toBeUndefined();
        }
        test('first column', () => {
            const firstInputColumnFieldKey = queryModel.queryInfo.getInsertColumns()[0].fieldKey;
            verifyRemoveFirstColumnUpdates(
                removeColumn(editorModel, firstInputColumnFieldKey),
                firstInputColumnFieldKey
            );
            verifyRemoveFirstColumnUpdates(
                removeColumns(editorModel, [firstInputColumnFieldKey]),
                firstInputColumnFieldKey
            );
        });

        function verifyRemoveLastColumnUpdates(updates: Partial<EditorModel>, fieldKeyLast: string) {
            expect(updates.cellMessages.size).toBe(1);
            expect(updates.cellValues.get(genCellKey(firstFK, 0)).get(0).display).toBe('S-1');
            expect(updates.cellValues.get(genCellKey(firstFK, 1)).get(0).display).toBe('S-2');
            expect(updates.cellValues.get(genCellKey(firstFK, 2)).get(0).display).toBe('S-3');
            expect(updates.cellValues.get(genCellKey(secondFk, 0)).get(0).display).toBe('Description 1');
            expect(updates.cellValues.get(genCellKey(secondFk, 1)).get(0).display).toBe('Description 2');
            expect(updates.cellValues.get(genCellKey(secondFk, 2)).get(0).display).toBe('Description 3');
            expect(updates.cellValues.has(genCellKey(sixthFk, 0))).toBe(false);
            expect(updates.orderedColumns.size).toEqual(editorModel.orderedColumns.size - 1);
            expect(updates.orderedColumns.find(fieldKey => fieldKey === fieldKeyLast)).toBeUndefined();
        }
        test('last column', () => {
            const insertCols = queryModel.queryInfo.getInsertColumns();
            const lastInputColumnFK = insertCols[insertCols.length - 1].fieldKey;
            verifyRemoveLastColumnUpdates(removeColumn(editorModel, lastInputColumnFK), lastInputColumnFK);
            verifyRemoveLastColumnUpdates(removeColumns(editorModel, [lastInputColumnFK]), lastInputColumnFK);
        });

        function verifyRemoveMiddleColumnUpdates(updates: Partial<EditorModel>, fieldKeyMid: string) {
            expect(updates.cellMessages.size).toBe(0);
            expect(updates.cellValues.get(genCellKey(firstFK, 0)).get(0).display).toBe('S-1');
            expect(updates.cellValues.get(genCellKey(firstFK, 1)).get(0).display).toBe('S-2');
            expect(updates.cellValues.get(genCellKey(firstFK, 2)).get(0).display).toBe('S-3');
            expect(updates.cellValues.has(genCellKey(secondFk, 0))).toBe(false);
            expect(updates.cellValues.has(genCellKey(secondFk, 1))).toBe(false);
            expect(updates.cellValues.has(genCellKey(secondFk, 2))).toBe(false);
            expect(updates.cellValues.get(genCellKey(sixthFk, 0)).get(0).display).toBe('requirement 1');
            expect(updates.orderedColumns.size).toEqual(editorModel.orderedColumns.size - 1);
            expect(updates.orderedColumns.find(fk => fk === fieldKeyMid)).toBeUndefined();
        }
        test('middle column', () => {
            const fieldKey = 'Description';
            verifyRemoveMiddleColumnUpdates(removeColumn(editorModel, fieldKey), fieldKey);
            verifyRemoveMiddleColumnUpdates(removeColumns(editorModel, [fieldKey]), fieldKey);
        });

        test('remove first and second columns', () => {
            const firstInputColumnFieldKey = queryModel.queryInfo.getInsertColumns()[0].fieldKey;
            const secondInputColumnFieldKey = queryModel.queryInfo.getInsertColumns()[1].fieldKey;

            const updates = removeColumns(editorModel, [firstInputColumnFieldKey, secondInputColumnFieldKey]);

            expect(updates.cellMessages.size).toBe(0);
            expect(updates.cellValues.has(genCellKey(firstFK, 0))).toBe(false);
            expect(updates.cellValues.has(genCellKey(firstFK, 1))).toBe(false);
            expect(updates.cellValues.has(genCellKey(firstFK, 2))).toBe(false);
            expect(updates.cellValues.has(genCellKey(secondFk, 0))).toBe(false);
            expect(updates.cellValues.has(genCellKey(secondFk, 1))).toBe(false);
            expect(updates.cellValues.has(genCellKey(secondFk, 2))).toBe(false);
            expect(updates.cellValues.get(genCellKey(sixthFk, 0)).get(0).display).toBe('requirement 1');
            expect(updates.orderedColumns.size).toEqual(editorModel.orderedColumns.size - 2);
            expect(updates.orderedColumns.find(fieldKey => fieldKey === firstInputColumnFieldKey)).toBeUndefined();
            expect(updates.orderedColumns.find(fieldKey => fieldKey === secondInputColumnFieldKey)).toBeUndefined();
        });
    });
});

describe('generateColumnFillValues', () => {
    // Makes cellValues where the values have the same display and raw value
    function makeCellValues(fk: string, rows: string[][]): Record<string, List<ValueDescriptor>> {
        return rows.reduce((result, values, rowIdx) => {
            result[genCellKey(fk, rowIdx)] = List<ValueDescriptor>(
                values.map(value => ({
                    raw: value,
                    display: value,
                }))
            );
            return result;
        }, {});
    }
    const lookupFk = 'lookup';
    const intFk = 'int';
    const floatFk = 'float';
    const dateFk = 'date';
    const datetimeFk = 'datetime';
    const strFk = 'str';
    const quoteFk = 'quote';
    const mvFk = 'mv';
    const columns = {
        [lookupFk]: new QueryColumn({ fieldKey: lookupFk, name: lookupFk, lookup: { isPublic: true } as QueryLookup }),
        [intFk]: new QueryColumn({ fieldKey: intFk, name: intFk, jsonType: 'int' }),
        [floatFk]: new QueryColumn({ fieldKey: floatFk, name: floatFk, jsonType: 'float' }),
        [strFk]: new QueryColumn({ fieldKey: strFk, name: strFk }),
        [dateFk]: new QueryColumn({ fieldKey: dateFk, name: dateFk, jsonType: 'date' }),
        [datetimeFk]: new QueryColumn({ fieldKey: datetimeFk, name: datetimeFk, jsonType: 'date' }),
        [quoteFk]: new QueryColumn({ fieldKey: quoteFk, name: quoteFk }),
        [mvFk]: new QueryColumn({ fieldKey: mvFk, name: mvFk, lookup: { multiValued: 'junction' } as QueryLookup }),
    };
    const queryInfo = QueryInfo.fromJsonForTests({ pkCols: [lookupFk], columns });
    const editorModel = new EditorModel({}).merge({
        queryInfo,
        cellMessages: Map<string, CellMessage>({
            '1-0': 'description 1 message',
        }),
        cellValues: Map<string, List<ValueDescriptor>>({
            // Can't use makeCellValues for the number or lookup values because raw != display
            [genCellKey(lookupFk, 0)]: List<ValueDescriptor>([
                {
                    display: 'S-1',
                    raw: 1,
                },
            ]),
            [genCellKey(lookupFk, 1)]: List<ValueDescriptor>([
                {
                    display: 'S-2',
                    raw: 2,
                },
            ]),
            [genCellKey(lookupFk, 2)]: List<ValueDescriptor>([
                {
                    display: 'S-3',
                    raw: 3,
                },
            ]),
            [genCellKey(intFk, 0)]: List<ValueDescriptor>([
                {
                    display: '1',
                    raw: 1,
                },
            ]),
            [genCellKey(intFk, 1)]: List<ValueDescriptor>([
                {
                    display: '3',
                    raw: 3,
                },
            ]),
            [genCellKey(intFk, 2)]: List<ValueDescriptor>([
                {
                    display: '5',
                    raw: 5,
                },
            ]),
            [genCellKey(floatFk, 0)]: List<ValueDescriptor>([
                {
                    display: '3.0',
                    raw: 3.0,
                },
            ]),
            [genCellKey(floatFk, 1)]: List<ValueDescriptor>([
                {
                    display: '1.5',
                    raw: 1.5,
                },
            ]),
            [genCellKey(floatFk, 2)]: List<ValueDescriptor>([
                {
                    display: '0',
                    raw: 0,
                },
            ]),
            ...makeCellValues(strFk, [['qwer'], ['asdf'], ['zxcv']]),
            ...makeCellValues(dateFk, [['2023-06-01'], [''], ['2023-04-16']]),
            ...makeCellValues(datetimeFk, [['2023-06-01 10:42'], [''], ['2023-04-16 11:11']]),
            ...makeCellValues(quoteFk, [['S,1'], ['S,2'], ['']]),
            ...makeCellValues(mvFk, [['S,1', 'S,2'], ['S2', 'S3'], [''], ['']]),
        }),
        columnMap: Object.keys(columns).reduce((result, key) => {
            return result.set(key, queryInfo.getColumn(key));
        }, Map<string, QueryColumn>()),
        orderedColumns: List([lookupFk, intFk, floatFk, strFk, dateFk, datetimeFk, quoteFk, mvFk]),
        rowCount: 10,
    }) as EditorModel;

    test('single initialSelection', () => {
        const cellValues = generateColumnFillValues(editorModel, [genCellKey(lookupFk, 0)], undefined, [
            genCellKey(lookupFk, 1),
            genCellKey(lookupFk, 2),
            genCellKey(lookupFk, 3),
        ]);
        expect(cellValues).toEqual(['S-1', 'S-1', 'S-1']);
    });

    test('prefixed number, multi initialSelection', () => {
        const cellValues = generateColumnFillValues(
            editorModel,
            [genCellKey(lookupFk, 0), genCellKey(lookupFk, 1), genCellKey(lookupFk, 2)],
            undefined,
            [genCellKey(lookupFk, 3), genCellKey(lookupFk, 4)]
        );
        expect(cellValues).toEqual(['S-4', 'S-5']);
    });

    test('integer, multi initialSelection, forward', () => {
        const cellValues = generateColumnFillValues(
            editorModel,
            [genCellKey(intFk, 0), genCellKey(intFk, 1), genCellKey(intFk, 2)],
            undefined,
            [genCellKey(intFk, 3), genCellKey(intFk, 4)]
        );
        expect(cellValues).toEqual(['7', '9']);
    });

    test('integer, multi initialSelection, backward', () => {
        const cellValues = generateColumnFillValues(
            editorModel,
            [genCellKey(intFk, 1), genCellKey(intFk, 2)],
            undefined,
            [genCellKey(intFk, 0)]
        );
        expect(cellValues).toEqual(['1']);
    });

    test('float, multi initialSelection, forward', () => {
        const cellValues = generateColumnFillValues(
            editorModel,
            [genCellKey(floatFk, 0), genCellKey(floatFk, 1), genCellKey(floatFk, 2)],
            undefined,
            [genCellKey(floatFk, 3), genCellKey(floatFk, 4)]
        );
        expect(cellValues).toEqual(['-1.5', '-3']);
    });

    test('float, multi initialSelection, backward', () => {
        const cellValues = generateColumnFillValues(
            editorModel,
            [genCellKey(floatFk, 1), genCellKey(floatFk, 2)],
            undefined,
            [genCellKey(floatFk, 0)]
        );
        expect(cellValues).toEqual(['3']);
    });

    test('date, single row initialSelection, forward', () => {
        const cellValues = generateColumnFillValues(editorModel, [genCellKey(dateFk, 0)], undefined, [
            genCellKey(dateFk, 1),
            genCellKey(dateFk, 2),
            genCellKey(dateFk, 3),
        ]);
        // Filled values should be copies of the initial selection
        const expected = [];
        for (let i = 1; i <= 3; i++) {
            expected.push(`2023-06-0${i + 1}`);
        }
        expect(cellValues).toEqual(expected);
    });

    test('date, single row initialSelection, backward', () => {
        const cellValues = generateColumnFillValues(editorModel, [genCellKey(dateFk, 2)], undefined, [
            genCellKey(dateFk, 0),
            genCellKey(dateFk, 1),
        ]);
        // Filled values decrement by one day
        const expected = [];
        for (let i = 0; i < 2; i++) {
            expected.push(`2023-04-${15 - i}`);
        }
        expect(cellValues).toEqual(expected);
    });

    test('datetime, single row initialSelection, forward', () => {
        const cellValues = generateColumnFillValues(editorModel, [genCellKey(datetimeFk, 0)], undefined, [
            genCellKey(datetimeFk, 1),
            genCellKey(datetimeFk, 2),
            genCellKey(datetimeFk, 3),
        ]);
        // Filled values should increment by one day
        const expected = [];
        for (let i = 1; i <= 3; i++) {
            expected.push(`2023-06-0${i + 1} 10:42`);
        }

        expect(cellValues).toEqual(expected);
    });

    test('datetime, single row initialSelection, backward', () => {
        const cellValues = generateColumnFillValues(editorModel, [genCellKey(datetimeFk, 2)], undefined, [
            genCellKey(datetimeFk, 0),
            genCellKey(datetimeFk, 1),
        ]);
        // Filled values decrement by one day
        const expected = [];
        for (let i = 0; i < 2; i++) {
            expected.push(`2023-04-${15 - i} 11:11`);
        }
        expect(cellValues).toEqual(expected);
    });

    test('text, multi initialSelection, forward', () => {
        const cellValues = generateColumnFillValues(
            editorModel,
            [genCellKey(strFk, 0), genCellKey(strFk, 1), genCellKey(strFk, 2)],
            undefined,
            [genCellKey(strFk, 3), genCellKey(strFk, 4), genCellKey(strFk, 5)]
        );
        expect(cellValues).toEqual(['qwer', 'asdf', 'zxcv']);
    });

    // Issue 52412
    test('values with commas are quoted', () => {
        let cellValues = generateColumnFillValues(
            editorModel,
            [genCellKey(quoteFk, 0), genCellKey(quoteFk, 1)],
            undefined,
            [genCellKey(strFk, 2), genCellKey(strFk, 3), genCellKey(strFk, 4)]
        );
        // Incremented values with commas should be quoted
        expect(cellValues).toEqual(['"S,3"', '"S,4"', '"S,5"']);

        cellValues = generateColumnFillValues(editorModel, [genCellKey(quoteFk, 0)], undefined, [
            genCellKey(strFk, 1),
            genCellKey(strFk, 2),
            genCellKey(strFk, 3),
        ]);
        // Copied values with commas on a non-multi-value column don't need quoting (tab delimiter)
        expect(cellValues).toEqual(['S,1', 'S,1', 'S,1']);
    });

    // Issue 52412
    test('cells with multiple values are quoted', () => {
        let cellValues = generateColumnFillValues(editorModel, [genCellKey(mvFk, 0), genCellKey(mvFk, 1)], undefined, [
            genCellKey(mvFk, 2),
            genCellKey(mvFk, 3),
            genCellKey(mvFk, 4),
            genCellKey(mvFk, 5),
        ]);
        // When we copy multiple values only the ones needing quotes should be quoted
        expect(cellValues).toEqual(['"S,1","S,2"', 'S2,S3', '"S,1","S,2"', 'S2,S3']);

        cellValues = generateColumnFillValues(editorModel, [genCellKey(mvFk, 0)], undefined, [
            genCellKey(mvFk, 1),
            genCellKey(mvFk, 2),
            genCellKey(mvFk, 3),
            genCellKey(mvFk, 5),
        ]);
        // Copying single values should quote them as appropriate
        expect(cellValues).toEqual(['"S,1","S,2"', '"S,1","S,2"', '"S,1","S,2"', '"S,1","S,2"']);
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
        expect(splitPrefixedNumber('00.45')).toEqual([undefined, '00.45']);
        expect(splitPrefixedNumber('001')).toEqual([undefined, '001']);
        expect(splitPrefixedNumber('ABC001')).toEqual(['ABC', '001']);
        expect(splitPrefixedNumber('ABC00.45')).toEqual(['ABC', '00.45']);
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

describe('detectPadSize', () => {
    test('detects padding correctly', () => {
        expect(detectPadLength(undefined)).toEqual(undefined);
        expect(detectPadLength('')).toEqual(undefined);
        expect(detectPadLength('123')).toEqual(undefined);
        expect(detectPadLength('000.123')).toEqual(undefined);
        expect(detectPadLength('0000123')).toEqual(7);
        expect(detectPadLength('0001234')).toEqual(7);
    });
});

describe('parsePastedLookup', () => {
    const intLookupCol = new QueryColumn({
        jsonType: 'int',
        caption: 'LookCol',
        lookup: new QueryLookup({ isPublic: true }),
    });
    const stringLookupCol = new QueryColumn({
        jsonType: 'string',
        caption: 'LookCol',
        lookup: new QueryLookup({ isPublic: true }),
    });
    const requiredLookupCol = new QueryColumn({
        jsonType: 'string',
        caption: 'ReqLookCol',
        lookup: new QueryLookup({ isPublic: true }),
        required: true,
    });
    const multiValueLookup = new QueryColumn({
        jsonType: 'string',
        caption: 'MultiValueLookupCol',
        lookup: new QueryLookup({ isPublic: true, multiValued: 'junction' }),
        multiValue: true,
    });

    const intLookupValues = [
        { display: 'A', raw: 1 },
        { display: 'b', raw: 2 },
    ];
    const stringLookupValues = [
        { display: 'A', raw: 'a' },
        { display: 'b', raw: 'B' },
        { display: 'C', raw: 'C' },
        { display: 'value D', raw: 'd' },
    ];

    test('empty', () => {
        const emptyValues = [undefined, null, '', ' '];
        emptyValues.forEach(val => {
            expect(parsePastedLookup(intLookupCol, intLookupValues, val)).toStrictEqual({
                valueDescriptors: List([{ display: val, raw: val }]),
            });
        });
        emptyValues.forEach(val => {
            expect(parsePastedLookup(stringLookupCol, stringLookupValues, val)).toStrictEqual({
                valueDescriptors: List([{ display: val, raw: val }]),
            });
        });
        emptyValues.forEach(val => {
            expect(parsePastedLookup(multiValueLookup, stringLookupValues, val)).toStrictEqual({
                valueDescriptors: List([{ display: val, raw: val }]),
            });
        });
    });

    test('string value', () => {
        expect(parsePastedLookup(stringLookupCol, stringLookupValues, 'A')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'A', raw: 'a' }]),
        });
        expect(parsePastedLookup(stringLookupCol, stringLookupValues, 'a')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'A', raw: 'a' }]),
        });
        expect(parsePastedLookup(stringLookupCol, stringLookupValues, 'value D')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'value D', raw: 'd' }]),
        });
        expect(parsePastedLookup(stringLookupCol, stringLookupValues, 'b,C,value D')).toStrictEqual({
            message: {
                message:
                    'Could not find "b,C,value D". Please make sure values that contain commas are properly quoted.',
            },
            valueDescriptors: List([{ display: 'b,C,value D', raw: 'b,C,value D' }]),
        });

        expect(parsePastedLookup(stringLookupCol, stringLookupValues, 'abc')).toStrictEqual({
            message: { message: 'Could not find "abc"' },
            valueDescriptors: List([{ display: 'abc', raw: 'abc' }]),
        });
        expect(parsePastedLookup(stringLookupCol, stringLookupValues, 'abc, valueD')).toStrictEqual({
            message: {
                message:
                    'Could not find "abc, valueD". Please make sure values that contain commas are properly quoted.',
            },
            valueDescriptors: List([{ display: 'abc, valueD', raw: 'abc, valueD' }]),
        });
    });

    test('int value', () => {
        expect(parsePastedLookup(intLookupCol, intLookupValues, 'A')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'A', raw: 1 }]),
        });
        expect(parsePastedLookup(intLookupCol, intLookupValues, 'a')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'A', raw: 1 }]),
        });
        expect(parsePastedLookup(intLookupCol, intLookupValues, 'A,B,b')).toStrictEqual({
            message: {
                message: 'Could not find "A,B,b". Please make sure values that contain commas are properly quoted.',
            },
            valueDescriptors: List([{ display: 'A,B,b', raw: 'A,B,b' }]),
        });

        expect(parsePastedLookup(intLookupCol, intLookupValues, 'abc')).toStrictEqual({
            message: { message: 'Could not find "abc"' },
            valueDescriptors: List([{ display: 'abc', raw: 'abc' }]),
        });
        expect(parsePastedLookup(intLookupCol, intLookupValues, 'abc, valueD')).toStrictEqual({
            message: {
                message:
                    'Could not find "abc, valueD". Please make sure values that contain commas are properly quoted.',
            },
            valueDescriptors: List([{ display: 'abc, valueD', raw: 'abc, valueD' }]),
        });
    });

    test('required column', () => {
        expect(parsePastedLookup(requiredLookupCol, stringLookupValues, 'A')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'A', raw: 'a' }]),
        });
        [undefined, null, ''].forEach(val => {
            expect(parsePastedLookup(requiredLookupCol, stringLookupValues, val)).toStrictEqual({
                message: { message: 'ReqLookCol is required.' },
                valueDescriptors: List([{ display: val, raw: val }]),
            });
        });
    });

    test('multi-value column', () => {
        expect(parsePastedLookup(multiValueLookup, stringLookupValues, 'A')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'A', raw: 'a' }]),
        });
        expect(parsePastedLookup(multiValueLookup, stringLookupValues, 'a')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'A', raw: 'a' }]),
        });
        expect(parsePastedLookup(multiValueLookup, stringLookupValues, 'value D')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'value D', raw: 'd' }]),
        });
        expect(parsePastedLookup(multiValueLookup, stringLookupValues, 'b,C,value D')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([
                { display: 'b', raw: 'B' },
                { display: 'C', raw: 'C' },
                { display: 'value D', raw: 'd' },
            ]),
        });
        expect(parsePastedLookup(multiValueLookup, stringLookupValues, 'b,C,value D,404')).toStrictEqual({
            message: { message: 'Could not find "404"' },
            valueDescriptors: List([
                { display: 'b', raw: 'B' },
                { display: 'C', raw: 'C' },
                { display: 'value D', raw: 'd' },
                { display: '404', raw: '404' },
            ]),
        });
    });
});

describe('insertPastedData', () => {
    const pkFk = 'rowId';
    const fkOne = 'field_one';
    const fkTwo = 'field_two';
    const dateFk = 'date';
    const mvtc = 'mvtc';
    const queryInfo = QueryInfo.fromJsonForTests({
        pkCols: [pkFk],
        columns: {
            [pkFk]: new QueryColumn({
                caption: 'Row Id',
                fieldKey: pkFk,
                inputType: 'number',
            }),
            [fkOne]: new QueryColumn({
                caption: 'Field One',
                fieldKey: fkOne,
                inputType: 'string',
            }),
            [fkTwo]: new QueryColumn({
                caption: 'Field Two',
                fieldKey: fkTwo,
                inputType: 'string',
            }),
            [dateFk]: new QueryColumn({
                caption: 'Date Field',
                fieldKey: dateFk,
                inputType: 'string',
                jsonType: 'date',
            }),
            [mvtc]: new QueryColumn({
                caption: 'Multi Value TC',
                fieldKey: mvtc,
                jsonType: 'ARRAY',
                rangeURI: MULTI_CHOICE_TYPE.rangeURI,
                validValues: ['a', 'ab', 'cc', 'cD', 'A,B', 'de', 'A', 'B', 'C', 'A,B,C', '"A"', '"A",B', '"A,B,C"'],
            }),
        },
    });

    const baseEditorModel = new EditorModel({}).merge({
        cellMessages: Map<string, CellMessage>({
            '1-0': 'description 1 message',
        }),
        cellValues: Map<string, List<ValueDescriptor>>({
            [genCellKey(fkOne, 0)]: List<ValueDescriptor>([
                {
                    display: 'qwer',
                    raw: 'qwer',
                },
            ]),
            [genCellKey(fkOne, 1)]: List<ValueDescriptor>([
                {
                    display: 'asdf',
                    raw: 'asdf',
                },
            ]),
            [genCellKey(fkOne, 2)]: List<ValueDescriptor>([
                {
                    display: 'zxcv',
                    raw: 'zxcv',
                },
            ]),
            [genCellKey(fkOne, 3)]: List<ValueDescriptor>([
                {
                    display: 'qwer',
                    raw: 'qwer',
                },
            ]),
            [genCellKey(fkOne, 4)]: List<ValueDescriptor>([
                {
                    display: 'asdf',
                    raw: 'asdf',
                },
            ]),
            [genCellKey(fkOne, 5)]: List<ValueDescriptor>([
                {
                    display: 'zxcv',
                    raw: 'zxcv',
                },
            ]),
            [genCellKey(fkTwo, 0)]: List<ValueDescriptor>([
                {
                    display: 'yuio',
                    raw: 'yuio',
                },
            ]),
            [genCellKey(fkTwo, 1)]: List<ValueDescriptor>([
                {
                    display: 'hjkl',
                    raw: 'hjkl',
                },
            ]),
            [genCellKey(fkTwo, 2)]: List<ValueDescriptor>([
                {
                    display: 'nm',
                    raw: 'nm',
                },
            ]),
            [genCellKey(dateFk, 0)]: List<ValueDescriptor>([
                {
                    display: '2025-04-23',
                    raw: '2025-04-23',
                },
            ]),
            [genCellKey(dateFk, 1)]: List<ValueDescriptor>([
                {
                    display: '2025-04-23',
                    raw: '2025-04-23',
                },
            ]),
            [genCellKey(dateFk, 2)]: List<ValueDescriptor>([
                {
                    display: '2025-04-23',
                    raw: '2025-04-23',
                },
            ]),
            [genCellKey(mvtc, 0)]: List<ValueDescriptor>([
                {
                    raw: 'a',
                    display: 'a',
                },
                {
                    raw: 'cD',
                    display: 'cD',
                },
            ]),
        }),
        orderedColumns: List([fkOne, fkTwo, dateFk, mvtc]),
        columnMap: [fkOne, fkTwo, dateFk, mvtc].reduce((result, key) => {
            return result.set(key, queryInfo.getColumn(key));
        }, Map<string, QueryColumn>()),
        queryInfo,
        rowCount: 10,
    }) as EditorModel;

    const emWithPartialColumnSelected = baseEditorModel.applyChanges({
        selectionCells: [genCellKey(fkOne, 0), genCellKey(fkOne, 1), genCellKey(fkOne, 2)],
        selectedColIdx: 0,
        selectedRowIdx: 2,
    });

    test('paste starts at first selected cell', async () => {
        // Issue 51359
        let changes = await validateAndInsertPastedData(
            emWithPartialColumnSelected,
            'one\ntwo\nthree',
            undefined,
            true,
            true,
            undefined,
            true
        );
        let cellValues = changes.cellValues;
        expect(cellValues.get(genCellKey(fkOne, 0))).toEqual(List([{ display: 'one', raw: 'one' }]));
        expect(cellValues.get(genCellKey(fkOne, 1))).toEqual(List([{ display: 'two', raw: 'two' }]));
        expect(cellValues.get(genCellKey(fkOne, 2))).toEqual(List([{ display: 'three', raw: 'three' }]));
        expect(changes.selectionCells).toEqual([genCellKey(fkOne, 0), genCellKey(fkOne, 1), genCellKey(fkOne, 2)]);

        cellValues = (
            await validateAndInsertPastedData(
                emWithPartialColumnSelected,
                'one',
                undefined,
                true,
                true,
                undefined,
                true
            )
        ).cellValues;
        expect(cellValues.get(genCellKey(fkOne, 0))).toEqual(List([{ display: 'one', raw: 'one' }]));
        expect(cellValues.get(genCellKey(fkOne, 1))).toEqual(List([{ display: 'one', raw: 'one' }]));
        expect(cellValues.get(genCellKey(fkOne, 2))).toEqual(List([{ display: 'one', raw: 'one' }]));

        const emWithCellSelected = baseEditorModel.applyChanges({
            selectedColIdx: 0,
            selectedRowIdx: 1,
        });
        cellValues = (
            await validateAndInsertPastedData(emWithCellSelected, 'one', undefined, true, true, undefined, true)
        ).cellValues;
        expect(cellValues.get(genCellKey(fkOne, 0))).toEqual(List([{ display: 'qwer', raw: 'qwer' }]));
        expect(cellValues.get(genCellKey(fkOne, 1))).toEqual(List([{ display: 'one', raw: 'one' }]));
        expect(cellValues.get(genCellKey(fkOne, 2))).toEqual(List([{ display: 'zxcv', raw: 'zxcv' }]));

        // Pasting more data than we have cells selected should paste beyond the cells
        changes = await validateAndInsertPastedData(
            emWithCellSelected,
            'one\ntwo',
            undefined,
            true,
            true,
            undefined,
            true
        );
        cellValues = changes.cellValues;
        expect(cellValues.get(genCellKey(fkOne, 0))).toEqual(List([{ display: 'qwer', raw: 'qwer' }]));
        expect(cellValues.get(genCellKey(fkOne, 1))).toEqual(List([{ display: 'one', raw: 'one' }]));
        expect(cellValues.get(genCellKey(fkOne, 2))).toEqual(List([{ display: 'two', raw: 'two' }]));
        expect(changes.selectionCells).toEqual([genCellKey(fkOne, 1), genCellKey(fkOne, 2)]);
    });

    test('pasting a small payload to a large selected area expands the paste payload', async () => {
        const emWithTwoColumnsSelected = baseEditorModel.applyChanges({
            selectionCells: [
                genCellKey(fkOne, 0),
                genCellKey(fkTwo, 0),
                genCellKey(fkOne, 1),
                genCellKey(fkTwo, 1),
                genCellKey(fkOne, 2),
                genCellKey(fkTwo, 2),
            ],
            selectedColIdx: 0,
            selectedRowIdx: 2,
        });
        // Issue 52737
        const changes = await validateAndInsertPastedData(
            emWithTwoColumnsSelected,
            'one\ntwo\nthree',
            undefined,
            true,
            true,
            undefined,
            true
        );
        const cellValues = changes.cellValues;
        // The data ['one', 'two', 'three'] should get duplicated across both columns because the selected area is
        // larger than the pasted payload.
        expect(cellValues.get(genCellKey(fkOne, 0))).toEqual(List([{ display: 'one', raw: 'one' }]));
        expect(cellValues.get(genCellKey(fkOne, 1))).toEqual(List([{ display: 'two', raw: 'two' }]));
        expect(cellValues.get(genCellKey(fkOne, 2))).toEqual(List([{ display: 'three', raw: 'three' }]));
        expect(cellValues.get(genCellKey(fkTwo, 0))).toEqual(List([{ display: 'one', raw: 'one' }]));
        expect(cellValues.get(genCellKey(fkTwo, 1))).toEqual(List([{ display: 'two', raw: 'two' }]));
        expect(cellValues.get(genCellKey(fkTwo, 2))).toEqual(List([{ display: 'three', raw: 'three' }]));
        expect(changes.selectionCells).toEqual([
            genCellKey(fkOne, 0),
            genCellKey(fkTwo, 0),
            genCellKey(fkOne, 1),
            genCellKey(fkTwo, 1),
            genCellKey(fkOne, 2),
            genCellKey(fkTwo, 2),
        ]);
    });

    test('pasting via dragFill does not expand the paste payload', async () => {
        const emWithFirstColumnSelected = baseEditorModel.applyChanges({
            selectionCells: [
                genCellKey(fkOne, 0),
                genCellKey(fkOne, 1),
                genCellKey(fkOne, 2),
                genCellKey(fkOne, 3),
                genCellKey(fkOne, 4),
                genCellKey(fkOne, 5),
            ],
            selectedColIdx: 0,
            selectedRowIdx: 2,
        });
        // Issue 52737
        const changes = await validateAndInsertPastedData(
            emWithFirstColumnSelected,
            'one\ntwo\nthree',
            undefined,
            true,
            true,
            undefined,
            false,
            [[genCellKey(fkOne, 3), genCellKey(fkOne, 4), genCellKey(fkOne, 5)]]
        );
        const cellValues = changes.cellValues;
        expect(cellValues.get(genCellKey(fkOne, 0))).toEqual(List([{ display: 'qwer', raw: 'qwer' }]));
        expect(cellValues.get(genCellKey(fkOne, 1))).toEqual(List([{ display: 'asdf', raw: 'asdf' }]));
        expect(cellValues.get(genCellKey(fkOne, 2))).toEqual(List([{ display: 'zxcv', raw: 'zxcv' }]));
        expect(cellValues.get(genCellKey(fkOne, 3))).toEqual(List([{ display: 'one', raw: 'one' }]));
        expect(cellValues.get(genCellKey(fkOne, 4))).toEqual(List([{ display: 'two', raw: 'two' }]));
        expect(cellValues.get(genCellKey(fkOne, 5))).toEqual(List([{ display: 'three', raw: 'three' }]));
        expect(cellValues.get(genCellKey(fkTwo, 0))).toEqual(List([{ display: 'yuio', raw: 'yuio' }]));
        expect(cellValues.get(genCellKey(fkTwo, 1))).toEqual(List([{ display: 'hjkl', raw: 'hjkl' }]));
        expect(cellValues.get(genCellKey(fkTwo, 2))).toEqual(List([{ display: 'nm', raw: 'nm' }]));
        // passing selectCells as false returns an emtpy array
        expect(changes.selectionCells).toEqual([]);
    });

    test('pasting dates does not change the display value', async () => {
        // Issue 52326
        const emWithDateColSelected = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(dateFk, 0), genCellKey(dateFk, 1), genCellKey(dateFk, 2)],
            selectedColIdx: 2,
            selectedRowIdx: 0,
        });
        const changes = await validateAndInsertPastedData(
            emWithDateColSelected,
            '2025-04-24\n2025-04-24\n2025-04-24',
            undefined,
            true,
            true,
            undefined,
            true
        );
        // Display values should be what was pasted, raw values should be parsed and converted to JSON format expected
        // by LKS, which includes microseconds.
        const cellValues = changes.cellValues;
        expect(cellValues.get(genCellKey(dateFk, 0))).toEqual(
            List([{ display: '2025-04-24', raw: '2025-04-24 00:00:00.000' }])
        );
        expect(cellValues.get(genCellKey(dateFk, 1))).toEqual(
            List([{ display: '2025-04-24', raw: '2025-04-24 00:00:00.000' }])
        );
        expect(cellValues.get(genCellKey(dateFk, 2))).toEqual(
            List([{ display: '2025-04-24', raw: '2025-04-24 00:00:00.000' }])
        );
    });

    test('pasting multi-line value', async () => {
        const em = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(fkOne, 0)],
            selectedColIdx: 0,
            selectedRowIdx: 2,
        });
        const changes = await validateAndInsertPastedData(em, '"line1\nline2"', undefined, true, true, undefined, true);
        const cellValues = changes.cellValues;
        expect(cellValues.get(genCellKey(fkOne, 2))).toEqual(List([{ display: 'line1\nline2', raw: 'line1\nline2' }]));

        const cellMessages = changes.cellMessages;
        expect(cellMessages.get(genCellKey(fkOne, 2))).toBeUndefined();
    });

    test('pasting multi values', async () => {
        const em = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(mvtc, 0)],
            selectedColIdx: 3,
            selectedRowIdx: 0,
        });
        const changes = await validateAndInsertPastedData(
            em,
            '"A,B",cD\nde,cc\nab,bad',
            undefined,
            true,
            true,
            undefined,
            true
        );
        const cellValues = changes.cellValues;
        expect(cellValues.get(genCellKey(mvtc, 0))).toEqual(
            List([
                { display: 'A,B', raw: 'A,B' },
                { display: 'cD', raw: 'cD' },
            ])
        );
        expect(cellValues.get(genCellKey(mvtc, 1))).toEqual(
            List([
                { display: 'cc', raw: 'cc' },
                { display: 'de', raw: 'de' },
            ])
        );
        expect(cellValues.get(genCellKey(mvtc, 2))).toEqual(
            List([
                { display: 'ab', raw: 'ab' },
                { display: 'bad', raw: 'bad' },
            ])
        );
        const cellMessages = changes.cellMessages;
        expect(cellMessages.get(genCellKey(mvtc, 0))).toBeUndefined();
        expect(cellMessages.get(genCellKey(mvtc, 1))).toBeUndefined();
        expect(cellMessages.get(genCellKey(mvtc, 2))).toEqual({ message: 'Could not find "bad"' });
    });

    test('pasting string values with special characters', async () => {
        const em = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(fkOne, 0), genCellKey(fkOne, 1), genCellKey(fkOne, 2)],
            selectedColIdx: 0,
            selectedRowIdx: 2,
        });
        const changes = await validateAndInsertPastedData(
            em,
            'hello world\n"hello, world"\n"say ""hello"""',
            undefined,
            true,
            true,
            undefined,
            true
        );
        const cellValues = changes.cellValues;
        // Space is preserved as-is
        expect(cellValues.get(genCellKey(fkOne, 0))).toEqual(List([{ display: 'hello world', raw: 'hello world' }]));
        // Quoted comma: CSV quoting is stripped, comma preserved
        expect(cellValues.get(genCellKey(fkOne, 1))).toEqual(
            List([{ display: 'hello, world', raw: 'hello, world' }])
        );
        // Escaped double quotes: CSV escaping is processed
        expect(cellValues.get(genCellKey(fkOne, 2))).toEqual(
            List([{ display: 'say "hello"', raw: 'say "hello"' }])
        );
    });

    test('pasting multi-line value into a single cell', async () => {
        const value = '"ab\ncd"';
        const em = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(fkOne, 0)],
            selectedColIdx: 0,
            selectedRowIdx: 0,
        });
        const changes = await validateAndInsertPastedData(em, value, undefined, true, true, undefined, true);
        const cellValues = changes.cellValues;
        expect(cellValues.get(genCellKey(fkOne, 0))).toEqual(List([{ display: 'ab\ncd', raw: 'ab\ncd' }]));
        expect(changes.cellMessages.get(genCellKey(fkOne, 0))).toBeUndefined();
    });

    test('pasting multi-line values into multiple cells', async () => {
        const value = '"ab\n' +
            'cd"\n' +
            '"another\n' +
            'line"';
        const em = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(fkOne, 0), genCellKey(fkOne, 1)],
            selectedColIdx: 0,
            selectedRowIdx: 0,
        });
        const changes = await validateAndInsertPastedData(em, value, undefined, true, true, undefined, true);
        const cellValues = changes.cellValues;
        expect(cellValues.get(genCellKey(fkOne, 0))).toEqual(List([{ display: 'ab\ncd', raw: 'ab\ncd' }]));
        expect(cellValues.get(genCellKey(fkOne, 1))).toEqual(
            List([{ display: 'another\nline', raw: 'another\nline' }])
        );
    });

    test('pasting exactly A,B into mvtc matches single valid value', async () => {
        const em = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(mvtc, 0)],
            selectedColIdx: 3,
            selectedRowIdx: 0,
        });
        const changes = await validateAndInsertPastedData(em, '"A,B"', undefined, true, true, undefined, true);
        expect(changes.cellValues.get(genCellKey(mvtc, 0))).toEqual(List([{ display: 'A,B', raw: 'A,B' }]));
        expect(changes.cellMessages.get(genCellKey(mvtc, 0))).toBeUndefined();
    });

    test('pasting exactly A,B,C into mvtc matches single valid value', async () => {
        const em = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(mvtc, 0)],
            selectedColIdx: 3,
            selectedRowIdx: 0,
        });
        const changes = await validateAndInsertPastedData(em, '"A,B,C"', undefined, true, true, undefined, true);
        expect(changes.cellValues.get(genCellKey(mvtc, 0))).toEqual(List([{ display: 'A,B,C', raw: 'A,B,C' }]));
        expect(changes.cellMessages.get(genCellKey(mvtc, 0))).toBeUndefined();
    });

    test('pasting escaped "A,B,C" into mvtc matches single valid value', async () => {
        const em = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(mvtc, 0)],
            selectedColIdx: 3,
            selectedRowIdx: 0,
        });
        const changes = await validateAndInsertPastedData(em, '"""A,B,C"""', undefined, true, true, undefined, true);
        expect(changes.cellValues.get(genCellKey(mvtc, 0))).toEqual(List([{ display: '"A,B,C"', raw: '"A,B,C"' }]));
        expect(changes.cellMessages.get(genCellKey(mvtc, 0))).toBeUndefined();
    });

    test('pasting A, B with space into mvtc parses as two values', async () => {
        const em = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(mvtc, 0)],
            selectedColIdx: 3,
            selectedRowIdx: 0,
        });
        const changes = await validateAndInsertPastedData(em, 'A, B', undefined, true, true, undefined, true);
        // 'A, B' does not match any validValue, so parsed as CSV → ' B' and 'A' (sorted with leading space)
        expect(changes.cellValues.get(genCellKey(mvtc, 0))).toEqual(
            List([
                { display: 'A', raw: 'A' },
                { display: 'B', raw: 'B' },
            ])
        );
        expect(changes.cellMessages.get(genCellKey(mvtc, 0))).toBeUndefined();
    });

    test('pasting quoted "A,B" into mvtc treats as single value', async () => {
        const em = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(mvtc, 0)],
            selectedColIdx: 3,
            selectedRowIdx: 0,
        });
        const changes = await validateAndInsertPastedData(em, '"A,B"', undefined, true, true, undefined, true);
        // Quoted '"A,B"' is CSV-parsed to 'A,B' which is a valid value
        expect(changes.cellValues.get(genCellKey(mvtc, 0))).toEqual(List([{ display: 'A,B', raw: 'A,B' }]));
        expect(changes.cellMessages.get(genCellKey(mvtc, 0))).toBeUndefined();
    });

    test('pasting quoted "A, B" into mvtc, invalid', async () => {
        const em = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(mvtc, 0)],
            selectedColIdx: 3,
            selectedRowIdx: 0,
        });
        const changes = await validateAndInsertPastedData(em, '"A, B"', undefined, true, true, undefined, true);
        // Quoted '"A,B"' is CSV-parsed to 'A,B' which is a valid value
        expect(changes.cellValues.get(genCellKey(mvtc, 0))).toEqual(List([{ display: 'A, B', raw: 'A, B' }]));
        expect(changes.cellMessages.get(genCellKey(mvtc, 0))).toEqual({
            message: 'Could not find "A, B". Please make sure values that contain commas are properly quoted.',
        });
    });

    test('pasting mvtc values combined with other valid values', async () => {
        const em = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(mvtc, 0), genCellKey(mvtc, 1), genCellKey(mvtc, 2)],
            selectedColIdx: 3,
            selectedRowIdx: 2,
        });
        const changes = await validateAndInsertPastedData(
            em,
            '"A,B"\n"A,B",cc\nA,B,cc',
            undefined,
            true,
            true,
            undefined,
            true
        );
        const cellValues = changes.cellValues;
        // Row 0: 'A,B' exactly matches single validValue
        expect(cellValues.get(genCellKey(mvtc, 0))).toEqual(List([{ display: 'A,B', raw: 'A,B' }]));
        expect(changes.cellMessages.get(genCellKey(mvtc, 0))).toBeUndefined();
        // Row 1: '"A,B",cc' → CSV parsed to ['A,B', 'cc'], both valid
        expect(cellValues.get(genCellKey(mvtc, 1))).toEqual(
            List([
                { display: 'A,B', raw: 'A,B' },
                { display: 'cc', raw: 'cc' },
            ])
        );
        expect(changes.cellMessages.get(genCellKey(mvtc, 1))).toBeUndefined();
        // Row 2: 'A,B,cc' without quotes → CSV parsed to ['A', 'B', 'cc'], all valid
        expect(cellValues.get(genCellKey(mvtc, 2))).toEqual(
            List([
                { display: 'A', raw: 'A' },
                { display: 'B', raw: 'B' },
                { display: 'cc', raw: 'cc' },
            ])
        );
        expect(changes.cellMessages.get(genCellKey(mvtc, 2))).toBeUndefined();
    });

    test('pasting mvtc values combined with invalid values', async () => {
        const em = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(mvtc, 0), genCellKey(mvtc, 1)],
            selectedColIdx: 3,
            selectedRowIdx: 1,
        });
        const changes = await validateAndInsertPastedData(
            em,
            'A, B, bad\n"A,B",bad',
            undefined,
            true,
            true,
            undefined,
            true
        );
        const cellValues = changes.cellValues;
        const cellMessages = changes.cellMessages;
        // Row 0: 'A,B,bad' → CSV parsed to ['A', 'B', 'bad'], 'bad' invalid
        expect(cellValues.get(genCellKey(mvtc, 0))).toEqual(
            List([
                { display: 'A', raw: 'A' },
                { display: 'B', raw: 'B' },
                { display: 'bad', raw: 'bad' },
            ])
        );
        expect(cellMessages.get(genCellKey(mvtc, 0))).toEqual({ message: 'Could not find "bad"' });
        // Row 1: '"A,B",bad' → CSV parsed to ['A,B', 'bad'], 'bad' invalid
        expect(cellValues.get(genCellKey(mvtc, 1))).toEqual(
            List([
                { display: 'A,B', raw: 'A,B' },
                { display: 'bad', raw: 'bad' },
            ])
        );
        expect(cellMessages.get(genCellKey(mvtc, 1))).toEqual({ message: 'Could not find "bad"' });
    });

    test.each([
        { values: ['A', 'B', 'C'], desc: 'simple values' },
        { values: ['"A",B'], desc: 'single value with quotes and comma' },
        { values: ['"A,B,C"'], desc: 'single value with quotes wrapping commas' },
        { values: ['"A",B', 'B'], desc: 'tricky + simple' },
        { values: ['A', '"A"', 'B'], desc: 'quotes among simple' },
        { values: ['A', 'A,B,C', '"A,B,C"'], desc: 'plain + comma + quote-containing' },
        { values: ['"A"', '"A",B', '"A,B,C"'], desc: 'all contain quotes' },
    ])('pasting multi values round-trip: $desc', async ({ values }) => {
        const exported = joinMultiValueForExport(values);
        const em = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(mvtc, 0)],
            selectedColIdx: 3,
            selectedRowIdx: 0,
        });
        const changes = await validateAndInsertPastedData(em, exported, undefined, true, true, undefined, true);
        const cellValues = changes.cellValues.get(genCellKey(mvtc, 0));
        const sortedExpected = [...values].sort();
        const actualValues = cellValues.toArray().map(v => v.raw);
        expect(actualValues).toStrictEqual(sortedExpected);
        expect(changes.cellMessages.get(genCellKey(mvtc, 0))).toBeUndefined();
    });
});

describe('loadEditorModelData', () => {
    const ancestorColumn = new QueryColumn({
        conceptURI: 'http://www.labkey.org/types#ancestorLookup',
        displayField: 'Ancestors/RegistryAndSources/cells/Name',
        fieldKey: 'Ancestors/RegistryAndSources/cells',
        fieldKeyArray: ['Ancestors', 'RegistryAndSources', 'cells'],
        lookup: {
            displayColumn: 'Name',
            displayColumnFieldKey: 'Name',
            isPublic: true,
            keyColumn: 'RowId',
            public: true,
            queryName: 'Cells',
            schema: 'exp.data',
            schemaName: 'exp.data',
            table: 'Cells',
        },
        name: 'Ancestors/RegistryAndSources/cells',
    });

    // Verify assumption about structure of ancestor column
    expect(ancestorColumn.isAncestorInput()).toBe(true);

    const columns = [
        new QueryColumn({
            fieldKey: 'Name',
            fieldKeyArray: ['Name'],
            fieldKeyPath: 'Name',
            derivationDataScope: null,
            name: 'Name',
        }),
        new QueryColumn({
            fieldKey: 'TimeField$P$S$C$D$A',
            fieldKeyArray: ['TimeField./,$&'],
            fieldKeyPath: 'TimeField$P$S$C$D$A',
            derivationDataScope: 'ParentOnly',
            name: 'TimeField./,$&',
            rangeURI: TIME_RANGE_URI,
            format: 'hh:mm a',
        }),
        new QueryColumn({
            fieldKey: 'DtField$P$S$C$D$A',
            fieldKeyArray: ['DtField./,$&'],
            fieldKeyPath: 'DtField$P$S$C$D$A',
            derivationDataScope: 'ParentOnly',
            name: 'DtField./,$&',
            rangeURI: DATETIME_RANGE_URI,
            format: 'yyyy-MMM-dd HH:mm',
        }),
        new QueryColumn({
            fieldKey: 'IntField$P$S$C$D$A',
            fieldKeyArray: ['IntField./,$&'],
            fieldKeyPath: 'IntField$P$S$C$D$A',
            derivationDataScope: 'ParentOnly',
            name: 'IntField./,$&',
            jsonType: 'int',
        }),
        new QueryColumn({
            fieldKey: 'DecField$P$S$C$D$A',
            fieldKeyArray: ['DecField./,$&'],
            fieldKeyPath: 'DecField$P$S$C$D$A',
            derivationDataScope: 'ParentOnly',
            name: 'DecField./,$&',
            jsonType: 'float',
        }),
        new QueryColumn({
            fieldKey: 'lkField$P$S$C$D$A',
            fieldKeyArray: ['lkField./,$&'],
            fieldKeyPath: 'lkField$P$S$C$D$A',
            name: 'lkField./,$&',
            derivationDataScope: 'ParentOnly',
            lookup: {
                displayColumn: 'Name',
                isPublic: true,
                keyColumn: 'RowId',
                public: true,
                queryName: 'AssayList',
                schema: 'assay',
                schemaName: 'assay',
            },
        }),
        new QueryColumn({
            fieldKey: 'sampleField$P$S$C$D$A',
            fieldKeyArray: ['sampleField./,$&'],
            fieldKeyPath: 'sampleField$P$S$C$D$A',
            name: 'sampleField./,$&',
            derivationDataScope: 'ParentOnly',
            lookup: {
                displayColumn: 'Name',
                isPublic: true,
                keyColumn: 'RowId',
                public: true,
                queryName: 'Materials',
                schema: 'exp',
                schemaName: 'exp',
            },
        }),
        new QueryColumn({
            fieldKey: 'aliqField$D$C$P$S',
            fieldKeyArray: ['aliqField$,./'],
            fieldKeyPath: 'aliqField$D$C$P$S',
            name: 'aliqField$,./',
            derivationDataScope: 'ChildOnly',
        }),
        new QueryColumn({
            fieldKey: 'aliqAndParent$D$C$P$S',
            fieldKeyArray: ['aliqAndParent$,./'],
            fieldKeyPath: 'aliqAndParent$D$C$P$S',
            name: 'aliqAndParent$,./',
            derivationDataScope: 'All',
        }),
        ancestorColumn,
    ];

    const orderedRows = ['2811466', '2805931'];

    const rows = {
        '2805931': {
            'Ancestors/RegistryAndSources/cells': [{ displayValue: 'Cell-1', value: 32433 }],
            'TimeField./,$&': '16:10',
            'IntField./,$&': 333,
            LSID: 'urn:lsid:labkey.com:Sample.Folder-519.24:26',
            'tcField./,$&': '2',
            'DtField./,$&': [{ displayValue: '07Feb2025', value: '2025-02-07 00:00:00.000' }],
            'txtField./,$&': '777',
            MaterialExpDate: [{ displayValue: '07Feb25 00:00:00.000', value: '2025-02-07 00:00:00.000' }],
            SampleState: [{ displayValue: 'Available', value: 70 }],
            'ontField./,$&': '666',
            Name: 'S-26',
            'MultiField./,$&': '444',
            Folder: [{ displayValue: 'Biologics Example', value: '01b94403-4179-1039-a799-ea54f212702c' }],
            'idField./,$&': '000631254',
            Units: 'mL',
            Alias: [],
            'DtTimeField./,$&': [{ displayValue: '2025-02-07 16:30', value: '2025-02-07 16:30:00.000' }],
            'lkField./,$&': [{ displayValue: 'Assay Required File', value: 37721 }],
            RowId: 2805931,
            'DecField./,$&': { displayValue: 22.3, value: 22.26 },
            'aliqAndParent$,./': '888',
            StoredAmount: 99,
            Description: '111',
            'sampleField./,$&': [{ value: 117334 }], // displayValue: '10-1-1'
            'BoolField./,$&': false,
            'userField./,$&': [{ displayValue: 'assaytypedesigner', value: 14688 }],
            'flagField./,$&': '555',
        },
        '2811466': {
            'Ancestors/RegistryAndSources/cells': [{ displayValue: '5 values', value: -5 }],
            'TimeField./,$&': '16:20:00.123',
            'IntField./,$&': 3,
            LSID: 'urn:lsid:labkey.com:Sample.Folder-519.24:27',
            'tcField./,$&': '3',
            'DtField./,$&': [{ displayValue: '04Feb2025', value: '2025-02-04 00:00:11.234' }],
            'txtField./,$&': '7',
            MaterialExpDate: [{ displayValue: '10Feb25 00:00:00.000', value: '2025-02-10 00:00:00.000' }],
            SampleState: [{ displayValue: 'Available', value: 70 }],
            'ontField./,$&': '666',
            Name: 'S-20-3',
            'MultiField./,$&': '444',
            Folder: [{ displayValue: 'Biologics Example', value: '01b94403-4179-1039-a799-ea54f212702c' }],
            'idField./,$&': '000631255',
            'fileField./,$&': [
                {
                    displayValue: 'sampletype/before.png',
                    value: '/Users/corynathe/LabKey/trunk/build/deploy/files/Biologics Example/@files/sampletype/before.png',
                },
            ],
            Units: 'mL',
            Alias: [],
            'aliqField$,./': '123',
            'DtTimeField./,$&': [{ displayValue: '2025-01-29 24:00', value: '2025-01-29 00:00:00.000' }],
            'lkField./,$&': [{ value: 42876 }], // displayValue: 'DAS Testing'
            RowId: 2811466,
            'DecField./,$&': 22,
            'aliqAndParent$,./': '456',
            StoredAmount: 3,
            Description: 'desc',
            'sampleField./,$&': 2675720,
            'BoolField./,$&': true,
            'userField./,$&': [{ displayValue: 'editorwithoutdelete', value: 5027 }],
            'flagField./,$&': '555',
        },
    };

    function getTestApi(selectRows = jest.fn()): ComponentsAPIWrapper {
        const testApi = getTestAPIWrapper(jest.fn);
        return { ...testApi, query: { ...testApi.query, selectRows } };
    }

    test('getLookupValueDescriptors', async () => {
        const selectRows = jest.fn().mockImplementation(({ schemaQuery }) => {
            const rows_: Row[] = [];

            if (schemaQuery.queryName === 'AssayList') {
                // Resolve lookup value for lkField./,$&
                rows_.push({ Name: { value: 'DAS Testing' }, RowId: { value: 42876 } });
            } else if (schemaQuery.queryName === 'Materials') {
                // Resolve lookup value for sampleField./,$&
                rows_.push({ Name: { value: '10-1-1' }, RowId: { value: 117334 } });
            }

            return { rows: rows_ };
        });

        const api = getTestApi(selectRows);
        const result = await loadEditorModelData(orderedRows, rows, columns, false, api);

        expect(result.cellValues.toJS()).toStrictEqual({
            'name&&0': [{ display: 'S-20-3', raw: 'S-20-3' }],
            'name&&1': [{ display: 'S-26', raw: 'S-26' }],
            'aliqandparent$d$c$p$s&&0': [{ display: '456', raw: '456' }],
            'aliqandparent$d$c$p$s&&1': [{ display: '888', raw: '888' }],
            'ancestors/registryandsources/cells&&0': [{ display: '5 values', raw: -5 }],
            'ancestors/registryandsources/cells&&1': [{ display: 'Cell-1', raw: 32433 }],
            'samplefield$p$s$c$d$a&&0': [{ display: '<2675720>', raw: 2675720 }],
            'samplefield$p$s$c$d$a&&1': [{ display: '10-1-1', raw: 117334 }],
            'intfield$p$s$c$d$a&&0': [{ display: 3, raw: 3 }],
            'dtfield$p$s$c$d$a&&0': [{ display: '2025-Feb-04 00:00:11.234', raw: '2025-02-04 00:00:11.234' }],
            'decfield$p$s$c$d$a&&0': [{ display: 22, raw: 22 }],
            'decfield$p$s$c$d$a&&1': [{ display: 22.26, raw: 22.26 }],
            'intfield$p$s$c$d$a&&1': [{ display: 333, raw: 333 }],
            'aliqfield$d$c$p$s&&0': [{ display: '123', raw: '123' }],
            'dtfield$p$s$c$d$a&&1': [{ display: '2025-Feb-07 00:00', raw: '2025-02-07 00:00:00.000' }],
            'aliqfield$d$c$p$s&&1': [{ display: undefined, raw: undefined }],
            'lkfield$p$s$c$d$a&&0': [{ display: 'DAS Testing', raw: 42876 }],
            'lkfield$p$s$c$d$a&&1': [{ display: 'Assay Required File', raw: 37721 }],
            'timefield$p$s$c$d$a&&0': [{ display: '04:20:00.123 PM', raw: '16:20:00.123' }],
            'timefield$p$s$c$d$a&&1': [{ display: '04:10 PM', raw: '16:10' }],
        });

        // Issue 52311: Expect lookup validation warnings
        expect(result.cellMessages.toJS()).toStrictEqual({
            'lkfield$p$s$c$d$a&&1': {
                isWarning: true,
                message: 'Assay Required File is no longer a valid value. Data may have been moved or deleted.',
            },
            'samplefield$p$s$c$d$a&&0': {
                isWarning: true,
                message: 'Could not find 2675720. Data may have been moved or deleted.',
            },
        });

        // Expect both lookup columns to have been validated
        expect(api.query.selectRows).toHaveBeenCalledTimes(2);
    });

    test('getLookupValueDescriptors failed lookup request', async () => {
        const selectRows = jest.fn().mockRejectedValue('Who goes there?!');

        const api = getTestApi(selectRows);
        const result = await loadEditorModelData(orderedRows, rows, columns, false, api);

        // Issue 52311: Expect lookup validation warnings
        expect(result.cellMessages.toJS()).toStrictEqual({
            'lkfield$p$s$c$d$a&&0': {
                isWarning: true,
                message: 'Failed to resolves values for column lkField./,$&. Who goes there?!',
            },
            'lkfield$p$s$c$d$a&&1': {
                isWarning: true,
                message: 'Failed to resolves values for column lkField./,$&. Who goes there?!',
            },
            'samplefield$p$s$c$d$a&&0': {
                isWarning: true,
                message: 'Failed to resolves values for column sampleField./,$&. Who goes there?!',
            },
            'samplefield$p$s$c$d$a&&1': {
                isWarning: true,
                message: 'Failed to resolves values for column sampleField./,$&. Who goes there?!',
            },
        });

        // Expect both lookup columns to have been validated
        expect(api.query.selectRows).toHaveBeenCalledTimes(2);
    });
});

describe('updateColumnLookup', () => {
    test('update from sample type lookup to exp.Materials lookup', async () => {
        const queryInfo = QueryInfo.fromJsonForTests(sampleSetQueryInfoJSON);
        const loader = new MockEditableGridLoader(queryInfo);
        const editorModel = await initEditorModel(loader);

        expect(editorModel.columnMap.get('lookup')['lookup'].schemaQuery).toEqual(
            new SchemaQuery('samples', 'name expression set')
        );
        const updates = updateColumnLookup(editorModel, 'lookup', new SchemaQuery('exp', 'Materials'));
        expect(updates.columnMap.size).toBe(10);
        expect(updates.columnMap.get('lookup')['lookup'].schemaQuery).toEqual(new SchemaQuery('exp', 'Materials'));
        expect(updates.queryInfo.columns.size).toBe(28);
        expect(updates.queryInfo.columns.get('lookup')['lookup'].schemaQuery).toEqual(
            new SchemaQuery('exp', 'Materials')
        );
    });
});

describe('resolveValueDescriptors', () => {
    test('default raw and displayValue', () => {
        const col = new QueryColumn({ fieldKey: 'col1', name: 'col1' });
        expect(resolveValueDescriptors(col, {}, {}, 'cellKey', 1)).toStrictEqual([{ display: 1, raw: 1 }]);
        expect(resolveValueDescriptors(col, {}, {}, 'cellKey', 'value')).toStrictEqual([
            { display: 'value', raw: 'value' },
        ]);
        expect(resolveValueDescriptors(col, {}, {}, 'cellKey', true)).toStrictEqual([{ display: true, raw: true }]);
        expect(resolveValueDescriptors(col, {}, {}, 'cellKey', false)).toStrictEqual([{ display: false, raw: false }]);
        expect(resolveValueDescriptors(col, {}, {}, 'cellKey', null)).toStrictEqual([
            { display: undefined, raw: undefined },
        ]);
        expect(resolveValueDescriptors(col, {}, {}, 'cellKey', undefined)).toStrictEqual([
            { display: undefined, raw: undefined },
        ]);

        expect(resolveValueDescriptors(col, {}, {}, 'cellKey', { value: 1 })).toStrictEqual([{ display: 1, raw: 1 }]);
        expect(resolveValueDescriptors(col, {}, {}, 'cellKey', { value: 1, displayValue: '1.00' })).toStrictEqual([
            { display: '1.00', raw: 1 },
        ]);
    });

    test('isDecimalJsonType, non lookup', () => {
        const intCol = new QueryColumn({ fieldKey: 'col1', name: 'col1', jsonType: 'int' });
        const floatCol = new QueryColumn({ fieldKey: 'col1', name: 'col1', jsonType: 'float' });
        const intLookupCol = new QueryColumn({
            fieldKey: 'col1',
            name: 'col1',
            jsonType: 'int',
            lookup: { keyColumn: 'id', displayColumn: 'name' },
        });
        const floatLookupCol = new QueryColumn({
            fieldKey: 'col1',
            name: 'col1',
            jsonType: 'float',
            lookup: { keyColumn: 'id', displayColumn: 'name' },
        });
        expect(resolveValueDescriptors(intCol, {}, {}, 'cellKey', { value: 10, displayValue: '010' })).toStrictEqual([
            { display: '010', raw: 10 },
        ]);
        expect(
            resolveValueDescriptors(intCol, {}, {}, 'cellKey', { value: 1, displayValue: 'Sample 1' })
        ).toStrictEqual([{ display: 'Sample 1', raw: 1 }]);
        expect(
            resolveValueDescriptors(intLookupCol, {}, {}, 'cellKey', { value: 1, displayValue: 'Sample 1' })
        ).toStrictEqual([{ display: 'Sample 1', raw: 1 }]);
        expect(
            resolveValueDescriptors(floatCol, {}, {}, 'cellKey', { value: 1.005, displayValue: 1.01 })
        ).toStrictEqual([{ display: 1.005, raw: 1.005 }]);
        expect(
            resolveValueDescriptors(floatLookupCol, {}, {}, 'cellKey', { value: 1, displayValue: 'Sample 1' })
        ).toStrictEqual([{ display: 'Sample 1', raw: 1 }]);
    });
});
