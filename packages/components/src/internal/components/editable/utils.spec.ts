import { List, Map } from 'immutable';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { LoadingState } from '../../../public/LoadingState';

import { ASSAY_WIZARD_MODEL } from '../../../test/data/constants';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';

import { QueryInfo } from '../../../public/QueryInfo';

import { EditorMode, EditorModel, IEditableGridLoader, ValueDescriptor } from './models';

import { getEditorExportData, initEditableGridModel } from './utils';
import { QueryColumn } from '../../../public/QueryColumn';

const MODEL_ID_LOADED = 'loaded';

class MockEditableGridLoader implements IEditableGridLoader {
    columns: List<QueryColumn>;
    id: string;
    mode = EditorMode.Insert;
    queryInfo: QueryInfo;

    constructor(queryInfo: QueryInfo, props?: Partial<IEditableGridLoader>) {
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
            columns: ['SampleID', 'ParticipantID', 'VisitID', 'Date'],
            colCount: 4,
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
            const expectedInsertColumns = queryInfo
                .getInsertColumns()
                .map(col => col.fieldKey)
                .toArray();

            const models = await initEditableGridModel(dataModel, editorModel, loader, dataModel);
            expect(models.dataModel.queryInfoLoadingState).toEqual(LoadingState.LOADED);
            expect(models.dataModel.rowsLoadingState).toEqual(LoadingState.LOADED);
            expect(models.editorModel.cellValues.size).toEqual(0);
            expect(models.editorModel.columns.toArray()).toEqual(expectedInsertColumns);
            expect(models.editorModel.colCount).toEqual(expectedInsertColumns.length);
        });

        test('respects loader mode for columns', async () => {
            const loader = new MockEditableGridLoader(queryInfo, { mode: EditorMode.Update });
            const editorModel = new EditorModel({});
            const expectedUpdateColumns = queryInfo
                .getUpdateColumns()
                .map(col => col.fieldKey)
                .toArray();

            const models = await initEditableGridModel(dataModel, editorModel, loader, dataModel);
            expect(models.editorModel.columns.toArray()).toEqual(expectedUpdateColumns);
            expect(models.editorModel.colCount).toEqual(expectedUpdateColumns.length);
        });

        test('respects loader supplied columns', async () => {
            const columns = List([queryInfo.getColumn('SampleID'), queryInfo.getColumn('Date')]);
            const loader = new MockEditableGridLoader(queryInfo, { columns });
            const editorModel = new EditorModel({});

            const models = await initEditableGridModel(dataModel, editorModel, loader, dataModel);
            expect(models.editorModel.columns.toArray()).toEqual(columns.map(col => col.fieldKey).toArray());
        });
    });
});
