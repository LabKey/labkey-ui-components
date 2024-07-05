import { fromJS, List, Map } from 'immutable';

import { ExtendedMap } from '../../../public/ExtendedMap';

import { LoadingState } from '../../../public/LoadingState';

import { ASSAY_WIZARD_MODEL } from '../../../test/data/constants';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';

import { QueryInfo } from '../../../public/QueryInfo';

import { QueryColumn } from '../../../public/QueryColumn';
import { BOOLEAN_TYPE, DATE_TYPE, INTEGER_TYPE, TEXT_TYPE, TIME_TYPE } from '../domainproperties/PropDescType';

import { DATE_RANGE_URI } from '../domainproperties/constants';

import { initEditableGridModel } from './actions';
import { EditorMode, EditorModel, EditableGridLoader } from './models';
import {
    computeRangeChange,
    genCellKey,
    getUpdatedDataFromGrid,
    getValidatedEditableGridValue,
    parseCellKey,
    sortCellKeys,
} from './utils';

class MockEditableGridLoader implements EditableGridLoader {
    columns: QueryColumn[];
    id: string;
    mode = EditorMode.Insert;
    queryInfo: QueryInfo;

    constructor(queryInfo: QueryInfo, props?: Partial<EditableGridLoader>) {
        this.queryInfo = queryInfo;
        this.columns = props?.columns;
        this.id = props?.id ?? 'mockEditableGridLoader';
        this.mode = props?.mode;
    }

    fetch = jest.fn().mockResolvedValue({
        data: Map(),
        dataIds: List(),
    });
}

describe('Editable Grids Utils', () => {
    describe('initEditableGridModel', () => {
        const { queryInfo } = ASSAY_WIZARD_MODEL;
        const dataModel = makeTestQueryModel(queryInfo.schemaQuery, queryInfo);

        test('defaults to insert columns', async () => {
            const loader = new MockEditableGridLoader(queryInfo);
            const editorModel = new EditorModel({});
            const expectedInsertColumns = queryInfo.getInsertColumns().map(col => col.fieldKey);
            const models = await initEditableGridModel(dataModel, editorModel, loader, dataModel);
            expect(models.dataModel.queryInfoLoadingState).toEqual(LoadingState.LOADED);
            expect(models.dataModel.rowsLoadingState).toEqual(LoadingState.LOADED);
            expect(models.editorModel.cellValues.size).toEqual(0);
            expect(models.editorModel.columns.toArray()).toEqual(expectedInsertColumns);
        });

        test('respects loader mode for columns', async () => {
            const loader = new MockEditableGridLoader(queryInfo, { mode: EditorMode.Update });
            const editorModel = new EditorModel({});
            const expectedUpdateColumns = queryInfo.getUpdateColumns().map(col => col.fieldKey);
            const models = await initEditableGridModel(dataModel, editorModel, loader, dataModel);
            expect(models.editorModel.columns.toArray()).toEqual(expectedUpdateColumns);
        });

        test('respects loader supplied columns', async () => {
            const columns = [queryInfo.getColumn('SampleID'), queryInfo.getColumn('Date')];
            const loader = new MockEditableGridLoader(queryInfo, { columns });
            const editorModel = new EditorModel({});

            const models = await initEditableGridModel(dataModel, editorModel, loader, dataModel);
            expect(models.editorModel.columns.toArray()).toEqual(columns.map(col => col.fieldKey));
        });
    });
});

describe('getUpdatedDataFromGrid', () => {
    const cols = new ExtendedMap<string, QueryColumn>({
        rowid: new QueryColumn({ name: 'RowId', rangeURI: INTEGER_TYPE.rangeURI }),
        value: new QueryColumn({ name: 'Value', rangeURI: INTEGER_TYPE.rangeURI }),
        data: new QueryColumn({ name: 'Data', rangeURI: TEXT_TYPE.rangeURI }),
        andagain: new QueryColumn({ name: 'AndAgain', rangeURI: TEXT_TYPE.rangeURI }),
        name: new QueryColumn({ name: 'Name', rangeURI: TEXT_TYPE.rangeURI }),
        other: new QueryColumn({ name: 'Other', rangeURI: TEXT_TYPE.rangeURI }),
        bool: new QueryColumn({ name: 'Bool', rangeURI: BOOLEAN_TYPE.rangeURI }),
        int: new QueryColumn({ name: 'Int', rangeURI: INTEGER_TYPE.rangeURI }),
        date: new QueryColumn({ name: 'Date', rangeURI: DATE_TYPE.rangeURI }),
        time: new QueryColumn({ name: 'Time', rangeURI: TIME_TYPE.rangeURI }),
    });
    const queryInfo = new QueryInfo({
        columns: cols,
    });
    const queryInfoWithAltPK = new QueryInfo({
        columns: cols,
        altUpdateKeys: new Set<string>(['Data']),
    });
    const originalData = fromJS({
        448: {
            RowId: 448,
            Value: null,
            Data: 'data1',
            AndAgain: 'again',
            Name: 'S-20190516-9042',
            Other: 'other1',
            Bool: true,
            Int: 0,
            Date: '2020-12-23 14:34',
            Time: '01:10:00',
        },
        447: {
            RowId: 447,
            Value: null,
            Data: 'data1',
            AndAgain: 'again',
            Name: 'S-20190516-4622',
            Other: 'other2',
            Bool: false,
            Int: 7,
            Date: null,
            Time: null,
        },
        446: {
            RowId: 446,
            Value: 'val',
            Data: 'data1',
            AndAgain: 'again',
            Name: 'S-20190516-2368',
            Other: 'other3',
            Bool: true,
            Int: 6,
            Date: '1922-08-21 00:00',
            Time: '03:30:00',
        },
        445: {
            RowId: 445,
            Value: 'val',
            Data: 'data1',
            AndAgain: 'again',
            Name: 'S-20190516-9512',
            Other: null,
            Bool: false,
            Int: 5,
            Date: null,
            Time: null,
        },
    });

    test('no edited rows', () => {
        const updatedData = getUpdatedDataFromGrid(originalData, [], 'RowId', queryInfo);
        expect(updatedData).toHaveLength(0);
    });

    test('edited row with array', () => {
        const orig = fromJS({
            448: {
                RowId: 448,
                Alias: undefined,
            },
        });

        let updatedData = getUpdatedDataFromGrid(
            orig,
            [
                Map<string, any>({
                    RowId: '448',
                    Alias: [],
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData).toHaveLength(0);

        updatedData = getUpdatedDataFromGrid(
            orig,
            [
                Map<string, any>({
                    RowId: '448',
                    Alias: ['test1'],
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData).toHaveLength(1);
    });

    test('edited rows did not change', () => {
        const updatedData = getUpdatedDataFromGrid(
            originalData,
            [
                Map<string, any>({
                    RowId: '448',
                    Value: null,
                    Data: 'data1',
                    AndAgain: 'again',
                    Name: 'S-20190516-9042',
                    Other: 'other1',
                    Bool: true,
                    Int: 0,
                    Date: '2020-12-23 14:34',
                    Time: '01:10:00',
                }),
                Map<string, any>({
                    RowId: '447',
                    Value: '',
                    Data: 'data1',
                    AndAgain: 'again',
                    Name: 'S-20190516-4622',
                    Other: 'other2',
                    Bool: false,
                    Int: '7',
                    Date: null,
                    Time: null,
                }),
                Map<string, any>({
                    RowId: '446',
                    Value: 'val',
                    Data: 'data1',
                    AndAgain: 'again',
                    Name: 'S-20190516-2368',
                    Other: 'other3',
                    Bool: true,
                    Int: '6',
                    Date: '1922-08-21 00:00',
                    Time: '03:30:00',
                }),
                Map<string, any>({
                    RowId: '445',
                    Value: 'val',
                    Data: 'data1',
                    AndAgain: 'again',
                    Name: 'S-20190516-9512',
                    Other: null,
                    Bool: false,
                    Int: 5,
                    Date: null,
                    Time: null,
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData).toHaveLength(0);
    });

    test('edited row removed values', () => {
        const updatedData = getUpdatedDataFromGrid(
            originalData,
            [
                Map<string, any>({
                    RowId: '448',
                    Value: null,
                    Data: undefined,
                    AndAgain: 'again',
                    Name: 'S-20190516-9042',
                    Other: 'other1',
                    Bool: undefined,
                    Int: undefined,
                    Date: null,
                    Time: null,
                }),
                Map<string, any>({
                    RowId: '447',
                    Value: null,
                    Data: 'data1',
                    AndAgain: null,
                    Name: 'S-20190516-4622',
                    Other: 'other2',
                    Bool: undefined,
                    Int: undefined,
                    Date: null,
                    Time: null,
                }),
                Map<string, any>({
                    RowId: '446',
                    Value: 'val',
                    Data: 'data1',
                    AndAgain: 'again',
                    Name: 'S-20190516-2368',
                    Other: 'other3',
                    Bool: true,
                    Int: 6,
                    Date: '1922-08-21 00:00',
                    Time: '03:30:00',
                }),
                Map<string, any>({
                    RowId: '445',
                    Value: 'val',
                    Data: 'data1',
                    AndAgain: 'again',
                    Name: 'S-20190516-9512',
                    Other: null,
                    Bool: false,
                    Int: 5,
                    Date: null,
                    Time: null,
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData).toHaveLength(2);
        expect(updatedData[0]).toStrictEqual({
            Int: null,
            Bool: null,
            Data: null,
            Date: null,
            Time: null,
            RowId: '448',
        });
        expect(updatedData[1]).toStrictEqual({
            Int: null,
            Bool: null,
            AndAgain: null,
            RowId: '447',
        });
    });

    test('edited row changed some values', () => {
        const updatedData = getUpdatedDataFromGrid(
            originalData,
            [
                Map<string, any>({
                    RowId: '448',
                    Value: null,
                    Data: undefined,
                    AndAgain: 'again',
                    Name: 'S-20190516-9042',
                    Other: 'other1',
                    Bool: '',
                    Int: '',
                    Date: '2021-12-23 14:34',
                    Time: '01:18:00',
                }),
                Map<string, any>({
                    RowId: '447',
                    Value: '447 Value',
                    Data: 'data1',
                    AndAgain: null,
                    Name: 'S-20190516-4622',
                    Other: 'other2',
                    Bool: '',
                    Int: '0',
                    Date: null,
                    Time: null,
                }),
                Map<string, any>({
                    RowId: '446',
                    Value: 'new val',
                    Data: 'data1',
                    AndAgain: 'change me',
                    Name: 'S-20190516-2368',
                    Other: 'other3',
                    Bool: false,
                    Int: 66,
                    Date: '1922-08-21 00:00',
                    Time: '03:30:00',
                }),
                Map<string, any>({
                    RowId: '445',
                    Value: 'val',
                    Data: 'other data',
                    AndAgain: 'again',
                    Name: 'S-20190516-9512',
                    Other: null,
                    Bool: true,
                    Int: 5,
                    Date: null,
                    Time: null,
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData).toHaveLength(4);
        expect(updatedData[0]).toStrictEqual({
            Int: null,
            Bool: null,
            Data: null,
            Date: '2021-12-23 14:34',
            Time: '01:18:00',
            RowId: '448',
        });
        expect(updatedData[1]).toStrictEqual({
            Int: 0,
            Bool: null,
            AndAgain: null,
            Value: '447 Value',
            RowId: '447',
        });
        expect(updatedData[2]).toStrictEqual({
            Int: 66,
            Bool: false,
            Value: 'new val',
            AndAgain: 'change me',
            RowId: '446',
        });
        expect(updatedData[3]).toStrictEqual({
            Bool: true,
            Data: 'other data',
            RowId: '445',
        });
    });

    test('edited row added field', () => {
        const updatedData = getUpdatedDataFromGrid(
            originalData,
            [
                Map<string, any>({
                    RowId: '448',
                    'New Field': 'new value',
                    Bool2: false,
                    Int2: 22,
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData).toHaveLength(1);
        expect(updatedData[0]).toStrictEqual({
            'New Field': 'new value',
            Bool2: false,
            Int2: 22,
            RowId: '448',
        });
    });

    test('with altUpdateKeys', () => {
        const updatedData = getUpdatedDataFromGrid(
            originalData,
            [
                Map<string, any>({
                    RowId: '448',
                    Data: 'data1',
                    'New Field': 'new value',
                    Bool2: false,
                    Int2: 22,
                }),
            ],
            'RowId',
            queryInfoWithAltPK
        );
        expect(updatedData).toHaveLength(1);
        expect(updatedData[0]).toStrictEqual({
            'New Field': 'new value',
            Data: 'data1',
            Bool2: false,
            Int2: 22,
            RowId: '448',
        });
    });

    test('row added field but no value', () => {
        const updatedData = getUpdatedDataFromGrid(
            originalData,
            [
                Map<string, any>({
                    RowId: '448',
                    'New Field': '',
                    Bool: true,
                    Int: 0,
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData).toHaveLength(0);
    });

    test('row field array value unchanged value', () => {
        const updatedData = getUpdatedDataFromGrid(
            fromJS({
                448: {
                    RowId: 448,
                    Value: [{ value: 1 }, { value: 2 }, { value: 3 }],
                },
            }),
            [
                Map<string, any>({
                    RowId: '448',
                    Value: [1, 2, 3],
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData).toHaveLength(0);
    });

    test('row field array value unchanged displayValue', () => {
        const updatedData = getUpdatedDataFromGrid(
            fromJS({
                448: {
                    RowId: 448,
                    Value: [
                        { value: 1, displayValue: 'test1' },
                        { value: 2, displayValue: 'test2' },
                        { value: 3, displayValue: 'test3' },
                    ],
                },
            }),
            [
                Map<string, any>({
                    RowId: '448',
                    Value: ['test1', 'test2', 'test3'],
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData).toHaveLength(0);
    });

    test('row field array value changed value', () => {
        const updatedData = getUpdatedDataFromGrid(
            fromJS({
                448: {
                    RowId: 448,
                    Value: [{ value: 1 }, { value: 2 }, { value: 3 }],
                },
            }),
            [
                Map<string, any>({
                    RowId: '448',
                    Value: [1, 2, 4],
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData).toHaveLength(1);
    });

    test('row field array value changed displayValue', () => {
        const updatedData = getUpdatedDataFromGrid(
            fromJS({
                448: {
                    RowId: 448,
                    Value: [
                        { value: 1, displayValue: 'test1' },
                        { value: 2, displayValue: 'test2' },
                        { value: 3, displayValue: 'test3' },
                    ],
                },
            }),
            [
                Map<string, any>({
                    RowId: '448',
                    Value: ['test1', 'test4', 'test3'],
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData).toHaveLength(1);
    });

    test('edited row date and time value changes', () => {
        let updatedData = getUpdatedDataFromGrid(
            fromJS({
                448: {
                    RowId: 448,
                    Date: '2020-12-23 14:34',
                    Time: '01:10:00',
                },
            }),
            [
                Map<string, any>({
                    RowId: 448,
                    Date: '2020-12-23 14:35',
                    Time: '01:10:01',
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData[0]).toStrictEqual({
            Date: '2020-12-23 14:35',
            Time: '01:10:01',
            RowId: 448,
        });

        updatedData = getUpdatedDataFromGrid(
            fromJS({
                448: {
                    RowId: 448,
                    Date: '2020-12-23 14:34',
                    Time: '01:10:00',
                },
            }),
            [
                Map<string, any>({
                    RowId: 448,
                    Date: '2020-12-24 14:34',
                    Time: '01:11:00',
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData[0]).toStrictEqual({
            Date: '2020-12-24 14:34',
            Time: '01:11:00',
            RowId: 448,
        });

        updatedData = getUpdatedDataFromGrid(
            fromJS({
                448: {
                    RowId: 448,
                    Date: '2020-12-23 14:34',
                    Time: '01:10:00',
                },
            }),
            [
                Map<string, any>({
                    RowId: 448,
                    Date: '2020-12-INVALID 14:34',
                    Time: '01:INVALID:00',
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData[0]).toStrictEqual({
            Date: '2020-12-INVALID 14:34',
            Time: '01:INVALID:00',
            RowId: 448,
        });

        updatedData = getUpdatedDataFromGrid(
            fromJS({
                448: {
                    RowId: 448,
                    Date: '2020-12-23 14:34',
                    Time: '01:10:00',
                },
            }),
            [
                Map<string, any>({
                    RowId: 448,
                    Date: new Date('2020-12-23 14:34'),
                    Time: '01:10:00',
                }),
            ],
            'RowId',
            queryInfo
        );
        expect(updatedData[0]).toStrictEqual({
            Date: new Date('2020-12-23 14:34'),
            RowId: 448,
        });
    });
});

describe('getValidatedEditableGridValue', () => {
    const dateCol = new QueryColumn({ jsonType: 'date', rangeURI: DATE_RANGE_URI });
    const dateTimeCol = new QueryColumn({ jsonType: 'date' });

    test('no column', () => {
        expect(getValidatedEditableGridValue('2020-12-23', undefined)).toStrictEqual({
            message: undefined,
            value: '2020-12-23',
        });
        expect(getValidatedEditableGridValue('Bogus', undefined)).toStrictEqual({ message: undefined, value: 'Bogus' });
        expect(getValidatedEditableGridValue(true, undefined)).toStrictEqual({ message: undefined, value: true });
        expect(getValidatedEditableGridValue(13, undefined)).toStrictEqual({ message: undefined, value: 13 });
    });

    test('valid date value', () => {
        expect(getValidatedEditableGridValue('2020-12-23', dateCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23',
        });
        expect(getValidatedEditableGridValue('2020-12-23 00:00:00', dateCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23',
        });
        expect(getValidatedEditableGridValue('2020-12-23 14:34', dateCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23',
        });
        expect(getValidatedEditableGridValue(new Date('2020-12-23 14:34'), dateCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23',
        });
    });

    test('invalid date value', () => {
        expect(getValidatedEditableGridValue('BOGUS', dateCol)).toStrictEqual({
            message: {
                message: 'Invalid date'
            },
            value: 'BOGUS',
        });
        expect(getValidatedEditableGridValue(true, dateCol)).toStrictEqual({ message: {
                message: 'Invalid date'
            }, value: true });
        expect(getValidatedEditableGridValue(13, dateCol).message).toBe(undefined);
        expect(getValidatedEditableGridValue('2020-12-INVALID 14:34', dateCol)).toStrictEqual({
            message: {
                message: 'Invalid date'
            },
            value: '2020-12-INVALID 14:34',
        });
        expect(getValidatedEditableGridValue('2020-13-23 14:34', dateCol)).toStrictEqual({
            message: {
                message: 'Invalid date'
            },
            value: '2020-13-23 14:34',
        });
        expect(getValidatedEditableGridValue(new Date('2020-13-23 14:34'), dateCol).message).toStrictEqual({
            message: 'Invalid date'
        });
    });

    test('valid dateTimeCol value', () => {
        expect(getValidatedEditableGridValue('2020-12-23', dateTimeCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23 00:00:00',
        });
        expect(getValidatedEditableGridValue('2020-12-23 00:00:00', dateTimeCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23 00:00:00',
        });
        expect(getValidatedEditableGridValue('2020-12-23 14:34', dateTimeCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23 14:34:00',
        });
        expect(getValidatedEditableGridValue(new Date('2020-12-23 14:34'), dateTimeCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23 14:34:00',
        });
    });

    test('invalid dateTimeCol value', () => {
        expect(getValidatedEditableGridValue('BOGUS', dateTimeCol)).toStrictEqual({
            message: {
                message: 'Invalid date time'
            },
            value: 'BOGUS',
        });
        expect(getValidatedEditableGridValue(true, dateTimeCol)).toStrictEqual({
            message: {
                message: 'Invalid date time'
            },
            value: true,
        });
        expect(getValidatedEditableGridValue(13, dateTimeCol).message).toBe(undefined);
        expect(getValidatedEditableGridValue('2020-12-INVALID 14:34', dateTimeCol)).toStrictEqual({
            message: {
                message: 'Invalid date time'
            },
            value: '2020-12-INVALID 14:34',
        });
        expect(getValidatedEditableGridValue('2020-13-23 14:34', dateTimeCol)).toStrictEqual({
            message: {
                message: 'Invalid date time'
            },
            value: '2020-13-23 14:34',
        });
        expect(getValidatedEditableGridValue(new Date('2020-13-23 14:34'), dateTimeCol).message).toStrictEqual({
            message: 'Invalid date time'
        });
    });

    test('time column', () => {
        const timeCol = new QueryColumn({ jsonType: 'time' });

        let validValues : any[] = [null, undefined, ''];
        let results = [null, undefined, ''];
        validValues.forEach((value, ind) => {
            expect(getValidatedEditableGridValue(value, timeCol)).toStrictEqual({ message: undefined, value: results[ind] });
        });

        validValues = [1.11, '100', '1:00 AM', '1:00 PM', '13:24'];
        results = [' 01:11', ' 10:00', ' 01:00', ' 13:00',' 13:24'];
        validValues.forEach((value, ind) => {
            const result = getValidatedEditableGridValue(value, timeCol);
            expect(result.message).toBeUndefined();
            expect(result.value).toContain(results[ind]);
        });

        const invalidValues = [' ', 'Bogus', true, NaN];
        invalidValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, timeCol)).toStrictEqual({ message: {
                    message: 'Invalid time'
                }, value });
        });

    });

    test('int column', () => {
        const intCol = new QueryColumn({ jsonType: 'int' });

        const validValues = [null, undefined, '', 0, -1, 100, 1.1E3, '100', '0.0'];
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, intCol)).toStrictEqual({ message: undefined, value });
        });

        const invalidValues = [1.11, ' ', 'Bogus', true, NaN];
        invalidValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, intCol)).toStrictEqual({ message: {
                    message: 'Invalid integer'
                }, value });
        });

    });

    test('float column', () => {
        const floatCol = new QueryColumn({ jsonType: 'float' });

        const validValues = [null, undefined, '', 0, -1, 100, 1.1E3, '100', '0.0', 1.11, '1.11', 123.456e2];
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, floatCol)).toStrictEqual({ message: undefined, value });
        });

        const invalidValues = [' ', 'Bogus', true, NaN];
        invalidValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, floatCol)).toStrictEqual({ message: {
                    message: 'Invalid decimal'
                }, value });
        });

    });

    test('boolean column', () => {
        const boolCol = new QueryColumn({ jsonType: 'boolean' });

        const validValues = [null, undefined, '', 'true', 't', 'yes', 'y', 'on', '1', 'false', 'f', 'no', 'n', 'off', '0'];
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, boolCol)).toStrictEqual({ message: undefined, value });
        });

        const invalidValues = ['tr', 'correct', 'wrong', '-1', '0.0', 'fail', 'bogus'];
        invalidValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, boolCol)).toStrictEqual({ message: {
                    message: 'Invalid boolean'
                }, value });
        });

    });

    test('text column', () => {
        const textCol = new QueryColumn({ jsonType: 'string', scale: 10 });

        const validValues = [null, undefined, '', ' ', 'a', 'ab', 'ab cd ef', 'ab cd efgh'];
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, textCol)).toStrictEqual({ message: undefined, value });
        });

        const invalidValues = ['ab cd efghi', 'ab cd efghi jkl'];
        invalidValues.forEach(value => {
            const result = getValidatedEditableGridValue(value, textCol);
            expect(result.message.message).toBe(value.length + '/10 characters')
        });

    });

    test('textchoice column', () => {
        const textChoiceCol = new QueryColumn({ jsonType: 'string', validValues: ['a', 'B'] });

        const validValues = [null, undefined, '', 'a', 'B'];
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, textChoiceCol)).toStrictEqual({ message: undefined, value });
        });

        const invalidValues = [' ', 'A', 'b', 'aB', 'ab'];
        invalidValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, textChoiceCol)).toStrictEqual({ message: {
                    message: 'Invalid text choice'
                }, value });
        });

    });

    test('required column', () => {
        const requiredCol = new QueryColumn({ jsonType: 'string', required: true, caption: 'ReqCol' });

        const validValues = ['a', 'B'];
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, requiredCol)).toStrictEqual({ message: undefined, value });
        });

        const invalidValues = [null, undefined, '', ' '];
        invalidValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, requiredCol)).toStrictEqual({ message: {
                    message: 'ReqCol is required.'
                }, value });
        });

    });

});

describe('other utils', () => {
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

    test('getSortedCellKeys', () => {
        expect(sortCellKeys(['0-0', '1-1', '1-1', '0-1', '1-0'])).toStrictEqual(['0-0', '1-0', '0-1', '1-1']);
        expect(sortCellKeys(['1-1', '1-15', '0-10', '1-5'])).toStrictEqual(['1-1', '1-5', '0-10', '1-15']);
    });

    test('computeRangeChange', () => {
        expect(computeRangeChange(4, 2, 4, 0)).toEqual([2, 4]);
        expect(computeRangeChange(4, 2, 4, 1)).toEqual([3, 4]);
        expect(computeRangeChange(4, 2, 4, -1)).toEqual([1, 4]);
        expect(computeRangeChange(4, 0, 4, -1)).toEqual([0, 4]);
        expect(computeRangeChange(5, 5, 7, 0)).toEqual([5, 7]);
        expect(computeRangeChange(5, 5, 7, 1)).toEqual([5, 8]);
        expect(computeRangeChange(5, 5, 7, -1)).toEqual([5, 6]);
    });
});
