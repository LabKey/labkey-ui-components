import { fromJS, List, Map, Set } from 'immutable';
import { Utils } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { QueryColumn } from '../../../public/QueryColumn';
import { EditorModel, EditorModelProps, ValueDescriptor } from '../../models';
import { genCellKey, getLookupValueDescriptors } from '../../actions';
import { EditableGridLoaderFromSelection } from "./EditableGridLoaderFromSelection";
import { LoadingState } from "../../../public/LoadingState";
import { QueryInfo } from "../../../public/QueryInfo";
import { getUpdatedDataFromGrid } from "../../util/utils";

export const loadEditorModelData = async (
    queryModelData: Partial<QueryModel>,
    editorColumns?: List<QueryColumn>
): Promise<Partial<EditorModel>> => {
    const { orderedRows, rows, queryInfo } = queryModelData;
    const columns = editorColumns ?? queryInfo.getInsertColumns();
    const lookupValueDescriptors = await getLookupValueDescriptors(
        columns.toArray(),
        fromJS(rows),
        fromJS(orderedRows)
    );
    let cellValues = Map<string, List<ValueDescriptor>>();

    // data is initialized in column order
    columns.forEach((col, cn) => {
        orderedRows.forEach((id, rn) => {
            const row = rows[id];
            const cellKey = genCellKey(cn, rn);
            const value = row[col.fieldKey];

            if (Array.isArray(value)) {
                // assume to be list of {displayValue, value} objects
                cellValues = cellValues.set(
                    cellKey,
                    value.reduce(
                        (list, v) => list.push({ display: v.displayValue, raw: v.value }),
                        List<ValueDescriptor>()
                    )
                );
            } else {
                // assume to be a {displayValue, value} object but fall back on value not being an object
                const raw = value?.value ?? value;
                const display = value?.displayValue ?? raw;
                let cellValue = List([
                    {
                        display: display !== null ? display : undefined,
                        raw: raw !== null ? raw : undefined,
                    },
                ]);

                // Issue 37833: try resolving the value for the lookup to get the displayValue to show in the grid cell
                if (col.isLookup() && Utils.isNumber(raw)) {
                    const descriptors = lookupValueDescriptors[col.lookupKey];
                    if (descriptors) {
                        cellValue = List(descriptors.filter(descriptor => descriptor.raw === raw));
                    }
                }

                cellValues = cellValues.set(cellKey, cellValue);
            }
        });
    });

    return {
        cellValues,
        colCount: columns.size,
        deletedIds: Set<any>(),
        rowCount: orderedRows.length,
    };
};

export const initEditableGridModels = async (
    dataModels: QueryModel[],
    editorModels: EditorModel[],
    queryModel: QueryModel,
    loaders: EditableGridLoaderFromSelection[]
): Promise<{
    dataModels: QueryModel[];
    editorModels: EditorModel[];
}> => {
    const updatedDataModels = [];
    const updatedEditorModels = [];
    for (const loader of loaders) {
        const index = loaders.indexOf(loader);
        const response = await loader.fetch(queryModel);
        const gridData = {
            rows: response.data.toJS(),
            orderedRows: response.dataIds.toArray(),
            queryInfo: loader.queryInfo,
        };
        const editorModelData = await loadEditorModelData(gridData, loader.updateColumns);

        updatedDataModels.push(
            dataModels[index].mutate({
                ...gridData,
                rowsLoadingState: LoadingState.LOADED,
                queryInfoLoadingState: LoadingState.LOADED,
            })
        );
        updatedEditorModels.push(editorModels[index].merge(editorModelData) as EditorModel);
    }

    return {
        dataModels: updatedDataModels,
        editorModels: updatedEditorModels,
    };
};

export const applyEditableGridChangesToModels = (
    dataModels: QueryModel[],
    editorModels: EditorModel[],
    editorModelChanges: Partial<EditorModelProps>,
    queryInfo?: QueryInfo,
    dataKeys?: List<any>,
    data?: Map<string, Map<string, any>>,
    index?: number
): {
    dataModels: QueryModel[];
    editorModels: EditorModel[];
} => {
    const tabIndex = index ?? 0;
    const updatedEditorModels = [...editorModels];
    const editorModel = editorModels[tabIndex].merge(editorModelChanges) as EditorModel;
    updatedEditorModels.splice(tabIndex, 1, editorModel);

    const updatedDataModels = [...dataModels];
    const orderedRows = dataKeys?.toJS();
    const rows = data?.toJS();
    if (orderedRows && rows) {
        let dataModel = dataModels[tabIndex].mutate({ orderedRows, rows });
        if (queryInfo) dataModel = dataModels[tabIndex].mutate({ queryInfo });
        updatedDataModels.splice(tabIndex, 1, dataModel);
    }

    return {
        dataModels: updatedDataModels,
        editorModels: updatedEditorModels,
    };
};

export const getUpdatedDataFromEditableGrid = (
    dataModels: QueryModel[],
    editorModels: EditorModel[],
    idField: string,
    readOnlyColumns?: List<string>,
    selectionData?: Map<string, any>,
    tabIndex?: number
): Record<string, any> => {
    const model = dataModels[tabIndex];
    const editorModel = editorModels[tabIndex];

    if (!editorModel) {
        console.error('Grid does not expose an editor. Ensure the grid is properly initialized for editing.');
        return null;
    } else {
        // Issue 37842: if we have data for the selection, this was the data that came from the display grid and was used
        // to populate the queryInfoForm.  If we don't have this data, we came directly to the editable grid
        // using values from the display grid to initialize the editable grid model, so we use that.
        const initData = selectionData ?? fromJS(model.rows);
        const editorData = editorModel
            .getRawDataFromGridData(
                fromJS(model.rows),
                fromJS(model.orderedRows),
                model.queryInfo,
                true,
                true,
                readOnlyColumns
            )
            .toArray();
        const updatedRows = getUpdatedDataFromGrid(initData, editorData, idField, model.queryInfo);

        return {
            schemaQuery: model.queryInfo.schemaQuery,
            updatedRows,
            originalRows: model.rows,
            tabIndex: tabIndex ?? 0,
        };
    }
};
