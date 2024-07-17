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
import { fromJS, List, Map } from 'immutable';

import sampleSet2QueryInfo from '../../../test/data/sampleSet2-getQueryDetails.json';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { ExtendedMap } from '../../../public/ExtendedMap';

import { STORAGE_UNIQUE_ID_CONCEPT_URI } from '../domainproperties/constants';

import { CellMessage, EditorModel, getPkData, ValueDescriptor } from './models';

const schemaQ = new SchemaQuery('samples', 'Sample Set 2');

const COLUMN_CAN_INSERT_AND_UPDATE = new QueryColumn({
    fieldKey: 'both',
    fieldKeyArray: ['both'],
    shownInInsertView: true,
    shownInUpdateView: true,
    userEditable: true,
    readOnly: false,
});
const COLUMN_CAN_INSERT = new QueryColumn({
    fieldKey: 'insert',
    fieldKeyArray: ['insert'],
    shownInInsertView: true,
    shownInUpdateView: false,
    userEditable: true,
    readOnly: false,
});
const COLUMN_CAN_UPDATE = new QueryColumn({
    fieldKey: 'update',
    fieldKeyArray: ['update'],
    shownInInsertView: false,
    shownInUpdateView: true,
    userEditable: true,
    readOnly: false,
});
const COLUMN_CANNOT_INSERT_AND_UPDATE = new QueryColumn({
    fieldKey: 'neither',
    fieldKeyArray: ['neither'],
    shownInInsertView: false,
    shownInUpdateView: false,
    userEditable: true,
    readOnly: false,
});
const COLUMN_FILE_INPUT = new QueryColumn({
    fieldKey: 'fileInput',
    fieldKeyArray: ['fileInput'],
    shownInInsertView: true,
    shownInUpdateView: true,
    userEditable: true,
    readOnly: false,
    inputType: 'file',
});
const QUERY_INFO = QueryInfo.fromJsonForTests({
    columns: {
        both: COLUMN_CAN_INSERT_AND_UPDATE,
        insert: COLUMN_CAN_INSERT,
        update: COLUMN_CAN_UPDATE,
        neither: COLUMN_CANNOT_INSERT_AND_UPDATE,
        fileInput: COLUMN_FILE_INPUT,
    },
});

describe('EditorModel', () => {
    const queryInfo = QueryInfo.fromJsonForTests(sampleSet2QueryInfo);

    describe('data validation', () => {
        test('no data', () => {
            const editorModel = new EditorModel({ id: 'insert-samples|samples/sample set 2' });
            const emptyDataModel = makeTestQueryModel(schemaQ, queryInfo, {}, [], 0);
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(emptyDataModel, 'Name');
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.isEmpty()).toBe(true);
            const errors = editorModel.getValidationErrors(emptyDataModel, 'Name');
            expect(errors.errors).toHaveLength(0);
        });

        test('valid data', () => {
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
                    '5-0': List<ValueDescriptor>([
                        {
                            display: 'requirement 1',
                            raw: 'requirement 1',
                        },
                    ]),
                    '5-1': List<ValueDescriptor>([
                        {
                            display: 'requirement 2',
                            raw: 'requirement 2',
                        },
                    ]),
                }),
                columns: List(['a', 'b', 'c', 'd', 'e']),
                id: 'insert-samples|samples/sample set 2',
                isPasting: false,
                focusColIdx: 1,
                focusRowIdx: 1,
                rowCount: 2,
                selectedColIdx: 1,
                selectedRowIdx: 1,
                selectionCells: [],
            });
            const dataModel = makeTestQueryModel(
                schemaQ,
                queryInfo,
                {
                    '1': {
                        RequiredData: 'Grid Requirement 1',
                    },
                    '2': {
                        Description: 'grid S-2 Description',
                    },
                },
                ['1']
            );
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(dataModel, 'Name');
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.isEmpty()).toBe(true);
            const errors = editorModel.getValidationErrors(dataModel, 'Name');
            expect(errors.errors).toHaveLength(0);
        });

        test('missing required data', () => {
            const editorModel = new EditorModel({
                cellMessages: Map<string, CellMessage>({
                    '1-0': 'description 1 message',
                }),
                cellValues: Map<string, List<ValueDescriptor>>({
                    '0-1': List<ValueDescriptor>([
                        {
                            display: 'S-2',
                            raw: 'S-2',
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
                    '5-0': List<ValueDescriptor>([
                        {
                            display: 'requirement 1',
                            raw: 'requirement 1',
                        },
                    ]),
                    '5-1': List<ValueDescriptor>([
                        {
                            display: '    ',
                            raw: '    ',
                        },
                    ]),
                    '5-2': List<ValueDescriptor>([
                        {
                            display: '1',
                            raw: 1,
                        },
                    ]),
                }),
                columns: List(['a', 'b', 'c', 'd', 'e']),
                id: 'insert-samples|samples/sample set 2',
                isPasting: false,
                focusColIdx: 1,
                focusRowIdx: 1,
                rowCount: 3,
                selectedColIdx: 1,
                selectedRowIdx: 1,
                selectionCells: [],
            });
            const dataModel = makeTestQueryModel(
                schemaQ,
                queryInfo,
                {
                    '1': {
                        Description: 'grid S-1 Description',
                    },
                    '2': {
                        Description: 'grid S-2 Description',
                    },
                    '3': {
                        Description: 'grid S-3 Description',
                    },
                },
                ['1', '2', '3']
            );
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(dataModel, 'Name');
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.size).toBe(2);
            expect(missingRequired.has('Name')).toBe(true);
            expect(missingRequired.get('Name').size).toBe(2);
            expect(missingRequired.get('Name').contains(1)).toBe(true);
            expect(missingRequired.get('Name').contains(3)).toBe(true);
            expect(missingRequired.get('Required Data').contains(2)).toBe(true); // Check whitespace trimmed
            expect(missingRequired.get('Required Data').contains(3)).toBe(false); // Check integer
            const errors = editorModel.getValidationErrors(dataModel, 'Name');
            expect(errors.cellMessages.toJS()).toStrictEqual({
                '1-0': 'description 1 message',
                '0-0': {
                    message: 'Name is required.',
                },
                '5-1': {
                    message: 'Required Data is required.',
                },
                '0-2': {
                    message: 'Name is required.',
                },
            });
            expect(errors.errors).toEqual(['Name is missing from rows 1, 3. Required Data is missing from row 2.']);
        });

        test('generated unique id not counted for missing required check', () => {
            const myQueryInfo = new QueryInfo({
                columns: new ExtendedMap({
                    Barcode: new QueryColumn({
                        name: 'Barcode',
                        fieldKey: 'Barcode',
                        fieldKeyArray: ['Barcode'],
                        shownInInsertView: true,
                        userEditable: true,
                        required: true,
                        conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
                    }),
                }),
            });
            const editorModel = new EditorModel({
                cellValues: Map<string, List<ValueDescriptor>>({
                    '5-0': List<ValueDescriptor>([
                        {
                            display: null,
                            raw: null,
                        },
                    ]),
                }),
                columns: List(['Barcode']),
            });
            const dataModel = makeTestQueryModel(
                schemaQ,
                myQueryInfo,
                {
                    '1': {},
                },
                ['1']
            );
            const { missingRequired } = editorModel.validateData(dataModel, 'Barcode');
            expect(missingRequired.size).toBe(0);
        });

        test('unique key violations', () => {
            const editorModel = new EditorModel({
                cellMessages: Map<string, CellMessage>({
                    '1-0': 'description 1 message',
                }),
                cellValues: Map<string, List<ValueDescriptor>>({
                    '0-0': List<ValueDescriptor>([
                        {
                            display: 'S-2',
                            raw: 'S-2',
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
                    '0-3': List<ValueDescriptor>([
                        {
                            display: 'S-4',
                            raw: 'S-4',
                        },
                    ]),
                    '0-4': List<ValueDescriptor>([
                        {
                            display: 'S-4',
                            raw: 'S-4',
                        },
                    ]),
                    '1-1': List<ValueDescriptor>([
                        {
                            display: ' spaceDupe ',
                            raw: ' spaceDupe \n',
                        },
                    ]),
                    '1-2': List<ValueDescriptor>([
                        {
                            display: 'spaceDupe',
                            raw: ' \tspaceDupe',
                        },
                    ]),
                    '1-3': List<ValueDescriptor>([
                        {
                            display: 'caseInSenSiTive',
                            raw: 'caseInSenSiTive',
                        },
                    ]),
                    '1-4': List<ValueDescriptor>([
                        {
                            display: 'CaseInsensItive',
                            raw: 'CaseInsensItive',
                        },
                    ]),
                    '5-0': List<ValueDescriptor>([
                        {
                            display: 'requirement 1',
                            raw: 'requirement 1',
                        },
                    ]),
                    '5-1': List<ValueDescriptor>([
                        {
                            display: 'requirement 2',
                            raw: 'requirement 2',
                        },
                    ]),
                    '5-2': List<ValueDescriptor>([
                        {
                            display: 'requirement 3',
                            raw: 'requirement 3',
                        },
                    ]),
                    '5-3': List<ValueDescriptor>([
                        {
                            display: 'requirement 4',
                            raw: 'requirement 4',
                        },
                    ]),
                    '5-4': List<ValueDescriptor>([
                        {
                            display: 'requirement 5',
                            raw: 'requirement 5',
                        },
                    ]),
                }),
                columns: List(['a', 'b', 'c', 'd', 'e']),
                id: 'insert-samples|samples/sample set 2',
                isPasting: false,
                focusColIdx: 1,
                focusRowIdx: 1,
                rowCount: 5,
                selectedColIdx: 1,
                selectedRowIdx: 1,
                selectionCells: [],
            });
            const dataModel = makeTestQueryModel(
                schemaQ,
                queryInfo,
                {
                    '1': {},
                    '2': {},
                    '3': {},
                    '4': {},
                    '5': {},
                },
                ['1', '2', '3', '4', '5']
            );
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(dataModel, 'Name');
            expect(missingRequired.isEmpty()).toBe(true);
            expect(uniqueKeyViolations.size).toBe(1);
            expect(uniqueKeyViolations.has('Name')).toBe(true);
            expect(uniqueKeyViolations.get('Name').size).toBe(2);
            expect(uniqueKeyViolations.get('Name').has('s-2')).toBe(true);
            expect(uniqueKeyViolations.get('Name').get('s-2')).toEqual(List<number>([1, 2]));
            expect(uniqueKeyViolations.get('Name').has('s-4')).toBe(true);
            expect(uniqueKeyViolations.get('Name').get('s-4')).toEqual(List<number>([4, 5]));
            const errors = editorModel.getValidationErrors(dataModel, 'Name');
            expect(errors.errors).toEqual([
                'Duplicate value (s-2) for Name on rows 1, 2.',
                'Duplicate value (s-4) for Name on rows 4, 5.',
            ]);

            const ciUniqueKeyViolations = editorModel.validateData(dataModel, 'Description').uniqueKeyViolations;
            // Check whitespace trimmed when detecting duplicates
            expect(ciUniqueKeyViolations.get('Description').has('spacedupe')).toBe(true);
            expect(ciUniqueKeyViolations.get('Description').get('spacedupe')).toEqual(List<number>([2, 3]));
            // check case insensitivity when detecting duplicates
            expect(ciUniqueKeyViolations.get('Description').has('caseinsensitive')).toBe(true);
            expect(ciUniqueKeyViolations.get('Description').get('caseinsensitive')).toEqual(List<number>([4, 5]));
            const ciErrors = editorModel.getValidationErrors(dataModel, 'Description');
            expect(ciErrors.errors).toEqual([
                'Duplicate value (spacedupe) for Description on rows 2, 3.',
                'Duplicate value (caseinsensitive) for Description on rows 4, 5.',
            ]);
        });

        test('missing required and unique key violations', () => {
            const editorModel = new EditorModel({
                cellMessages: Map<string, CellMessage>({
                    '1-0': 'description 1 message',
                }),
                cellValues: Map<string, List<ValueDescriptor>>({
                    '0-0': List<ValueDescriptor>([
                        {
                            display: 'S-2',
                            raw: 'S-2',
                        },
                    ]),
                    '0-1': List<ValueDescriptor>([
                        {
                            display: 'S-2',
                            raw: 'S-2',
                        },
                    ]),
                    // missing Name for row index 2
                    '0-3': List<ValueDescriptor>([
                        {
                            display: 'S-4',
                            raw: 'S-4',
                        },
                    ]),
                    '0-4': List<ValueDescriptor>([
                        {
                            display: 'S-4',
                            raw: 'S-4',
                        },
                    ]),
                    '5-0': List<ValueDescriptor>([
                        {
                            display: 'requirement 1',
                            raw: 'requirement 1',
                        },
                    ]),
                    '5-1': List<ValueDescriptor>([
                        {
                            display: ' \n\t ',
                            raw: ' \n\t ',
                        },
                    ]),
                    '5-2': List<ValueDescriptor>([
                        {
                            display: 'requirement 3',
                            raw: 'requirement 3',
                        },
                    ]),
                    '5-3': List<ValueDescriptor>([
                        {
                            display: 'requirement 4',
                            raw: 'requirement 4',
                        },
                    ]),
                    // missing RequiredData for row index 4
                }),
                columns: List(['a', 'b', 'c', 'd', 'e']),
                id: 'insert-samples|samples/sample set 2',
                isPasting: false,
                focusColIdx: 1,
                focusRowIdx: 1,
                rowCount: 5,
                selectedColIdx: 1,
                selectedRowIdx: 1,
                selectionCells: [],
            });
            const dataModel = makeTestQueryModel(
                schemaQ,
                queryInfo,
                {
                    '1': {},
                    '2': {},
                    '3': {},
                    '4': {},
                    '5': {},
                },
                ['1', '2', '3', '4', '5']
            );
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(dataModel, 'Name');
            expect(missingRequired.size).toBe(2);
            expect(missingRequired.has('Name')).toBe(true);
            expect(missingRequired.get('Name').size).toBe(1);
            expect(missingRequired.get('Name').contains(3)).toBe(true);
            expect(missingRequired.has('Required Data')).toBe(true);
            expect(missingRequired.get('Required Data').contains(2)).toBe(true);
            expect(missingRequired.get('Required Data').contains(5)).toBe(true);

            expect(uniqueKeyViolations.size).toBe(1);
            expect(uniqueKeyViolations.has('Name')).toBe(true);
            expect(uniqueKeyViolations.get('Name').size).toBe(2);
            expect(uniqueKeyViolations.get('Name').has('s-2')).toBe(true);
            expect(uniqueKeyViolations.get('Name').get('s-2')).toEqual(List<number>([1, 2]));
            expect(uniqueKeyViolations.get('Name').has('s-4')).toBe(true);
            expect(uniqueKeyViolations.get('Name').get('s-4')).toEqual(List<number>([4, 5]));
            const errors = editorModel.getValidationErrors(dataModel, 'Name');
            expect(errors.errors).toEqual([
                'Duplicate value (s-2) for Name on rows 1, 2.',
                'Duplicate value (s-4) for Name on rows 4, 5.',
                'Required Data is missing from rows 2, 5. Name is missing from row 3.',
            ]);
            expect(errors.cellMessages.toJS()).toStrictEqual({
                '1-0': 'description 1 message',
                '5-1': { message: 'Required Data is required.' },
                '0-2': { message: 'Name is required.' },
                '5-4': { message: 'Required Data is required.' },
            });
        });

        test('getEditorDataFromQueryValueMap with displayValue', () => {
            const data = Map<any, any>({
                value: 1,
                displayValue: 'one',
            });
            expect(EditorModel.getEditorDataFromQueryValueMap(data)).toStrictEqual(
                List<any>([{ displayValue: 'one', value: 1 }])
            );
        });

        test('getEditorDataFromQueryValueMap without displayValue', () => {
            const data = Map<any, any>({
                value: 'blue',
            });
            expect(EditorModel.getEditorDataFromQueryValueMap(data)).toEqual('blue');
        });

        test('getEditorDataFromQueryValueMap without value', () => {
            const data = Map<any, any>({
                color: 'blue',
                displayValue: 'blue',
            });
            expect(EditorModel.getEditorDataFromQueryValueMap(data)).toEqual(undefined);
        });

        test('convertQueryDataToEditorData with updates', () => {
            const queryData = fromJS({
                1: {
                    noValue: {
                        color: 'blue',
                        displayValue: 'blue',
                    },
                    withValue: {
                        value: 'orange',
                        ignoreMe: 'nothing to see',
                    },
                    'withDisplay/Value': {
                        value: 'b',
                        displayValue: 'blue',
                        otherField: 'irrelevant',
                    },
                    doNotChangeMe: {
                        value: 'fred',
                    },
                },
                2: {
                    noValue: {
                        color: 'blue',
                        displayValue: 'blue',
                    },
                    withValue: {
                        value: 'orangish',
                        ignoreMe: 'nothing to see',
                    },
                    'withDisplay/Value': {
                        value: 'b',
                        displayValue: 'black',
                        otherField: 'irrelevant',
                    },
                    doNotChangeMe: {
                        value: 'maroon',
                    },
                },
            });
            const updates = Map<any, any>({
                withValue: 'purple',
                withDisplay$SValue: 'teal',
            });
            const result = EditorModel.convertQueryDataToEditorData(queryData, updates);
            expect(result).toStrictEqual(
                Map<string, any>({
                    1: Map<string, any>({
                        withValue: 'purple',
                        withDisplay$SValue: 'teal',
                        doNotChangeMe: 'fred',
                    }),
                    2: Map<string, any>({
                        withValue: 'purple',
                        withDisplay$SValue: 'teal',
                        doNotChangeMe: 'maroon',
                    }),
                })
            );
        });

        test('convertQueryDataToEditorData without updates', () => {
            const queryData = fromJS({
                1: {
                    noValue: {
                        color: 'blue',
                        displayValue: 'blue',
                    },
                    withValue: {
                        value: 'orange',
                        ignoreMe: 'nothing to see',
                    },
                    withDisplayValue: {
                        value: 'b',
                        displayValue: 'blue',
                        otherField: 'irrelevant',
                    },
                    doNotChangeMe: {
                        value: 'fred',
                    },
                },
                2: {
                    noValue: {
                        color: 'blue',
                        displayValue: 'blue',
                    },
                    withValue: {
                        value: 'orangish',
                        ignoreMe: 'nothing to see',
                    },
                    withDisplayValue: {
                        value: 'b',
                        displayValue: 'black',
                        otherField: 'irrelevant',
                    },
                    doNotChangeMe: {
                        value: 'maroon',
                    },
                },
            });
            expect(EditorModel.convertQueryDataToEditorData(queryData)).toStrictEqual(
                Map<string, any>({
                    1: Map<string, any>({
                        withValue: 'orange',
                        withDisplayValue: List.of({
                            value: 'b',
                            displayValue: 'blue',
                        }),
                        doNotChangeMe: 'fred',
                    }),
                    2: Map<string, any>({
                        withValue: 'orangish',
                        withDisplayValue: List.of({
                            displayValue: 'black',
                            value: 'b',
                        }),
                        doNotChangeMe: 'maroon',
                    }),
                })
            );
        });

        test('convertQueryModelDataToGridResponse', () => {
            // Arrange
            const rows = {
                1: {
                    'withLookup/Value': {
                        displayValue: 'foo',
                        value: 1,
                    },
                    withValue: {
                        value: 'orange',
                        ignoreMe: 'nothing to see',
                    },
                },
                2: {
                    'withLookup/Value': {
                        displayValue: 'bar',
                        value: 2,
                    },
                    withValue: {
                        value: 'purple',
                        ignoreMe: 'nothing to see',
                    },
                },
            };
            const orderedRowKeys = Object.keys(rows).sort();
            const queryModel = makeTestQueryModel(queryInfo.schemaQuery, queryInfo, rows, orderedRowKeys);

            // Act
            const gridResponse = EditorModel.convertQueryModelDataToGridResponse(queryModel);

            // Assert
            expect(gridResponse.data).toStrictEqual(
                Map<number, any>({
                    1: Map<string, any>({
                        'withLookup/Value': List.of({ displayValue: 'foo', value: 1 }),
                        withValue: 'orange',
                    }),
                    2: Map<string, any>({
                        'withLookup/Value': List.of({ displayValue: 'bar', value: 2 }),
                        withValue: 'purple',
                    }),
                })
            );

            expect(gridResponse.dataIds).toStrictEqual(List.of(...orderedRowKeys));
        });
    });

    describe('utils', () => {
        test('getMessage', () => {
            const model = new EditorModel({
                cellMessages: fromJS({
                    '0-0': 'a',
                    '1-1': 'b',
                }),
            });
            expect(model.getMessage(0, 0)).toBe('a');
            expect(model.getMessage(1, 0)).toBe(undefined);
            expect(model.getMessage(0, 1)).toBe(undefined);
            expect(model.getMessage(1, 1)).toBe('b');
        });

        test('getColumns without queryInfo', () => {
            const editorModel = new EditorModel({});
            const queryInfo = new QueryInfo({});
            expect(editorModel.getColumns(queryInfo).length).toBe(0);
            expect(editorModel.getColumns(queryInfo, true).length).toBe(0);
        });

        test('getColumns forInsert', () => {
            const editorModel = new EditorModel({});
            const columns = editorModel.getColumns(QUERY_INFO);
            expect(columns.length).toBe(2);
            expect(columns[0]).toStrictEqual(COLUMN_CAN_INSERT_AND_UPDATE);
            expect(columns[1]).toStrictEqual(COLUMN_CAN_INSERT);
        });

        test('getColumns forUpdate', () => {
            const editorModel = new EditorModel({});
            const columns = editorModel.getColumns(QUERY_INFO, true);
            expect(columns.length).toBe(2);
            expect(columns[0]).toStrictEqual(COLUMN_CAN_INSERT_AND_UPDATE);
            expect(columns[1]).toStrictEqual(COLUMN_CAN_UPDATE);
        });

        test('getColumns readOnlyColumns', () => {
            const editorModel = new EditorModel({});
            const columns = editorModel.getColumns(QUERY_INFO, true, ['neither']);
            expect(columns.length).toBe(3);
            expect(columns[0]).toStrictEqual(COLUMN_CAN_INSERT_AND_UPDATE);
            expect(columns[1]).toStrictEqual(COLUMN_CAN_UPDATE);
            expect(columns[2].fieldKey).toBe(COLUMN_CANNOT_INSERT_AND_UPDATE.fieldKey);
            expect(columns[2].readOnly).toBe(true);
        });

        test('getColumns getInsertColumns', () => {
            const editorModel = new EditorModel({});
            const columns = editorModel.getColumns(QUERY_INFO, false, undefined, [
                COLUMN_CANNOT_INSERT_AND_UPDATE,
                COLUMN_CAN_INSERT,
            ]);
            expect(columns.length).toBe(2);
            expect(columns[0]).toBe(COLUMN_CANNOT_INSERT_AND_UPDATE);
            expect(columns[1]).toBe(COLUMN_CAN_INSERT);
        });

        test('getValue', () => {
            const model = new EditorModel({
                cellValues: fromJS({
                    '0-0': List([{ display: 'A', raw: 'a' } as ValueDescriptor]),
                    '1-1': List([{ display: 'B', raw: 'b' } as ValueDescriptor]),
                }),
            });
            expect(model.getValue(0, 0).size).toBe(1);
            expect(model.getValue(0, 0).get(0).raw).toBe('a');
            expect(model.getValue(1, 0).size).toBe(0);
            expect(model.getValue(0, 1).size).toBe(0);
            expect(model.getValue(1, 1).size).toBe(1);
            expect(model.getValue(1, 1).get(0).raw).toBe('b');
        });

        test('getValueForCellKey', () => {
            const model = new EditorModel({
                cellValues: fromJS({
                    '0-0': List([{ display: 'A', raw: 'a' } as ValueDescriptor]),
                    '1-1': List([{ display: 'B', raw: 'b' } as ValueDescriptor]),
                }),
            });
            expect(model.getValueForCellKey('0-0').size).toBe(1);
            expect(model.getValueForCellKey('0-0').get(0).raw).toBe('a');
            expect(model.getValueForCellKey('1-0').size).toBe(0);
            expect(model.getValueForCellKey('0-1').size).toBe(0);
            expect(model.getValueForCellKey('1-1').size).toBe(1);
            expect(model.getValueForCellKey('1-1').get(0).raw).toBe('b');
        });

        test('hasFocus', () => {
            expect(new EditorModel({ focusColIdx: -1, focusRowIdx: -1 }).hasFocus).toBeFalsy();
            expect(new EditorModel({ focusColIdx: -1, focusRowIdx: 0 }).hasFocus).toBeFalsy();
            expect(new EditorModel({ focusColIdx: 0, focusRowIdx: -1 }).hasFocus).toBeFalsy();
            expect(new EditorModel({ focusColIdx: 0, focusRowIdx: 0 }).hasFocus).toBeTruthy();
        });

        test('isFocused', () => {
            const model = new EditorModel({ focusColIdx: 0, focusRowIdx: 0 });
            expect(model.isFocused(-1, -1)).toBeFalsy();
            expect(model.isFocused(-1, 0)).toBeFalsy();
            expect(model.isFocused(0, -1)).toBeFalsy();
            expect(model.isFocused(0, 0)).toBeTruthy();
            expect(model.isFocused(0, 1)).toBeFalsy();
            expect(model.isFocused(1, 0)).toBeFalsy();
            expect(model.isFocused(1, 1)).toBeFalsy();
        });

        test('hasSelection', () => {
            expect(new EditorModel({ selectedColIdx: -1, selectedRowIdx: -1 }).hasSelection).toBeFalsy();
            expect(new EditorModel({ selectedColIdx: -1, selectedRowIdx: 0 }).hasSelection).toBeFalsy();
            expect(new EditorModel({ selectedColIdx: 0, selectedRowIdx: -1 }).hasSelection).toBeFalsy();
            expect(new EditorModel({ selectedColIdx: 0, selectedRowIdx: 0 }).hasSelection).toBeTruthy();
        });

        test('selectionKey', () => {
            expect(new EditorModel({ selectedColIdx: -1, selectedRowIdx: -1 }).selectionKey).toBe(undefined);
            expect(new EditorModel({ selectedColIdx: -1, selectedRowIdx: 0 }).selectionKey).toBe(undefined);
            expect(new EditorModel({ selectedColIdx: 0, selectedRowIdx: -1 }).selectionKey).toBe(undefined);
            expect(new EditorModel({ selectedColIdx: 0, selectedRowIdx: 0 }).selectionKey).toBe('0-0');
            expect(new EditorModel({ selectedColIdx: 0, selectedRowIdx: 1 }).selectionKey).toBe('0-1');
            expect(new EditorModel({ selectedColIdx: 1, selectedRowIdx: 0 }).selectionKey).toBe('1-0');
        });

        test('isSelected', () => {
            const model = new EditorModel({ selectedColIdx: 0, selectedRowIdx: 0 });
            expect(model.isSelected(-1, -1)).toBeFalsy();
            expect(model.isSelected(-1, 0)).toBeFalsy();
            expect(model.isSelected(0, -1)).toBeFalsy();
            expect(model.isSelected(0, 0)).toBeTruthy();
            expect(model.isSelected(0, 1)).toBeFalsy();
            expect(model.isSelected(1, 0)).toBeFalsy();
            expect(model.isSelected(1, 1)).toBeFalsy();
        });

        test('hasMultipleSelection', () => {
            expect(new EditorModel({ selectionCells: [] }).isMultiSelect).toBeFalsy();
            expect(new EditorModel({ selectionCells: ['0-0'] }).isMultiSelect).toBeFalsy();
            expect(new EditorModel({ selectionCells: ['0-0', '1-1'] }).isMultiSelect).toBeTruthy();
        });

        test('isMultiColumnSelection', () => {
            expect(new EditorModel({ selectionCells: [] }).isMultiColumnSelection).toBeFalsy();
            expect(new EditorModel({ selectionCells: ['0-0'] }).isMultiColumnSelection).toBeFalsy();
            expect(new EditorModel({ selectionCells: ['0-0', '0-1'] }).isMultiColumnSelection).toBeFalsy();
            expect(new EditorModel({ selectionCells: ['0-0', '1-1'] }).isMultiColumnSelection).toBeTruthy();
        });

        test('lastSelection', () => {
            // multiple columns should always return false
            expect(
                new EditorModel({
                    selectionCells: ['0-0', '0-1', '1-0', '1-1'],
                    rowCount: 100,
                }).lastSelection(0, 0)
            ).toBeFalsy();
            expect(
                new EditorModel({
                    selectionCells: ['0-0', '0-1', '1-0', '1-1'],
                    rowCount: 100,
                }).lastSelection(1, 1)
            ).toBeTruthy();
            expect(
                new EditorModel({
                    selectionCells: ['1-0', '1-1', '0-0', '0-1'],
                    rowCount: 100,
                }).lastSelection(0, 0)
            ).toBeFalsy();
            expect(
                new EditorModel({
                    selectionCells: ['1-0', '0-0', '0-1', '1-1'],
                    rowCount: 100,
                }).lastSelection(1, 1)
            ).toBeTruthy();
            // single column should have a true
            expect(
                new EditorModel({
                    selectionCells: ['1-0', '1-1', '1-2', '1-3'],
                    rowCount: 100,
                }).lastSelection(1, 0)
            ).toBeFalsy();
            expect(
                new EditorModel({
                    selectionCells: ['1-0', '1-1', '1-2', '1-3'],
                    rowCount: 100,
                }).lastSelection(1, 1)
            ).toBeFalsy();
            expect(
                new EditorModel({
                    selectionCells: ['1-0', '1-1', '1-2', '1-3'],
                    rowCount: 100,
                }).lastSelection(1, 2)
            ).toBeFalsy();
            expect(
                new EditorModel({
                    selectionCells: ['1-0', '1-1', '1-2', '1-3'],
                    rowCount: 100,
                }).lastSelection(1, 3)
            ).toBeTruthy();
            // single cell should always be true
            expect(
                new EditorModel({
                    selectionCells: [],
                    selectedColIdx: 0,
                    selectedRowIdx: 0,
                    rowCount: 100,
                }).lastSelection(0, 0)
            ).toBeTruthy();
            expect(
                new EditorModel({
                    selectionCells: [],
                    selectedColIdx: 100,
                    selectedRowIdx: 100,
                    rowCount: 100,
                }).lastSelection(100, 100)
            ).toBeTruthy();
        });

        test('isInBounds', () => {
            const model = new EditorModel({ orderedColumns: List(['a']), rowCount: 1 });
            expect(model.isInBounds(-1, -1)).toBeFalsy();
            expect(model.isInBounds(0, -1)).toBeFalsy();
            expect(model.isInBounds(-1, 0)).toBeFalsy();
            expect(model.isInBounds(0, 0)).toBeTruthy();
            expect(model.isInBounds(0, 1)).toBeFalsy();
            expect(model.isInBounds(1, 0)).toBeFalsy();
            expect(model.isInBounds(1, 1)).toBeFalsy();
        });

        test('inSelection', () => {
            const model = new EditorModel({ selectionCells: ['0-0', '1-1'] });
            expect(model.inSelection(-1, -1)).toBeFalsy();
            expect(model.inSelection(0, -1)).toBeFalsy();
            expect(model.inSelection(-1, 0)).toBeFalsy();
            expect(model.inSelection(0, 0)).toBeTruthy();
            expect(model.inSelection(0, 1)).toBeFalsy();
            expect(model.inSelection(1, 0)).toBeFalsy();
            expect(model.inSelection(1, 1)).toBeTruthy();
        });

        test('hasRawValue', () => {
            const model = new EditorModel({});
            expect(model.hasRawValue(undefined)).toBeFalsy();
            expect(model.hasRawValue({} as ValueDescriptor)).toBeFalsy();
            expect(model.hasRawValue({ raw: undefined } as ValueDescriptor)).toBeFalsy();
            expect(model.hasRawValue({ raw: null } as ValueDescriptor)).toBeFalsy();
            expect(model.hasRawValue({ raw: '' } as ValueDescriptor)).toBeFalsy();
            expect(model.hasRawValue({ raw: ' ' } as ValueDescriptor)).toBeFalsy();
            expect(model.hasRawValue({ raw: ' test' } as ValueDescriptor)).toBeTruthy();
        });

        test('hasData', () => {
            let model = new EditorModel({
                cellValues: fromJS({
                    '0-0': List([{} as ValueDescriptor]),
                }),
            });
            expect(model.hasData).toBeFalsy();

            model = new EditorModel({
                cellValues: fromJS({
                    '0-0': List([{ raw: ' ' } as ValueDescriptor]),
                }),
            });
            expect(model.hasData).toBeFalsy();

            model = new EditorModel({
                cellValues: fromJS({
                    '0-0': List([{ raw: 'a' } as ValueDescriptor]),
                }),
            });
            expect(model.hasData).toBeTruthy();
        });
    });
});

describe('getPkData', () => {
    const config = {
        appEditableTable: true,
        pkCols: ['RowId'],
        columns: fromJS({
            rowid: new QueryColumn({
                caption: 'Row Id',
                fieldKey: 'RowId',
                inputType: 'number',
            }),
            lsid: new QueryColumn({
                caption: 'LSID',
                fieldKey: 'lsid',
                inputType: 'text',
            }),
            description: new QueryColumn({
                caption: 'Description',
                fieldKey: 'Description',
                inputType: 'textarea',
            }),
        }),
    };
    const queryInfo = new QueryInfo(config);
    const queryInfoWithAltKey = new QueryInfo({
        ...config,
        altUpdateKeys: new Set<string>(['lsid']),
    });

    test('as value', () => {
        expect(getPkData(queryInfo, Map.of('RowId', 1, 'lsid', 'abc'))).toStrictEqual({ RowId: 1 });
    });

    test('with altUpdateKeys', () => {
        expect(getPkData(queryInfoWithAltKey, Map.of('RowId', 1, 'lsid', 'abc'))).toStrictEqual({
            RowId: 1,
            lsid: 'abc',
        });
    });

    test('as object', () => {
        expect(getPkData(queryInfo, Map.of('RowId', { value: 1, displayValue: '1' }))).toStrictEqual({ RowId: 1 });
    });

    test('as array', () => {
        expect(getPkData(queryInfo, Map.of('RowId', [1]))).toStrictEqual({ RowId: 1 });
    });

    test('as array of objects', () => {
        expect(getPkData(queryInfo, Map.of('RowId', [{ value: 1, displayValue: '1' }]))).toStrictEqual({ RowId: 1 });
    });

    test('as list of maps', () => {
        expect(getPkData(queryInfo, Map.of('RowId', List.of(Map.of('value', 1))))).toStrictEqual({ RowId: 1 });
    });
});
