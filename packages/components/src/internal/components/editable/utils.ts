import { fromJS, List, Map, OrderedMap, Set } from 'immutable';
import { Utils, UtilsDOM } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { QueryColumn } from '../../../public/QueryColumn';

import { getLookupValueDescriptors } from '../../actions';
import { genCellKey } from '../../utils';

import { LoadingState } from '../../../public/LoadingState';
import { QueryInfo } from '../../../public/QueryInfo';
import { getUpdatedDataFromGrid, quoteValueWithDelimiters } from '../../util/utils';

import { EXPORT_TYPES, MODIFICATION_TYPES } from '../../constants';

import { SelectInputOption, SelectInputProps } from '../forms/input/SelectInput';

import { EditorMode, EditorModel, EditorModelProps, IEditableGridLoader, ValueDescriptor } from './models';

import { CellActions } from './constants';

/**
 * @deprecated Use initEditableGridModel() or initEditableGridModels() instead.
 * This method does not make use the grid loader paradigm. Usages of this method directly
 * is susceptible to data misalignment errors with the associated view.
 */
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
        columns: columns.map(col => col.fieldKey).toList(),
        deletedIds: Set<any>(),
        rowCount: orderedRows.length,
    };
};

export const initEditableGridModel = async (
    dataModel: QueryModel,
    editorModel: EditorModel,
    loader: IEditableGridLoader,
    queryModel: QueryModel,
    colFilter?: (col: QueryColumn) => boolean
): Promise<{ dataModel: QueryModel; editorModel: EditorModel }> => {
    const response = await loader.fetch(queryModel);
    const gridData: Partial<QueryModel> = {
        rows: response.data.toJS(),
        orderedRows: response.dataIds.toArray(),
        queryInfo: loader.queryInfo,
    };

    let columns: List<QueryColumn>;
    const forUpdate = loader.mode === EditorMode.Update;
    if (loader.columns) {
        columns = editorModel.getColumns(
            gridData.queryInfo,
            forUpdate,
            undefined,
            loader.columns,
            loader.columns,
            colFilter
        );
    } else {
        columns = editorModel.getColumns(gridData.queryInfo, forUpdate, undefined, undefined, undefined, colFilter);
    }

    const editorModelData = await loadEditorModelData(gridData, columns);

    return {
        dataModel: dataModel.mutate({
            ...gridData,
            rowsLoadingState: LoadingState.LOADED,
            queryInfoLoadingState: LoadingState.LOADED,
        }),
        editorModel: editorModel.merge(editorModelData) as EditorModel,
    };
};

export interface EditableGridModels {
    dataModels: QueryModel[];
    editorModels: EditorModel[];
}

export const initEditableGridModels = async (
    dataModels: QueryModel[],
    editorModels: EditorModel[],
    loaders: IEditableGridLoader[],
    queryModel: QueryModel
): Promise<EditableGridModels> => {
    const updatedDataModels = [];
    const updatedEditorModels = [];

    const results = await Promise.all(
        dataModels.map((dataModel, i) => initEditableGridModel(dataModels[i], editorModels[i], loaders[i], queryModel))
    );

    results.forEach(result => {
        updatedDataModels.push(result.dataModel);
        updatedEditorModels.push(result.editorModel);
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
    selectionData?: Map<string, any>,
    tabIndex?: number
): Record<string, any> => {
    const model = dataModels[tabIndex];
    const editorModel = editorModels[tabIndex];

    if (!editorModel) {
        console.error('Grid does not expose an editor. Ensure the grid is properly initialized for editing.');
        return null;
    }

    // Issue 37842: if we have data for the selection, this was the data that came from the display grid and was used
    // to populate the queryInfoForm. If we don't have this data, we came directly to the editable grid
    // using values from the display grid to initialize the editable grid model, so we use that.
    const initData = selectionData ?? fromJS(model.rows);
    const editorData = editorModel.getRawDataFromModel(model, true, true, false).toArray();

    return {
        originalRows: model.rows,
        schemaQuery: model.queryInfo.schemaQuery,
        tabIndex: tabIndex ?? 0,
        updatedRows: getUpdatedDataFromGrid(initData, editorData, idField, model.queryInfo),
    };
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
        auditMessage: 'Exported editable grid to file: ', // Filename will be appended
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

export const getEditorExportData = (
    editorModels: EditorModel[],
    dataModels: QueryModel[],
    readOnlyColumns?: List<string>,
    insertColumns?: List<QueryColumn>,
    updateColumns?: List<QueryColumn>,
    forUpdate?: boolean,
    extraColumns?: Array<Partial<QueryColumn>>,
    colFilter?: (col: QueryColumn) => boolean
): any[][] => {
    const headings = OrderedMap<string, string>().asMutable();
    const editorData = OrderedMap<string, OrderedMap<string, any>>().asMutable();

    dataModels.forEach((dataModel, i) => {
        const editorModel = editorModels[i];

        const columns = editorModel.getColumns(
            dataModel.queryInfo,
            forUpdate,
            readOnlyColumns,
            insertColumns,
            updateColumns,
            colFilter
        );

        // Prepare headers
        columns.forEach(col => {
            headings.set(col.fieldKey, col.isLookup() ? col.fieldKey : col.caption);
        });
        extraColumns?.forEach(col => {
            headings.set(col.fieldKey, col.caption ?? col.fieldKey);
        });

        // Prepare data
        editorModel.getRawDataFromModel(dataModel, true, forUpdate, true).forEach((editableRow, j) => {
            const rowKey = dataModel.orderedRows[j];
            const row = editorData.get(rowKey) ?? OrderedMap<string, any>().asMutable();
            columns.forEach(col => {
                row.set(col.fieldKey, editableRow.get(col.fieldKey));
            });

            extraColumns?.forEach(col => {
                if (editableRow.has(col.fieldKey)) {
                    row.set(col.fieldKey, editableRow.get(col.fieldKey));
                } else {
                    const data = dataModel.rows[rowKey]?.[col.fieldKey];
                    if (data) {
                        if (Array.isArray(data)) {
                            let sep = '';
                            row.set(
                                col.fieldKey,
                                data.reduce((str, row_) => {
                                    str += sep + quoteValueWithDelimiters(row_.displayValue ?? row_.value, ',');
                                    sep = ', ';
                                    return str;
                                }, '')
                            );
                        } else {
                            row.set(col.fieldKey, data.displayValue ?? data.value);
                        }
                    } else {
                        row.set(col.fieldKey, row.get(col.fieldKey));
                    }
                }
            });

            editorData.set(rowKey, row);
        });
    });

    const rows = [];
    editorData.forEach(rowMap => rows.push([...rowMap.toArray().values()]));
    return [headings.toArray(), ...rows];
};

export function onCellSelectChange(
    cellActions: Partial<CellActions>,
    colIdx: number,
    rowIdx: number,
    selectedOptions: SelectInputOption | SelectInputOption[],
    multiple: boolean
): void {
    const { modifyCell, selectCell } = cellActions;

    if (multiple) {
        if (selectedOptions.length === 0) {
            modifyCell(colIdx, rowIdx, undefined, MODIFICATION_TYPES.REMOVE_ALL);
        } else {
            const valueDescriptors = selectedOptions.map(item => ({ raw: item.value, display: item.label }));
            modifyCell(colIdx, rowIdx, valueDescriptors, MODIFICATION_TYPES.REPLACE);
        }
    } else {
        const selectedOption = selectedOptions as SelectInputOption;
        modifyCell(
            colIdx,
            rowIdx,
            [{ raw: selectedOption?.value, display: selectedOption?.label }],
            MODIFICATION_TYPES.REPLACE
        );
        selectCell(colIdx, rowIdx);
    }
}

export const gridCellSelectInputProps: Partial<SelectInputProps> = {
    autoFocus: true,
    containerClass: 'select-input-cell-container',
    customStyles: {
        control: provided => ({
            ...provided,
            minHeight: 24,
            borderRadius: 0,
        }),
        valueContainer: provided => ({
            ...provided,
            minHeight: 24,
            padding: '0 4px',
        }),
        input: provided => ({
            ...provided,
            margin: '0px',
        }),
        indicatorsContainer: provided => ({
            ...provided,
            minHeight: 24,
            padding: '0 4px',
        }),
    },
    customTheme: theme => ({
        ...theme,
        colors: {
            ...theme.colors,
            danger: '#D9534F',
            primary: '#2980B9',
            primary75: '#009BF9',
            primary50: '#F2F9FC',
            primary25: 'rgba(41, 128, 185, 0.1)',
        },
        spacing: {
            ...theme.spacing,
            baseUnit: 2,
        },
    }),
    inputClass: 'select-input-cell',
    menuPosition: 'fixed',
    placeholder: '',
    showLabel: false,
};
