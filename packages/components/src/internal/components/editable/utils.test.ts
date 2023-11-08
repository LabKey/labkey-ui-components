import { fromJS, List, Map } from 'immutable';

import { ExtendedMap } from '../../../public/ExtendedMap';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { LoadingState } from '../../../public/LoadingState';

import { ASSAY_WIZARD_MODEL } from '../../../test/data/constants';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';

import { QueryInfo } from '../../../public/QueryInfo';

import { QueryColumn } from '../../../public/QueryColumn';
import { BOOLEAN_TYPE, DATE_TYPE, INTEGER_TYPE, TEXT_TYPE } from '../domainproperties/PropDescType';

import { initEditableGridModel } from './actions';
import { EditorMode, EditorModel, EditableGridLoader, ValueDescriptor } from './models';
import {
    computeRangeChange,
    genCellKey,
    getEditorExportData,
    getUpdatedDataFromGrid,
    parseCellKey,
    sortCellKeys,
} from './utils';

const MODEL_ID_LOADED = 'loaded';

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
    test('getEditorExportData', () => {
        // Arrange
        const { queryInfo } = ASSAY_WIZARD_MODEL;
        const queryModel = new QueryModel({
            id: MODEL_ID_LOADED,
            schemaQuery: queryInfo.schemaQuery,
        }).mutate({
            rows: {
                '7197': {
                    ParticipantID: { displayValue: 'p1234', value: 'p1234' },
                    RowId: { value: 7197 },
                    SampleID: { displayValue: 'Sample 1', value: 'Sample 1' },
                    VisitID: { displayValue: 'Visit 1', value: 1 },
                },
                '8192': {
                    ParticipantID: { displayValue: 'p4567', value: 'p4567' },
                    RowId: { value: 8192 },
                    SampleID: { displayValue: 'Sample 8192', value: 'Sample 8192' },
                    VisitID: { value: null },
                    'Run/Batch/batch_dbl_field': { value: 4.35 },
                },
            },
            orderedRows: ['7197', '8192'],
            rowsLoadingState: LoadingState.LOADED,
            queryInfoLoadingState: LoadingState.LOADED,
            queryInfo,
        });
        const editorModel = new EditorModel({
            cellValues: Map<string, List<ValueDescriptor>>({
                // 7197
                '0-0': List([{ display: 'Sample 1', raw: 'Sample 1' }]),
                '1-0': List([{ display: 'p1234', raw: 'p1234' }]),
                '2-0': List([{ display: 'Visit 1', raw: 'Visit 1' }]),
                '3-0': List([{ display: '11/22/22', raw: '11/22/22' }]),

                // 8192
                '0-1': List([{ display: 'Sample 8192-1', raw: 'Sample 8192-1' }]),
                '1-1': List([{ display: 'p4567', raw: 'p4567' }]),
                '2-2': List([]),
                '3-1': List([]),
            }),
            columns: List(['SampleID', 'ParticipantID', 'VisitID', 'Date']),
            id: MODEL_ID_LOADED,
        });
        const extraColumns = [
            { caption: 'Row ID', fieldKey: 'RowId' },
            { caption: 'Batch Double Field', fieldKey: 'Run/Batch/batch_dbl_field' },
        ];

        // Act
        const exportData = getEditorExportData(
            [editorModel],
            [queryModel],
            undefined,
            undefined,
            undefined,
            true,
            extraColumns
        );

        // Assert
        expect(exportData.length).toEqual(3);
        expect(exportData[0]).toEqual([
            'SampleID',
            'Participant ID',
            'Visit ID',
            'Date',
            'Row ID',
            'Batch Double Field',
        ]);
        expect(exportData[1]).toEqual(['Sample 1', 'p1234', 'Visit 1', '11/22/22', 7197, undefined]);
        expect(exportData[2]).toEqual(['Sample 8192-1', 'p4567', undefined, undefined, 8192, 4.35]);
    });

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
