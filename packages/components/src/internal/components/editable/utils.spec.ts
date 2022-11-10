import { List, OrderedMap } from 'immutable';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { LoadingState } from '../../../public/LoadingState';

import { ASSAY_WIZARD_MODEL } from '../../../test/data/constants';

import { EditorModel } from './models';

import { getEditorTableData } from './utils';

const MODEL_ID_LOADED = 'loaded';

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
});
