import { List, Map, OrderedMap } from 'immutable';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { LoadingState } from '../../../public/LoadingState';

import { ASSAY_WIZARD_MODEL } from '../../../test/data/constants';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';

import { QueryInfo } from '../../../public/QueryInfo';

import { EditorMode, EditorModel, IEditableGridLoader } from './models';

import { getEditorTableData, initEditableGridModel } from './utils';
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
    test('getEditorTableData', () => {
        const { queryInfo } = ASSAY_WIZARD_MODEL;
        const queryModel = new QueryModel({
            id: MODEL_ID_LOADED,
            schemaQuery: queryInfo.schemaQuery,
        }).mutate({
            rows: {},
            orderedRows: [],
            rowsLoadingState: LoadingState.LOADED,
            queryInfoLoadingState: LoadingState.LOADED,
            queryInfo,
        });
        const editorModel = new EditorModel({ id: MODEL_ID_LOADED });
        const [headings, rows] = getEditorTableData(editorModel, queryModel, OrderedMap(), OrderedMap());

        expect(headings.toArray()).toEqual(['SampleID', 'Participant ID', 'Visit ID', 'Date']);
    });

    describe('initEditableGridModel', () => {
        const { queryInfo } = ASSAY_WIZARD_MODEL;
        const dataModel = makeTestQueryModel(queryInfo.schemaQuery, queryInfo);

        test('defaults to insert columns', async () => {
            const loader = new MockEditableGridLoader(queryInfo);
            const editorModel = new EditorModel({ loader });
            const expectedInsertColumns = queryInfo
                .getInsertColumns()
                .map(col => col.fieldKey)
                .toArray();

            const models = await initEditableGridModel(dataModel, editorModel, dataModel);
            expect(models.dataModel.queryInfoLoadingState).toEqual(LoadingState.LOADED);
            expect(models.dataModel.rowsLoadingState).toEqual(LoadingState.LOADED);
            expect(models.editorModel.cellValues.size).toEqual(0);
            expect(models.editorModel.columns.toArray()).toEqual(expectedInsertColumns);
            expect(models.editorModel.colCount).toEqual(expectedInsertColumns.length);
        });

        test('respects loader mode for columns', async () => {
            const loader = new MockEditableGridLoader(queryInfo, { mode: EditorMode.Update });
            const editorModel = new EditorModel({ loader });
            const expectedUpdateColumns = queryInfo
                .getUpdateColumns()
                .map(col => col.fieldKey)
                .toArray();

            const models = await initEditableGridModel(dataModel, editorModel, dataModel);
            expect(models.editorModel.columns.toArray()).toEqual(expectedUpdateColumns);
            expect(models.editorModel.colCount).toEqual(expectedUpdateColumns.length);
        });

        test('respects loader supplied columns', async () => {
            const columns = List([queryInfo.getColumn('SampleID'), queryInfo.getColumn('Date')]);
            const loader = new MockEditableGridLoader(queryInfo, { columns });
            const editorModel = new EditorModel({ loader });

            const models = await initEditableGridModel(dataModel, editorModel, dataModel);
            expect(models.editorModel.columns.toArray()).toEqual(columns.map(col => col.fieldKey).toArray());
        });

        test('includes extra columns', async () => {
            const columns = List([queryInfo.getColumn('Date')]);
            const loader = new MockEditableGridLoader(queryInfo, { columns });
            const editorModel = new EditorModel({ loader });
            const extraColumns: Array<Partial<QueryColumn>> = [
                { fieldKey: 'SampleID' },
                { fieldKey: 'DoesNotExist' },
                { fieldKey: 'Date' }, // duplicates are removed
            ];

            const models = await initEditableGridModel(dataModel, editorModel, dataModel, extraColumns);
            expect(models.editorModel.columns.toArray()).toEqual(['Date', 'SampleID']);
        });
    });
});
