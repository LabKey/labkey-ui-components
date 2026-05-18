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

import { QueryInfo } from '../../../public/QueryInfo';
import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn } from '../../../public/QueryColumn';

import { getUpdatedData, hasAmountOrUnitChanged, resolveDetailFieldValue } from './utils';

describe('getUpdatedData', () => {
    const originalData = fromJS({
        '448': {
            RowId: {
                value: 448,
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
            },
            Value: {
                value: null,
            },
            Data: {
                value: 'data1',
            },
            'And,./Again': {
                value: 'again',
            },
            Name: {
                value: 'S-20190516-9042',
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
            },
            Other: {
                value: 'other1',
            },
        },
        '447': {
            RowId: {
                value: 447,
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=447',
            },
            Value: {
                value: null,
            },
            Data: {
                value: 'data1',
            },
            'And,./Again': {
                value: 'again',
            },
            Name: {
                value: 'S-20190516-4622',
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=447',
            },
            Other: {
                value: 'other2',
            },
        },
        '446': {
            RowId: {
                value: 446,
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=446',
            },
            Value: {
                value: 'val',
            },
            Data: {
                value: 'data1',
            },
            'And,./Again': {
                value: 'again',
            },
            Name: {
                value: 'S-20190516-2368',
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=446',
            },
            Other: {
                value: 'other3',
            },
        },
        '445': {
            RowId: {
                value: 445,
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=445',
            },
            Value: {
                value: 'val',
            },
            Data: {
                value: 'data1',
            },
            'And,./Again': {
                value: 'again',
            },
            Name: {
                value: 'S-20190516-9512',
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=445',
            },
            Other: {
                value: null,
            },
            StoredAmount: {
                value: 1,
            },
            Units: {
                value: 'mL',
            },
        },
    });

    const queryInfo = new QueryInfo({
        pkCols: ['RowId'],
        columns: new ExtendedMap({
            rowid: new QueryColumn({
                name: 'RowId',
                fieldKey: 'RowId',
            }),
            name: new QueryColumn({
                name: 'Name',
                fieldKey: 'Name',
            }),
            alias: new QueryColumn({
                name: 'Alias',
                fieldKey: 'Alias',
            }),
            data: new QueryColumn({
                name: 'Data',
                fieldKey: 'Data',
            }),
            and$c$d$sagain: new QueryColumn({
                name: 'And,./Again',
                fieldKey: 'And$C$D$SAgain',
            }),
            value: new QueryColumn({
                name: 'Value',
                fieldKey: 'Value',
            }),
            other: new QueryColumn({
                name: 'Other',
                fieldKey: 'Other',
            }),
            intvalue: new QueryColumn({
                name: 'IntValue',
                fieldKey: 'IntValue',
            }),
            storedamount: new QueryColumn({
                name: 'StoredAmount',
                fieldKey: 'StoredAmount',
            }),
            units: new QueryColumn({
                name: 'Units',
                fieldKey: 'Units',
            }),
        }),
    });

    test('empty updates', () => {
        const updatedData = getUpdatedData(originalData, {}, queryInfo);
        expect(updatedData).toHaveLength(0);
    });

    test('updated values did not change', () => {
        const updatedData = getUpdatedData(
            originalData,
            {
                Data: 'data1',
                And$C$D$SAgain: 'again',
            },
            queryInfo
        );
        expect(updatedData).toHaveLength(0);
    });

    test('changed values for some', () => {
        const updatedData = getUpdatedData(
            originalData,
            {
                Value: 'val',
                Data: 'data1',
                And$C$D$SAgain: 'again',
                Other: 'other3',
            },
            queryInfo
        );
        expect(updatedData).toHaveLength(3);
        expect(updatedData[0]).toStrictEqual({
            RowId: 445,
            Other: 'other3',
        });
        expect(updatedData[1]).toStrictEqual({
            RowId: 447,
            Value: 'val',
            Other: 'other3',
        });
        expect(updatedData[2]).toStrictEqual({
            RowId: 448,
            Value: 'val',
            Other: 'other3',
        });
    });

    test('changed value for amount but not units', () => {
        const updatedData = getUpdatedData(
            originalData,
            {
                StoredAmount: 2,
                Units: 'mL',
            },
            queryInfo
        );
        expect(updatedData).toHaveLength(1);
        expect(updatedData[0]).toStrictEqual({
            RowId: 445,
            StoredAmount: 2,
            Units: 'mL',
        });
    });

    test('changed value for units but not amount', () => {
        const updatedData = getUpdatedData(
            originalData,
            {
                StoredAmount: 1,
                Units: 'uL',
            },
            queryInfo
        );
        expect(updatedData).toHaveLength(1);
        expect(updatedData[0]).toStrictEqual({
            RowId: 445,
            StoredAmount: 1,
            Units: 'uL',
        });
    });

    test('changed values for all', () => {
        const updatedData = getUpdatedData(
            originalData,
            {
                Value: 'val2',
                Data: 'data2',
                And$C$D$SAgain: 'again2',
                Other: 'not another',
            },
            queryInfo
        );
        expect(updatedData).toHaveLength(4);
        expect(updatedData[0]).toStrictEqual({
            RowId: 445,
            Value: 'val2',
            Data: 'data2',
            'And,./Again': 'again2',
            Other: 'not another',
        });
        expect(updatedData[1]).toStrictEqual({
            RowId: 446,
            Value: 'val2',
            Data: 'data2',
            'And,./Again': 'again2',
            Other: 'not another',
        });
        expect(updatedData[2]).toStrictEqual({
            RowId: 447,
            Value: 'val2',
            Data: 'data2',
            'And,./Again': 'again2',
            Other: 'not another',
        });
        expect(updatedData[3]).toStrictEqual({
            RowId: 448,
            Value: 'val2',
            Data: 'data2',
            'And,./Again': 'again2',
            Other: 'not another',
        });
    });

    test('removed values', () => {
        const updatedData = getUpdatedData(
            originalData,
            {
                Value: null,
                And$C$D$SAgain: undefined,
                Other: 'not another',
            },
            queryInfo
        );
        expect(updatedData).toHaveLength(4);
        expect(updatedData[0]).toStrictEqual({
            RowId: 445,
            Value: null,
            'And,./Again': null,
            Other: 'not another',
        });
        expect(updatedData[1]).toStrictEqual({
            RowId: 446,
            Value: null,
            'And,./Again': null,
            Other: 'not another',
        });
        expect(updatedData[2]).toStrictEqual({
            RowId: 447,
            'And,./Again': null,
            Other: 'not another',
        });
        expect(updatedData[3]).toStrictEqual({
            RowId: 448,
            'And,./Again': null,
            Other: 'not another',
        });
    });

    test('same int value with string', () => {
        const originalData = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                IntValue: {
                    value: 123,
                },
            },
        });
        const updatedData = getUpdatedData(
            originalData,
            {
                IntValue: '123',
            },
            queryInfo
        );
        expect(updatedData).toHaveLength(0);
    });

    test('different int value with string', () => {
        const originalData = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                IntValue: {
                    value: 123,
                },
            },
        });
        const updatedData = getUpdatedData(
            originalData,
            {
                IntValue: '234',
            },
            queryInfo
        );
        expect(updatedData).toHaveLength(1);
        expect(updatedData[0]).toStrictEqual({
            RowId: 448,
            IntValue: '234',
        });
    });

    test('Update multi value by displayValue', () => {
        const originalData = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Alias: List<string>([
                    Map<string, number>({ displayValue: 'alias1', value: 1 }),
                    Map<string, number>({ displayValue: 'alias2', value: 2 }),
                ]),
            },
        });

        const updatedData = getUpdatedData(
            originalData,
            {
                Alias: ['alias3'],
            },
            queryInfo
        );
        expect(updatedData).toHaveLength(1);
        expect(updatedData[0]).toStrictEqual({
            RowId: 448,
            Alias: ['alias3'],
        });
    });

    test('Update multi value by value', () => {
        const originalData = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Alias: List<string>([
                    Map<string, number>({ displayValue: 'alias1', value: 1 }),
                    Map<string, number>({ displayValue: 'alias2', value: 2 }),
                ]),
            },
        });

        const updatedData = getUpdatedData(
            originalData,
            {
                Alias: [2],
            },
            queryInfo
        );
        expect(updatedData).toHaveLength(1);
        expect(updatedData[0]).toStrictEqual({
            RowId: 448,
            Alias: ['alias2'],
        });
    });

    test('Delete multi value', () => {
        const originalData = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Alias: List<string>([
                    Map<string, number>({ displayValue: 'alias1', value: 1 }),
                    Map<string, number>({ displayValue: 'alias2', value: 2 }),
                ]),
            },
        });

        const updatedData = getUpdatedData(
            originalData,
            {
                Alias: [],
            },
            queryInfo
        );
        expect(updatedData).toHaveLength(1);
        expect(updatedData[0]).toStrictEqual({
            RowId: 448,
            Alias: [],
        });
    });

    test('with folder', () => {
        const originalData_ = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Value: {
                    value: null,
                },
                Data: {
                    value: 'data1',
                },
                'And,./Again': {
                    value: 'again',
                },
                Name: {
                    value: 'S-20190516-9042',
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Other: {
                    value: 'other1',
                },
                Folder: {
                    displayValue: 'ProjectA',
                    value: 'ENTITYID-A',
                },
            },
        });

        const updatedData = getUpdatedData(
            originalData_,
            {
                Value: 'val',
                And$C$D$SAgain: 'again',
                Other: 'other3',
            },
            queryInfo
        );
        expect(updatedData[0]).toStrictEqual({
            RowId: 448,
            Value: 'val',
            Other: 'other3',
            Folder: 'ENTITYID-A',
        });
    });

    test('with container', () => {
        const originalData_ = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Value: {
                    value: null,
                },
                Data: {
                    value: 'data1',
                },
                'And,./Again': {
                    value: 'again',
                },
                Name: {
                    value: 'S-20190516-9042',
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Other: {
                    value: 'other1',
                },
                Container: {
                    displayValue: 'ProjectA',
                    value: 'ENTITYID-A',
                },
            },
        });

        const updatedData = getUpdatedData(
            originalData_,
            {
                Value: 'val',
                And$C$D$SAgain: 'again changed',
                Other: 'other3',
            },
            queryInfo
        );
        expect(updatedData[0]).toStrictEqual({
            RowId: 448,
            Value: 'val',
            'And,./Again': 'again changed',
            Other: 'other3',
            Container: 'ENTITYID-A',
        });
    });
});

describe('hasAmountOrUnitChanged', () => {
    test('updated amount', () => {
        const originalRowMap = fromJS({ StoredAmount: { value: 5 }, Units: { value: 'mg' } });
        expect(hasAmountOrUnitChanged(Map({ Amount: 10, Units: 'mg' }), originalRowMap)).toBe(false);
        expect(hasAmountOrUnitChanged(Map({ StoredAmount: 5, Units: 'mg' }), originalRowMap)).toBe(false);
        expect(hasAmountOrUnitChanged(Map({ StoredAmount: 5.1, Units: 'mg' }), originalRowMap)).toBe(true);
        expect(hasAmountOrUnitChanged(Map({ StoredAmount: 10, Units: 'mg' }), originalRowMap)).toBe(true);
        expect(hasAmountOrUnitChanged(Map({ StoredAmount: null, Units: 'mg' }), originalRowMap)).toBe(true);
        expect(hasAmountOrUnitChanged(Map({ StoredAmount: undefined, Units: 'mg' }), originalRowMap)).toBe(true);
    });

    test('updated unit', () => {
        const originalRowMap = fromJS({ StoredAmount: { value: 5 }, Units: { value: 'mg' } });
        expect(hasAmountOrUnitChanged(Map({ StoredAmount: 5, RawUnits: 'mg' }), originalRowMap)).toBe(false);
        expect(hasAmountOrUnitChanged(Map({ StoredAmount: 5, Units: 'mg' }), originalRowMap)).toBe(false);
        expect(hasAmountOrUnitChanged(Map({ StoredAmount: 5, Units: 'g' }), originalRowMap)).toBe(true);
        expect(hasAmountOrUnitChanged(Map({ StoredAmount: 5, Units: null }), originalRowMap)).toBe(true);
        expect(hasAmountOrUnitChanged(Map({ StoredAmount: 5, Units: undefined }), originalRowMap)).toBe(true);
    });
});

describe('resolveDetailFieldValue', () => {
    test('data value undefined', () => {
        expect(resolveDetailFieldValue(undefined)).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: undefined }))).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: undefined, displayValue: undefined }))).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: null, displayValue: null }))).toBe(undefined);
    });

    test('data value defined', () => {
        expect(resolveDetailFieldValue(fromJS({ value: 'test1', displayValue: undefined }))).toBe('test1');
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }))).toBe('test1');
        expect(resolveDetailFieldValue(fromJS({ value: 'test1', displayValue: 'Test Display' }))).toBe('test1');
    });

    test('resolveDisplayValue prop', () => {
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: undefined, formattedValue: 'Formatted Test 1' }),
                true
            )
        ).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }), true)).toBe('test1');
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: 'Test Display', formattedValue: 'Test Formatted' }),
                true
            )
        ).toBe('Test Display');

        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: undefined, formattedValue: undefined }),
                false
            )
        ).toBe('test1');
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }), false)).toBe('test1');
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: 'Test Display', formattedValue: 'Test Formatted' }),
                false
            )
        ).toBe('test1');
    });

    test('resolveFormattedValue prop', () => {
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: undefined, formattedValue: undefined }),
                undefined,
                true
            )
        ).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }), undefined, true)).toBe('test1');
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: 'Test Display', formattedValue: 'Test Formatted' }),
                undefined,
                true
            )
        ).toBe('Test Formatted');

        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: undefined, formattedValue: undefined }),
                undefined,
                false
            )
        ).toBe('test1');
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }), undefined, false)).toBe('test1');
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: 'Test Display', formattedValue: 'Test Formatted' }),
                undefined,
                false
            )
        ).toBe('test1');
    });
});
