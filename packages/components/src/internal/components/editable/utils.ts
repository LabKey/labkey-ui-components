import { fromJS, List, Map, OrderedMap, Set } from 'immutable';
import { Utils, UtilsDOM } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { QueryColumn } from '../../../public/QueryColumn';
import { EditorModel, EditorModelProps, ValueDescriptor } from '../../models';
import { getLookupValueDescriptors } from '../../actions';
import { genCellKey } from '../../utils';

import { LoadingState } from '../../../public/LoadingState';
import { QueryInfo } from '../../../public/QueryInfo';
import { getUpdatedDataFromGrid } from '../../util/utils';

import { EXPORT_TYPES } from '../../constants';

import { EditableGridLoaderFromSelection } from './EditableGridLoaderFromSelection';

export const loadEditorModelData = async (
    queryModelData: Partial<QueryModel>,
    editorColumns?: List<QueryColumn>,
    extraColumns?: QueryColumn[]
): Promise<Partial<EditorModel>> => {
    const { orderedRows, rows, queryInfo } = queryModelData;
    let columns = editorColumns ?? queryInfo.getInsertColumns();
    if (extraColumns?.length > 0) columns = columns.push(...extraColumns);
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
                    value.reduce((list, v) => {
                        if (col.isLookup() && Utils.isNumber(v)) {
                            const descriptors = lookupValueDescriptors[col.lookupKey];
                            if (descriptors) {
                                const desc = descriptors.filter(descriptor => descriptor.raw === v);
                                if (desc) {
                                    return list.push(...desc);
                                }
                            }
                        }

                        return list.push({ display: v.displayValue ?? v, raw: v.value ?? v });
                    }, List<ValueDescriptor>())
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

export interface EditableGridModels {
    dataModels: QueryModel[];
    editorModels: EditorModel[];
}

export const initEditableGridModels = async (
    dataModels: QueryModel[],
    editorModels: EditorModel[],
    queryModel: QueryModel,
    loaders: EditableGridLoaderFromSelection[],
    includeColumns?: Array<Partial<QueryColumn>>
): Promise<EditableGridModels> => {
    const updatedDataModels = [];
    const updatedEditorModels = [];

    const results = await Promise.all(
        loaders.map(
            loader =>
                new Promise<{ editorModelData: Partial<EditorModel>; gridData: Record<string, any> }>(resolve => {
                    let gridData;
                    loader
                        .fetch(queryModel)
                        .then(response => {
                            gridData = {
                                rows: response.data.toJS(),
                                orderedRows: response.dataIds.toArray(),
                                queryInfo: loader.queryInfo,
                            };
                            const extraColumns = [];
                            if (includeColumns) {
                                includeColumns.forEach(col => {
                                    const column = queryModel.getColumn(col.fieldKey);
                                    if (column) extraColumns.push(column);
                                });
                            }
                            return loadEditorModelData(gridData, loader.updateColumns, extraColumns);
                        })
                        .then(editorModelData => {
                            resolve({ editorModelData, gridData });
                        });
                })
        )
    );

    results.forEach((result, index) => {
        const { editorModelData, gridData } = result;

        updatedDataModels.push(
            dataModels[index].mutate({
                ...gridData,
                rowsLoadingState: LoadingState.LOADED,
                queryInfoLoadingState: LoadingState.LOADED,
            })
        );
        updatedEditorModels.push(editorModels[index].merge(editorModelData) as EditorModel);
    });

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
): EditableGridModels => {
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

const getTableExportConfig = (
    exportType: EXPORT_TYPES,
    filename: string,
    exportData: any[][],
    activeModel: QueryModel
): UtilsDOM.ConvertToTableOptions => {
    const config = {
        rows: exportData,
        fileNamePrefix: filename,
        queryinfo: {
            schema: activeModel.schemaName,
            query: activeModel.queryName,
        },
        auditMessage: 'Exported editable grid to file: ', // Filename will be appeneded
    } as UtilsDOM.ConvertToTableOptions;

    switch (exportType) {
        case EXPORT_TYPES.TSV:
            config.delim = UtilsDOM.DelimiterType.TAB;
            break;
        case EXPORT_TYPES.CSV:
        default:
            config.delim = UtilsDOM.DelimiterType.COMMA;
            break;
    }

    return config;
};

export const exportEditedData = (
    exportType: EXPORT_TYPES,
    filename: string,
    exportData: any[][],
    activeModel: QueryModel
): void => {
    if (EXPORT_TYPES.EXCEL === exportType) {
        const data = {
            fileName: filename + '.xlsx',
            sheets: [{ name: 'data', data: exportData }],
            queryinfo: {
                schema: activeModel.schemaName,
                query: activeModel.queryName,
            },
            auditMessage: 'Exported editable grid to excel file: ', // Filename will be appended
        };
        UtilsDOM.convertToExcel(data);
        return;
    }

    const config = getTableExportConfig(exportType, filename, exportData, activeModel);
    UtilsDOM.convertToTable(config);
};

export const getEditorTableData = (
    editorModel: EditorModel,
    queryModel: QueryModel,
    headings: OrderedMap<string, string>,
    editorData: OrderedMap<string, OrderedMap<string, any>>,
    readOnlyColumns?: List<string>,
    insertColumns?: List<QueryColumn>,
    updateColumns?: List<QueryColumn>,
    forUpdate?: boolean,
    extraColumns?: Array<Partial<QueryColumn>>,
    colFilter?: (col: QueryColumn) => boolean,
    forExport?: boolean
): [Map<string, string>, Map<string, Map<string, any>>] => {
    const tabData = editorModel
        .getRawDataFromGridData(
            fromJS(queryModel.rows),
            fromJS(queryModel.orderedRows),
            queryModel.queryInfo,
            true,
            forUpdate,
            readOnlyColumns,
            extraColumns,
            colFilter,
            forExport
        )
        .toArray();

    const columns = editorModel.getColumns(
        queryModel.queryInfo,
        forUpdate,
        readOnlyColumns,
        insertColumns,
        updateColumns,
        colFilter
    );
    columns.forEach(col => (headings = headings.set(col.fieldKey, col.isLookup() ? col.fieldKey : col.caption)));

    if (extraColumns) {
        extraColumns.forEach(col => {
            headings = headings.set(col.fieldKey, col.caption ?? col.fieldKey);
        });
    }

    tabData.forEach((row, idx) => {
        const rowId = row.get('RowId') ?? idx;
        let draftRow = editorData.get(rowId) ?? OrderedMap<string, any>();
        columns.forEach(col => {
            draftRow = draftRow.set(col.fieldKey, row.get(col.fieldKey));
        });

        if (extraColumns) {
            extraColumns.forEach(col => {
                if (row.has(col.fieldKey)) draftRow = draftRow.set(col.fieldKey, row.get(col.fieldKey));
            });
        }

        editorData = editorData.set(rowId, draftRow);
    });
    return [headings, editorData];
};
