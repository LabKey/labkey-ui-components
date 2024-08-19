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

import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';

import { STORAGE_UNIQUE_ID_CONCEPT_URI } from '../domainproperties/constants';

import { EditorModel, ValueDescriptor } from './models';
import { applyEditorModelChanges, genCellKey } from './utils';

const COLUMN_CAN_INSERT_AND_UPDATE = new QueryColumn({
    caption: 'Both',
    fieldKey: 'both',
    fieldKeyArray: ['both'],
    shownInInsertView: true,
    shownInUpdateView: true,
    userEditable: true,
    readOnly: false,
    required: true,
});
const COLUMN_CAN_INSERT = new QueryColumn({
    caption: 'Insert',
    fieldKey: 'insert',
    fieldKeyArray: ['insert'],
    shownInInsertView: true,
    shownInUpdateView: false,
    userEditable: true,
    readOnly: false,
    required: true,
});
const COLUMN_CAN_UPDATE = new QueryColumn({
    caption: 'Update',
    fieldKey: 'update',
    fieldKeyArray: ['update'],
    shownInInsertView: false,
    shownInUpdateView: true,
    userEditable: true,
    readOnly: false,
});
const COLUMN_CANNOT_INSERT_AND_UPDATE = new QueryColumn({
    caption: 'Neither',
    fieldKey: 'neither',
    fieldKeyArray: ['neither'],
    shownInInsertView: false,
    shownInUpdateView: false,
    userEditable: true,
    readOnly: false,
});
const COLUMN_BARCODE = new QueryColumn({
    name: 'Barcode',
    fieldKey: 'Barcode',
    fieldKeyArray: ['Barcode'],
    shownInInsertView: true,
    userEditable: true,
    required: true,
    conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
});

const QUERY_INFO = QueryInfo.fromJsonForTests({
    columns: {
        both: COLUMN_CAN_INSERT_AND_UPDATE,
        insert: COLUMN_CAN_INSERT,
        update: COLUMN_CAN_UPDATE,
        neither: COLUMN_CANNOT_INSERT_AND_UPDATE,
    },
});

const orderedColumns = fromJS(QUERY_INFO.columns.mapValues(col => col.fieldKey.toLowerCase()).sort());
const columnMap = fromJS(
    QUERY_INFO.columns.reduce((result, col, key) => {
        result[key] = col;
        return result;
    }, {})
);
const colOneFk = orderedColumns.get(0);
const colOneCaption = columnMap.get(colOneFk).caption;
const colTwoFk = orderedColumns.get(1);
const colTwoCaption = columnMap.get(colTwoFk).caption;
const basicCellValues = fromJS({
    [genCellKey(colOneFk, 0)]: List([{ display: 'A', raw: 'a' } as ValueDescriptor]),
    [genCellKey(colOneFk, 1)]: List([{ display: 'AA', raw: 'aa' } as ValueDescriptor]),
    [genCellKey(colTwoFk, 0)]: List([{ display: 'B', raw: 'b' } as ValueDescriptor]),
    [genCellKey(colTwoFk, 1)]: List([{ display: 'BB', raw: 'bb' } as ValueDescriptor]),
});
const basicEditorModel = new EditorModel({
    cellMessages: fromJS({
        [genCellKey(colOneFk, 0)]: 'a',
        [genCellKey(colTwoFk, 1)]: 'b',
    }),
    cellValues: basicCellValues,
    columnMap,
    orderedColumns,
    queryInfo: QUERY_INFO,
    rowCount: 2,
});

function modifyEm(changes: Partial<EditorModel>, em?: EditorModel): EditorModel {
    const models = [em ?? basicEditorModel];
    return applyEditorModelChanges(models, changes)[0];
}

describe('EditorModel', () => {
    const queryInfo = QueryInfo.fromJsonForTests(sampleSet2QueryInfo);

    describe('data validation', () => {
        test('no data', () => {
            const editorModel = modifyEm({ cellValues: fromJS({}), rowCount: 0 });
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(colOneFk);
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.isEmpty()).toBe(true);
            const errors = editorModel.getValidationErrors('Name');
            expect(errors.errors).toHaveLength(0);
        });

        test('valid data', () => {
            const { uniqueKeyViolations, missingRequired } = basicEditorModel.validateData(colOneFk);
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.isEmpty()).toBe(true);
            const errors = basicEditorModel.getValidationErrors('Name');
            expect(errors.errors).toHaveLength(0);
        });

        test('missing required data', () => {
            const model = modifyEm({
                cellMessages: fromJS({}),
                cellValues: fromJS({
                    [genCellKey(colOneFk, 0)]: List([]),
                    [genCellKey(colOneFk, 1)]: List([{ display: 'A', raw: 'a' } as ValueDescriptor]),
                    [genCellKey(colOneFk, 2)]: List([{ display: '    ', raw: '    ' } as ValueDescriptor]),
                    [genCellKey(colOneFk, 3)]: List([{ display: '4', raw: 4 } as ValueDescriptor]),
                    [genCellKey(colTwoFk, 0)]: List([{ display: 'asdf', raw: 'asdf' } as ValueDescriptor]),
                    [genCellKey(colTwoFk, 1)]: List([]),
                    [genCellKey(colTwoFk, 2)]: List([{ display: 'asdf', raw: 'asdf' } as ValueDescriptor]),
                    [genCellKey(colTwoFk, 3)]: List([{ display: 'asdf', raw: 'asdf' } as ValueDescriptor]),
                }),
                rowCount: 4,
            });
            const { uniqueKeyViolations, missingRequired } = model.validateData(colOneFk);
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.size).toBe(2);
            expect(missingRequired.has(colOneCaption)).toBe(true);
            expect(missingRequired.get(colOneCaption).size).toBe(2);
            expect(missingRequired.get(colOneCaption).contains(1)).toBe(true);
            expect(missingRequired.get(colOneCaption).contains(3)).toBe(true); // Check whitespace trimmed
            expect(missingRequired.get(colOneCaption).contains(4)).toBe(false); // Check integer
            const errors = model.getValidationErrors(colOneFk);
            expect(errors.cellMessages.toJS()).toStrictEqual({
                [genCellKey(colOneFk, 0)]: {
                    message: `${colOneCaption} is required.`,
                },
                [genCellKey(colOneFk, 2)]: {
                    message: `${colOneCaption} is required.`,
                },
                [genCellKey(colTwoFk, 1)]: {
                    message: `${colTwoCaption} is required.`,
                },
            });
            expect(errors.errors).toEqual([
                `${colOneCaption} is missing from rows 1, 3. ${colTwoCaption} is missing from row 2.`,
            ]);
        });

        test('generated unique id not counted for missing required check', () => {
            const editorModel = modifyEm({
                cellValues: fromJS({
                    [genCellKey('barcode', 0)]: List([{ display: null, raw: null }]),
                }),
                columnMap: fromJS({ barcode: COLUMN_BARCODE }),
                orderedColumns: fromJS(['barcode']),
                rowCount: 1,
            });
            const { missingRequired } = editorModel.validateData('Barcode');
            expect(missingRequired.size).toBe(0);
        });

        test('unique key violations', () => {
            const editorModel = modifyEm({
                orderedColumns: fromJS([colOneFk.toLowerCase()]),
                columnMap: fromJS({ [colOneFk.toLowerCase()]: COLUMN_CAN_INSERT_AND_UPDATE }),
                cellValues: fromJS({
                    [genCellKey(colOneFk, 0)]: List([{ display: 'A', raw: 'a' } as ValueDescriptor]),
                    [genCellKey(colOneFk, 1)]: List([{ display: 'A', raw: 'a' } as ValueDescriptor]),
                    [genCellKey(colOneFk, 2)]: List([
                        { display: 'caseInSenSiTive', raw: 'caseInSenSiTive' } as ValueDescriptor,
                    ]),
                    [genCellKey(colOneFk, 3)]: List([
                        { display: 'CaseInsensItive', raw: 'CaseInsensItive' } as ValueDescriptor,
                    ]),
                    [genCellKey(colOneFk, 4)]: List([
                        { display: ' spaceDupe ', raw: ' spaceDupe \n' } as ValueDescriptor,
                    ]),
                    [genCellKey(colOneFk, 5)]: List([{ display: 'spaceDupe', raw: '\tspaceDupe' } as ValueDescriptor]),
                }),
                rowCount: 6,
            });
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(colOneFk);
            expect(missingRequired.isEmpty()).toBe(true);
            expect(uniqueKeyViolations.size).toBe(1);
            expect(uniqueKeyViolations.has(colOneCaption)).toBe(true);
            expect(uniqueKeyViolations.get(colOneCaption).size).toBe(3);
            expect(uniqueKeyViolations.get(colOneCaption).has('a')).toBe(true);
            expect(uniqueKeyViolations.get(colOneCaption).get('a')).toEqual(List<number>([1, 2]));
            expect(uniqueKeyViolations.get(colOneCaption).has('caseinsensitive')).toBe(true);
            expect(uniqueKeyViolations.get(colOneCaption).get('caseinsensitive')).toEqual(List<number>([3, 4]));
            expect(uniqueKeyViolations.get(colOneCaption).has('spacedupe')).toBe(true);
            expect(uniqueKeyViolations.get(colOneCaption).get('spacedupe')).toEqual(List<number>([5, 6]));
            const errors = editorModel.getValidationErrors(colOneFk);
            expect(errors.errors).toEqual([
                `Duplicate value (a) for ${colOneCaption} on rows 1, 2.`,
                `Duplicate value (caseinsensitive) for ${colOneCaption} on rows 3, 4.`,
                `Duplicate value (spacedupe) for ${colOneCaption} on rows 5, 6.`,
            ]);
        });

        test('missing required and unique key violations', () => {
            const editorModel = modifyEm({
                cellMessages: fromJS({}),
                cellValues: fromJS({
                    [genCellKey(colOneFk, 0)]: List([{ display: null, raw: null } as ValueDescriptor]),
                    [genCellKey(colOneFk, 1)]: List([{ display: 'A', raw: 'a' } as ValueDescriptor]),
                    [genCellKey(colOneFk, 2)]: List([
                        { display: 'caseInSenSiTive', raw: 'caseInSenSiTive' } as ValueDescriptor,
                    ]),
                    [genCellKey(colOneFk, 3)]: List([
                        { display: 'CaseInsensItive', raw: 'CaseInsensItive' } as ValueDescriptor,
                    ]),
                }),
                columnMap: fromJS({ [colOneFk.toLowerCase()]: COLUMN_CAN_INSERT_AND_UPDATE }),
                orderedColumns: fromJS([colOneFk.toLowerCase()]),
                rowCount: 4,
            });
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(colOneFk);
            expect(missingRequired.size).toBe(1);
            expect(missingRequired.has(colOneCaption)).toBe(true);
            expect(missingRequired.get(colOneCaption).size).toBe(1);
            expect(missingRequired.get(colOneCaption).contains(1)).toBe(true);

            expect(uniqueKeyViolations.size).toBe(1);
            expect(uniqueKeyViolations.has(colOneCaption)).toBe(true);
            expect(uniqueKeyViolations.get(colOneCaption).size).toBe(1);
            expect(uniqueKeyViolations.get(colOneCaption).has('caseinsensitive')).toBe(true);
            expect(uniqueKeyViolations.get(colOneCaption).get('caseinsensitive')).toEqual(List<number>([3, 4]));
            const errors = editorModel.getValidationErrors(colOneFk);
            expect(errors.errors).toEqual([
                `Duplicate value (caseinsensitive) for ${colOneCaption} on rows 3, 4.`,
                `${colOneCaption} is missing from row 1.`,
            ]);
            expect(errors.cellMessages.toJS()).toStrictEqual({
                [genCellKey(colOneFk, 0)]: { message: `${colOneCaption} is required.` },
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
            expect(basicEditorModel.getMessage(colOneFk, 0)).toBe('a');
            expect(basicEditorModel.getMessage(colTwoFk, 0)).toBe(undefined);
            expect(basicEditorModel.getMessage(colOneFk, 1)).toBe(undefined);
            expect(basicEditorModel.getMessage(colTwoFk, 1)).toBe('b');
        });

        test('getValue', () => {
            expect(basicEditorModel.getValue(colOneFk, 0).size).toBe(1);
            expect(basicEditorModel.getValue(colOneFk, 0).get(0).raw).toBe('a');
            expect(basicEditorModel.getValue(colOneFk, 1).size).toBe(1);
            expect(basicEditorModel.getValue(colOneFk, 1).get(0).raw).toBe('aa');

            expect(basicEditorModel.getValue(colTwoFk, 0).size).toBe(1);
            expect(basicEditorModel.getValue(colTwoFk, 0).get(0).raw).toBe('b');
            expect(basicEditorModel.getValue(colTwoFk, 1).size).toBe(1);
            expect(basicEditorModel.getValue(colTwoFk, 1).get(0).raw).toBe('bb');

            expect(basicEditorModel.getValue(colOneFk, 2).size).toBe(0);
        });

        test('getValueForCellKey', () => {
            const model = new EditorModel({
                cellValues: basicCellValues,
            });
            expect(model.getValueForCellKey(genCellKey(colOneFk, 0)).size).toBe(1);
            expect(model.getValueForCellKey(genCellKey(colOneFk, 0)).get(0).raw).toBe('a');
            expect(model.getValueForCellKey(genCellKey(colOneFk, 1)).size).toBe(1);
            expect(model.getValueForCellKey(genCellKey(colOneFk, 1)).get(0).raw).toBe('aa');

            expect(model.getValueForCellKey(genCellKey(colTwoFk, 0)).size).toBe(1);
            expect(model.getValueForCellKey(genCellKey(colTwoFk, 0)).get(0).raw).toBe('b');
            expect(model.getValueForCellKey(genCellKey(colTwoFk, 1)).size).toBe(1);
            expect(model.getValueForCellKey(genCellKey(colTwoFk, 1)).get(0).raw).toBe('bb');

            expect(basicEditorModel.getValueForCellKey(genCellKey(colOneFk, 2)).size).toBe(0);
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
            expect(modifyEm({ selectedColIdx: -1, selectedRowIdx: -1 }).selectionKey).toBe(undefined);
            expect(modifyEm({ selectedColIdx: -1, selectedRowIdx: 0 }).selectionKey).toBe(undefined);
            expect(modifyEm({ selectedColIdx: 0, selectedRowIdx: -1 }).selectionKey).toBe(undefined);
            expect(modifyEm({ selectedColIdx: 0, selectedRowIdx: 0 }).selectionKey).toBe(genCellKey(colOneFk, 0));
            expect(modifyEm({ selectedColIdx: 0, selectedRowIdx: 1 }).selectionKey).toBe(genCellKey(colOneFk, 1));
            expect(modifyEm({ selectedColIdx: 1, selectedRowIdx: 0 }).selectionKey).toBe(genCellKey(colTwoFk, 0));
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
            expect(modifyEm({ selectionCells: [] }).isMultiSelect).toBeFalsy();
            expect(modifyEm({ selectionCells: [genCellKey(colOneFk, 0)] }).isMultiSelect).toBeFalsy();
            expect(
                modifyEm({ selectionCells: [genCellKey(colOneFk, 0), genCellKey(colTwoFk, 1)] }).isMultiSelect
            ).toBeTruthy();
        });

        test('isMultiColumnSelection', () => {
            expect(modifyEm({ selectionCells: [] }).isMultiColumnSelection).toBeFalsy();
            expect(modifyEm({ selectionCells: [genCellKey(colOneFk, 0)] }).isMultiColumnSelection).toBeFalsy();
            expect(
                modifyEm({ selectionCells: [genCellKey(colOneFk, 0), genCellKey(colOneFk, 1)] }).isMultiColumnSelection
            ).toBeFalsy();
            expect(
                modifyEm({ selectionCells: [genCellKey(colOneFk, 0), genCellKey(colTwoFk, 1)] }).isMultiColumnSelection
            ).toBeTruthy();
        });

        test('lastSelection', () => {
            // No selection is falsy
            expect(basicEditorModel.lastSelection(colOneFk, 0)).toBeFalsy();
            expect(basicEditorModel.lastSelection(colOneFk, 1)).toBeFalsy();
            expect(basicEditorModel.lastSelection(colTwoFk, 0)).toBeFalsy();
            expect(basicEditorModel.lastSelection(colTwoFk, 1)).toBeFalsy();

            // Single Cell checks against selectionKey and not selectionCells
            const singleCellSel = modifyEm({
                selectionCells: [],
                selectedColIdx: 0,
                selectedRowIdx: 0,
                rowCount: 100,
            });
            expect(singleCellSel.lastSelection(colOneFk, 0)).toBeTruthy();
            expect(singleCellSel.lastSelection(colOneFk, 1)).toBeFalsy();
            expect(singleCellSel.lastSelection(colTwoFk, 0)).toBeFalsy();

            // Multiple Cell selection checks against selectionCells
            const multiCellSel = modifyEm({
                selectionCells: [
                    genCellKey(colOneFk, 0),
                    genCellKey(colTwoFk, 0),
                    genCellKey(colOneFk, 1),
                    genCellKey(colTwoFk, 1),
                ],
                rowCount: 100,
            });
            expect(multiCellSel.lastSelection(colOneFk, 0)).toBeFalsy();
            expect(multiCellSel.lastSelection(colTwoFk, 1)).toBeTruthy();
        });

        test('isInBounds', () => {
            const model = modifyEm({ orderedColumns: List([colOneFk]), rowCount: 1 });
            expect(model.isInBounds(-1, -1)).toBeFalsy();
            expect(model.isInBounds(0, -1)).toBeFalsy();
            expect(model.isInBounds(-1, 0)).toBeFalsy();
            expect(model.isInBounds(0, 0)).toBeTruthy();
            expect(model.isInBounds(0, 1)).toBeFalsy();
            expect(model.isInBounds(1, 0)).toBeFalsy();
            expect(model.isInBounds(1, 1)).toBeFalsy();
        });

        test('inSelection', () => {
            const model = modifyEm({ selectionCells: [genCellKey(colOneFk, 0), genCellKey(colTwoFk, 1)] });
            expect(model.inSelection('invalid', -1)).toBeFalsy();
            expect(model.inSelection(colOneFk, -1)).toBeFalsy();
            expect(model.inSelection('invalid', 0)).toBeFalsy();
            expect(model.inSelection(colOneFk, 0)).toBeTruthy();
            expect(model.inSelection(colOneFk, 1)).toBeFalsy();
            expect(model.inSelection(colTwoFk, 0)).toBeFalsy();
            expect(model.inSelection(colTwoFk, 1)).toBeTruthy();
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
            let model = modifyEm({
                cellValues: fromJS({
                    [genCellKey(colOneFk, 0)]: List([{} as ValueDescriptor]),
                }),
            });
            expect(model.hasData).toBeFalsy();

            model = modifyEm({
                cellValues: fromJS({
                    [genCellKey(colOneFk, 0)]: List([{ raw: ' ' } as ValueDescriptor]),
                }),
            });
            expect(model.hasData).toBeFalsy();

            model = modifyEm({
                cellValues: fromJS({
                    [genCellKey(colOneFk, 0)]: List([{ raw: 'a' } as ValueDescriptor]),
                }),
            });
            expect(model.hasData).toBeTruthy();
        });

        test('getPkValues', () => {
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
            const cellValues = fromJS({
                [genCellKey('RowId', 0)]: List([{ raw: 1 } as ValueDescriptor]),
                [genCellKey('lsid', 0)]: List([{ raw: 'abc' } as ValueDescriptor]),
            });
            let model = new EditorModel({
                queryInfo,
                cellValues,
            });
            expect(model.getPkValues(0)).toStrictEqual({ RowId: 1 });

            model = new EditorModel({
                queryInfo: queryInfoWithAltKey,
                cellValues,
            });
            expect(model.getPkValues(0)).toStrictEqual({ RowId: 1, lsid: 'abc' });
        });
    });
});
