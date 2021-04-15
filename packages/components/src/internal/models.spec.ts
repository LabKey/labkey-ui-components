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
import { fromJS, List, Map, Set } from 'immutable';

import sampleSet2QueryInfo from '../test/data/sampleSet2-getQueryDetails.json';
import { QueryInfo, QueryGridModel, SchemaQuery, QueryColumn } from '..';

import { CellMessage, EditorModel, ValueDescriptor } from './models';
import { resetQueryGridState } from './global';

const schemaQ = new SchemaQuery({
    schemaName: 'samples',
    queryName: 'Sample Set 2',
});

const COLUMN_CAN_INSERT_AND_UPDATE = new QueryColumn({
    fieldKey: 'both',
    fieldKeyArray: ['both'],
    shownInInsertView: true,
    shownInUpdateView: true,
    userEditable: true,
});
const COLUMN_CAN_INSERT = new QueryColumn({
    fieldKey: 'insert',
    fieldKeyArray: ['insert'],
    shownInInsertView: true,
    shownInUpdateView: false,
    userEditable: true,
});
const COLUMN_CAN_UPDATE = new QueryColumn({
    fieldKey: 'update',
    fieldKeyArray: ['update'],
    shownInInsertView: false,
    shownInUpdateView: true,
    userEditable: true,
});
const COLUMN_CANNOT_INSERT_AND_UPDATE = new QueryColumn({
    fieldKey: 'neither',
    fieldKeyArray: ['neither'],
    shownInInsertView: false,
    shownInUpdateView: false,
    userEditable: true,
});
const COLUMN_FILE_INPUT = new QueryColumn({
    fieldKey: 'fileInput',
    fieldKeyArray: ['fileInput'],
    shownInInsertView: true,
    shownInUpdateView: true,
    userEditable: true,
    inputType: 'file',
});
const QUERY_INFO = QueryInfo.fromJSON({
    columns: {
        both: COLUMN_CAN_INSERT_AND_UPDATE,
        insert: COLUMN_CAN_INSERT,
        update: COLUMN_CAN_UPDATE,
        neither: COLUMN_CANNOT_INSERT_AND_UPDATE,
        fileInput: COLUMN_FILE_INPUT,
    },
});

beforeEach(() => {
    resetQueryGridState();
});

describe('EditorModel', () => {
    describe('data validation', () => {
        test('no data', () => {
            const emptyEditorGridData = {
                cellMessages: Map<string, CellMessage>(),
                cellValues: Map<string, List<ValueDescriptor>>(),
                colCount: 5,
                id: 'insert-samples|samples/sample set 2',
                isPasting: false,
                focusColIdx: -1,
                focusRowIdx: -1,
                numPastedRows: 0,
                rowCount: 0,
                selectedColIdx: -1,
                selectedRowIdx: -1,
                selectionCells: [],
            };
            const editorModel = new EditorModel(emptyEditorGridData);
            const emptyQueryGridModel = new QueryGridModel({
                schema: schemaQ.schemaName,
                query: schemaQ.queryName,
                id: 'insert-samples|samples/sample set 2',
                queryInfo: QueryInfo.fromJSON(sampleSet2QueryInfo),
                editable: true,
            });
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(emptyQueryGridModel, 'Name');
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.isEmpty()).toBe(true);
            const errors = editorModel.getValidationErrors(emptyQueryGridModel, 'Name');
            expect(errors).toHaveLength(0);
        });

        test('valid data', () => {
            const editableGridData = {
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
                colCount: 5,
                id: 'insert-samples|samples/sample set 2',
                isPasting: false,
                focusColIdx: 1,
                focusRowIdx: 1,
                numPastedRows: 0,
                rowCount: 2,
                selectedColIdx: 1,
                selectedRowIdx: 1,
                selectionCells: [],
            };
            const editorModel = new EditorModel(editableGridData);
            const queryGridModel = new QueryGridModel({
                schema: schemaQ.schemaName,
                query: schemaQ.queryName,
                id: 'insert-samples|samples/sample set 2',
                queryInfo: QueryInfo.fromJSON(sampleSet2QueryInfo),
                editable: true,
                data: Map<any, Map<string, any>>({
                    '1': Map<string, any>({
                        RequiredData: 'Grid Requirement 1',
                    }),
                    '2': Map<string, any>({
                        Description: 'grid S-2 Description',
                    }),
                }),
                dataIds: List<any>(['1']),
            });
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(queryGridModel, 'Name');
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.isEmpty()).toBe(true);
            const errors = editorModel.getValidationErrors(queryGridModel, 'Name');
            expect(errors).toHaveLength(0);
        });

        test('missing required data', () => {
            const editableGridData = {
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
            const editorModel = new EditorModel(editableGridData);
            const queryGridModel = new QueryGridModel({
                schema: schemaQ.schemaName,
                query: schemaQ.queryName,
                id: 'insert-samples|samples/sample set 2',
                queryInfo: QueryInfo.fromJSON(sampleSet2QueryInfo),
                editable: true,
                data: Map<any, Map<string, any>>({
                    '1': Map<string, any>({
                        Description: 'grid S-1 Description',
                    }),
                    '2': Map<string, any>({
                        Description: 'grid S-2 Description',
                    }),
                    '3': Map<string, any>({
                        Description: 'grid S-3 Description',
                    }),
                }),
                dataIds: List<any>(['1', '2', '3']),
            });
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(queryGridModel, 'Name');
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.size).toBe(2);
            expect(missingRequired.has('Name')).toBe(true);
            expect(missingRequired.get('Name').size).toBe(2);
            expect(missingRequired.get('Name').contains(1)).toBe(true);
            expect(missingRequired.get('Name').contains(3)).toBe(true);
            expect(missingRequired.get('Required Data').contains(2)).toBe(true); // Check whitespace trimmed
            expect(missingRequired.get('Required Data').contains(3)).toBe(false); // Check integer
            const errors = editorModel.getValidationErrors(queryGridModel, 'Name');
            expect(errors).toHaveLength(1);
        });

        test('unique key violations', () => {
            const editableGridData = {
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
                colCount: 5,
                id: 'insert-samples|samples/sample set 2',
                isPasting: false,
                focusColIdx: 1,
                focusRowIdx: 1,
                numPastedRows: 0,
                rowCount: 5,
                selectedColIdx: 1,
                selectedRowIdx: 1,
                selectionCells: [],
            };
            const editorModel = new EditorModel(editableGridData);
            const queryGridModel = new QueryGridModel({
                schema: schemaQ.schemaName,
                query: schemaQ.queryName,
                id: 'insert-samples|samples/sample set 2',
                queryInfo: QueryInfo.fromJSON(sampleSet2QueryInfo),
                editable: true,
                data: Map<any, Map<string, any>>({
                    '1': Map<string, any>(),
                    '2': Map<string, any>(),
                    '3': Map<string, any>(),
                    '4': Map<string, any>(),
                    '5': Map<string, any>(),
                }),
                dataIds: List<any>(['1', '2', '3', '4', '5']),
            });
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(queryGridModel, 'Name');
            expect(missingRequired.isEmpty()).toBe(true);
            expect(uniqueKeyViolations.size).toBe(1);
            expect(uniqueKeyViolations.has('Name')).toBe(true);
            expect(uniqueKeyViolations.get('Name').size).toBe(2);
            expect(uniqueKeyViolations.get('Name').has('s-2')).toBe(true);
            expect(uniqueKeyViolations.get('Name').get('s-2')).toEqual(
                List<number>([1, 2])
            );
            expect(uniqueKeyViolations.get('Name').has('s-4')).toBe(true);
            expect(uniqueKeyViolations.get('Name').get('s-4')).toEqual(
                List<number>([4, 5])
            );
            const errors = editorModel.getValidationErrors(queryGridModel, 'Name');
            expect(errors).toHaveLength(2);
            expect(errors[0].indexOf('Duplicate')).toBeGreaterThanOrEqual(0);
            expect(errors[1].indexOf('Duplicate')).toBeGreaterThanOrEqual(0);

            const ciUniqueKeyViolations = editorModel.validateData(queryGridModel, 'Description').uniqueKeyViolations;
            // Check whitespace trimmed when detecting duplicates
            expect(ciUniqueKeyViolations.get('Description').has('spacedupe')).toBe(true);
            expect(ciUniqueKeyViolations.get('Description').get('spacedupe')).toEqual(
                List<number>([2, 3])
            );
            // check case insensitivity when detecting duplicates
            expect(ciUniqueKeyViolations.get('Description').has('caseinsensitive')).toBe(true);
            expect(ciUniqueKeyViolations.get('Description').get('caseinsensitive')).toEqual(
                List<number>([4, 5])
            );
            const ciErrors = editorModel.getValidationErrors(queryGridModel, 'Description');
            expect(ciErrors[0].indexOf('Duplicate')).toBeGreaterThanOrEqual(0);
            expect(ciErrors[1].indexOf('Duplicate')).toBeGreaterThanOrEqual(0);
        });

        test('missing required and unique key violations', () => {
            const editableGridData = {
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
                colCount: 5,
                id: 'insert-samples|samples/sample set 2',
                isPasting: false,
                focusColIdx: 1,
                focusRowIdx: 1,
                numPastedRows: 0,
                rowCount: 5,
                selectedColIdx: 1,
                selectedRowIdx: 1,
                selectionCells: [],
            };
            const editorModel = new EditorModel(editableGridData);
            const queryGridModel = new QueryGridModel({
                schema: schemaQ.schemaName,
                query: schemaQ.queryName,
                id: 'insert-samples|samples/sample set 2',
                queryInfo: QueryInfo.fromJSON(sampleSet2QueryInfo),
                editable: true,
                data: Map<any, Map<string, any>>({
                    '1': Map<string, any>(),
                    '2': Map<string, any>(),
                    '3': Map<string, any>(),
                    '4': Map<string, any>(),
                    '5': Map<string, any>(),
                }),
                dataIds: List<any>(['1', '2', '3', '4', '5']),
            });
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(queryGridModel, 'Name');
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
            expect(uniqueKeyViolations.get('Name').get('s-2')).toEqual(
                List<number>([1, 2])
            );
            expect(uniqueKeyViolations.get('Name').has('s-4')).toBe(true);
            expect(uniqueKeyViolations.get('Name').get('s-4')).toEqual(
                List<number>([4, 5])
            );
            const errors = editorModel.getValidationErrors(queryGridModel, 'Name');
            expect(errors).toHaveLength(3);
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
            const updates = Map<any, any>({
                withValue: 'purple',
                withDisplayValue: 'teal',
            });
            expect(EditorModel.convertQueryDataToEditorData(queryData, updates)).toStrictEqual(
                Map<string, any>({
                    1: Map<string, any>({
                        withValue: 'purple',
                        withDisplayValue: 'teal',
                        doNotChangeMe: 'fred',
                    }),
                    2: Map<string, any>({
                        withValue: 'purple',
                        withDisplayValue: 'teal',
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
                        withDisplayValue: List<any>([
                            {
                                value: 'b',
                                displayValue: 'blue',
                            },
                        ]),
                        doNotChangeMe: 'fred',
                    }),
                    2: Map<string, any>({
                        withValue: 'orangish',
                        withDisplayValue: List<any>([
                            {
                                displayValue: 'black',
                                value: 'b',
                            },
                        ]),
                        doNotChangeMe: 'maroon',
                    }),
                })
            );
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
            const gridModel = new QueryGridModel({});
            const editorModel = new EditorModel({});
            expect(editorModel.getColumns(gridModel).size).toBe(0);
            expect(editorModel.getColumns(gridModel, true).size).toBe(0);
        });

        test('getColumns forInsert', () => {
            const gridModel = new QueryGridModel({ queryInfo: QUERY_INFO });
            const editorModel = new EditorModel({});
            const columns = editorModel.getColumns(gridModel);
            expect(columns.size).toBe(2);
            expect(columns.get(0)).toBe(COLUMN_CAN_INSERT_AND_UPDATE);
            expect(columns.get(1)).toBe(COLUMN_CAN_INSERT);
        });

        test('getColumns forUpdate', () => {
            const gridModel = new QueryGridModel({ queryInfo: QUERY_INFO });
            const editorModel = new EditorModel({});
            const columns = editorModel.getColumns(gridModel, true);
            expect(columns.size).toBe(2);
            expect(columns.get(0)).toBe(COLUMN_CAN_INSERT_AND_UPDATE);
            expect(columns.get(1)).toBe(COLUMN_CAN_UPDATE);
        });

        test('getColumns readOnlyColumns', () => {
            const gridModel = new QueryGridModel({ queryInfo: QUERY_INFO });
            const editorModel = new EditorModel({});
            const columns = editorModel.getColumns(gridModel, true, List(['neither']));
            expect(columns.size).toBe(3);
            expect(columns.get(0)).toBe(COLUMN_CAN_INSERT_AND_UPDATE);
            expect(columns.get(1)).toBe(COLUMN_CAN_UPDATE);
            expect(columns.get(2).fieldKey).toBe(COLUMN_CANNOT_INSERT_AND_UPDATE.fieldKey);
            expect(columns.get(2).readOnly).toBe(true);
        });

        test('getColumns getInsertColumns', () => {
            const gridModel = new QueryGridModel({ queryInfo: QUERY_INFO });
            const editorModel = new EditorModel({});
            const columns = editorModel.getColumns(gridModel, false, undefined, () => {
                return List([COLUMN_CANNOT_INSERT_AND_UPDATE, COLUMN_CAN_INSERT]);
            });
            expect(columns.size).toBe(2);
            expect(columns.get(0)).toBe(COLUMN_CANNOT_INSERT_AND_UPDATE);
            expect(columns.get(1)).toBe(COLUMN_CAN_INSERT);
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

        test('hasFocus', () => {
            expect(new EditorModel({ focusColIdx: -1, focusRowIdx: -1 }).hasFocus()).toBeFalsy();
            expect(new EditorModel({ focusColIdx: -1, focusRowIdx: 0 }).hasFocus()).toBeFalsy();
            expect(new EditorModel({ focusColIdx: 0, focusRowIdx: -1 }).hasFocus()).toBeFalsy();
            expect(new EditorModel({ focusColIdx: 0, focusRowIdx: 0 }).hasFocus()).toBeTruthy();
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
            expect(new EditorModel({ selectedColIdx: -1, selectedRowIdx: -1 }).hasSelection()).toBeFalsy();
            expect(new EditorModel({ selectedColIdx: -1, selectedRowIdx: 0 }).hasSelection()).toBeFalsy();
            expect(new EditorModel({ selectedColIdx: 0, selectedRowIdx: -1 }).hasSelection()).toBeFalsy();
            expect(new EditorModel({ selectedColIdx: 0, selectedRowIdx: 0 }).hasSelection()).toBeTruthy();
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
            expect(new EditorModel({ selectionCells: Set([]) }).hasMultipleSelection()).toBeFalsy();
            expect(new EditorModel({ selectionCells: Set(['0-0']) }).hasMultipleSelection()).toBeFalsy();
            expect(new EditorModel({ selectionCells: Set(['0-0', '1-1']) }).hasMultipleSelection()).toBeTruthy();
        });

        test('isInBounds', () => {
            const model = new EditorModel({ colCount: 1, rowCount: 1 });
            expect(model.isInBounds(-1, -1)).toBeFalsy();
            expect(model.isInBounds(0, -1)).toBeFalsy();
            expect(model.isInBounds(-1, 0)).toBeFalsy();
            expect(model.isInBounds(0, 0)).toBeTruthy();
            expect(model.isInBounds(0, 1)).toBeFalsy();
            expect(model.isInBounds(1, 0)).toBeFalsy();
            expect(model.isInBounds(1, 1)).toBeFalsy();
        });

        test('inSelection', () => {
            const model = new EditorModel({ selectionCells: Set(['0-0', '1-1']) });
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
            expect(model.hasData()).toBeFalsy();

            model = new EditorModel({
                cellValues: fromJS({
                    '0-0': List([{ raw: ' ' } as ValueDescriptor]),
                }),
            });
            expect(model.hasData()).toBeFalsy();

            model = new EditorModel({
                cellValues: fromJS({
                    '0-0': List([{ raw: 'a' } as ValueDescriptor]),
                }),
            });
            expect(model.hasData()).toBeTruthy();
        });
    });
});
