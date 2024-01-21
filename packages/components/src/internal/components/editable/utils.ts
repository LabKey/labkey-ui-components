import { fromJS, Iterable, List, Map, OrderedMap } from 'immutable';
import { Utils, UtilsDOM } from '@labkey/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { QueryColumn } from '../../../public/QueryColumn';

import { getColDateFormat, getJsonDateTimeFormatString, parseDate } from '../../util/Date';

import { QueryInfo } from '../../../public/QueryInfo';
import { quoteValueWithDelimiters } from '../../util/utils';

import { EXPORT_TYPES } from '../../constants';

import { SelectInputOption, SelectInputProps } from '../forms/input/SelectInput';

import { EditorModel, EditorModelProps, EditableGridModels } from './models';
import { CellActions, CellCoordinates, MODIFICATION_TYPES } from './constants';

export const applyEditableGridChangesToModels = (
    dataModels: QueryModel[],
    editorModels: EditorModel[],
    editorModelChanges: Partial<EditorModelProps>,
    queryInfo?: QueryInfo,
    dataKeys?: List<any>,
    data?: Map<string, Map<string, any>>,
    tabIndex = 0
): EditableGridModels => {
    const updatedEditorModels = [...editorModels];
    let editorModel = editorModels[tabIndex].merge(editorModelChanges) as EditorModel;

    // NK: The "selectionCells" property is of type string[]. When merge() is used it utilizes
    // Immutable.fromJS() which turns the Array into a List. We want to maintain the property
    // as an Array so here we set it explicitly.
    if (editorModelChanges?.selectionCells !== undefined) {
        const selectionCells = sortCellKeys(editorModelChanges.selectionCells);
        editorModel = editorModel.set('selectionCells', selectionCells) as EditorModel;
        editorModel = editorModel.set('isSparseSelection', isSparseSelection(selectionCells)) as EditorModel;
    }

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

/**
 * Constructs an array of objects (suitable for the rows parameter of updateRows), where each object contains the
 * values in editorRows that are different from the ones in originalGridData
 *
 * @param originalGridData a map from an id field to a Map from fieldKeys to values
 * @param editorRows An array of Maps from field keys to values
 * @param idField the fieldKey in the editorRow objects that is the id field that is the key for originalGridData
 * @param queryInfo the query info behind this editable grid
 */
export function getUpdatedDataFromGrid(
    originalGridData: Map<string, Map<string, any>>,
    editorRows: Array<Map<string, any>>,
    idField: string,
    queryInfo: QueryInfo
): any[] {
    const updatedRows = [];
    const altIdFields = queryInfo.altUpdateKeys;
    editorRows.forEach(editedRow => {
        const id = editedRow.get(idField);
        const altIds = {};
        altIdFields?.forEach(altIdField => {
            altIds[altIdField] = altIdField ? editedRow.get(altIdField) : undefined;
        });
        const originalRow = originalGridData.get(id.toString());
        if (originalRow) {
            const row = editedRow.reduce((row, value, key) => {
                // We can skip the idField for the diff check, that will be added to the updated rows later
                if (key === idField) return row;

                let originalValue = originalRow.has(key) ? originalRow.get(key) : undefined;
                const col = queryInfo.getColumn(key);
                const isDate = col?.jsonType === 'date';
                const isTimeOnly = col?.sqlType === 'time';
                // Convert empty cell to null
                if (value === '') value = null;

                // Lookup columns store a list but grid only holds a single value
                if (List.isList(originalValue) && !Array.isArray(value)) {
                    originalValue = Map.isMap(originalValue.get(0))
                        ? originalValue.get(0).get('value')
                        : originalValue.get(0).value;
                }

                // EditableGrid passes in strings for single values. Attempt this conversion here to help check for
                // updated values. This is not the final type check.
                if (typeof originalValue === 'number' || typeof originalValue === 'boolean') {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Incorrect types are handled by API and user feedback created from that response. Don't need
                        // to handle that here.
                    }
                } else if (Iterable.isIterable(originalValue) && !List.isList(originalValue)) {
                    originalValue = originalValue.get('value');
                }

                // If col is a multi-value column, compare all values for changes
                if ((List.isList(originalValue) || originalValue === undefined) && Array.isArray(value)) {
                    if (
                        (originalValue?.size ?? 0) !== value.length ||
                        (originalValue &&
                            originalValue?.findIndex(
                                o => value.indexOf(o.value) === -1 && value.indexOf(o.displayValue) === -1
                            ) !== -1)
                    ) {
                        row[key] = value;
                    }
                } else if (!(originalValue == undefined && value == undefined) && originalValue !== value) {
                    // - only update if the value has changed
                    // - if the value is 'undefined', it will be removed from the update rows, so in order to
                    // erase an existing value we set the value to null in our update data

                    // Issue 44398: match JSON dateTime format provided by LK server when submitting date values back for insert/update
                    // Issue 45140: use QueryColumn date format for parseDate()
                    // TODO fix date
                    if (isTimeOnly) row[key] = value;
                    else if (isDate) row[key] = getJsonDateTimeFormatString(parseDate(value, getColDateFormat(col)));
                    else row[key] = value ?? null;
                }
                return row;
            }, {});
            if (!Utils.isEmptyObj(row)) {
                row[idField] = id;
                Object.assign(row, altIds);
                updatedRows.push(row);
            }
        } else {
            console.error('Unable to find original row for id ' + id);
        }
    });
    return updatedRows;
}

export const getUpdatedDataFromEditableGrid = (
    dataModels: QueryModel[],
    editorModels: EditorModel[],
    idField: string,
    selectionData?: Map<string, any>,
    tabIndex = 0
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
        tabIndex,
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
    readOnlyColumns?: string[],
    insertColumns?: QueryColumn[],
    updateColumns?: QueryColumn[],
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

export function genCellKey(colIdx: number, rowIdx: number): string {
    return [colIdx, rowIdx].join('-');
}

export function parseCellKey(cellKey: string): CellCoordinates {
    const [colIdx, rowIdx] = cellKey.split('-');

    return {
        colIdx: parseInt(colIdx, 10),
        rowIdx: parseInt(rowIdx, 10),
    };
}

/**
 * Sorts cell keys left to right, top to bottom.
 */
export function sortCellKeys(cellKeys: string[]): string[] {
    return Array.from(new Set(cellKeys)).sort((a, b) => {
        const aCoords = parseCellKey(a);
        const bCoords = parseCellKey(b);
        if (aCoords.rowIdx === bCoords.rowIdx) return aCoords.colIdx - bCoords.colIdx;
        return aCoords.rowIdx - bCoords.rowIdx;
    });
}

// https://stackoverflow.com/questions/10713878/decimal-subtraction-problems-in-javascript
export function decimalDifference(first, second, subtract = true): number {
    const multiplier = 10000; // this will only help/work to 4 decimal places
    return (first * multiplier + (subtract ? -1 : 1) * second * multiplier) / multiplier;
}

/**
 * Returns true if the selection is sparse. A sparse selection is one where a continuous set of cells in a rectangle are
 * not selected. It may look something like this:
 *  0 1 1 0 0
 *  0 0 0 1 1
 *  0 1 1 0 0
 * @param selection: An array of cell keys representing the selected cells, ordered left to right, top to bottom.
 */
function isSparseSelection(selection: string[]): boolean {
    if (selection.length === 0) return false;

    const firstCell = parseCellKey(selection[0]);
    const lastCell = parseCellKey(selection[selection.length - 1]);
    const minCol = firstCell.colIdx;
    const maxCol = lastCell.colIdx;
    const minRow = firstCell.rowIdx;
    const maxRow = lastCell.rowIdx;
    const expectedCellCount = (maxCol - minCol + 1) * (maxRow - minRow + 1);

    // If the expected size is wrong we can short circuit and return
    if (selection.length !== expectedCellCount) return true;

    let selIdx = 0;

    // If the sizes match, then we need to generate the expected cellKeys in the order we expect them, and if they don't
    // all match we know it's a sparse selection.
    for (let rowIdx = minRow; rowIdx <= maxRow; rowIdx++) {
        for (let colIdx = minCol; colIdx <= maxCol; colIdx++) {
            const expectedCellKey = genCellKey(colIdx, rowIdx);
            const actualCellKey = selection[selIdx];

            if (expectedCellKey !== actualCellKey) return true;

            selIdx++;
        }
    }

    return false;
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
    openMenuOnFocus: true,
    placeholder: '',
    showIndicatorSeparator: false,
    showLabel: false,
};

/**
 * Computes the new range for a given grid dimension when expanding or contracting in a particular direction.
 * @param selectedIdx: The index of the currently selected cell
 * @param min: The minimum of the current range
 * @param max: The maximum of the current range
 * @param direction: number in the range of -1, 1.
 *  - If -1, we are moving up or left
 *  - If 0 we are not moving
 *  - If 1 we are moving down or right
 */
export function computeRangeChange(selectedIdx: number, min: number, max: number, direction: number): [number, number] {
    if (direction === 0) {
        // If we haven't changed direction then we don't need to expand or contract the range at all
        return [min, max];
    }

    if (min === max) {
        // A single selected cell is a bit of a special case, because we'll be extending either before or after
        if (direction === 1) {
            // Extend forward
            max = max + 1;
        } else {
            // Extend backward
            min = min - 1;
        }
    } else if (min < selectedIdx) {
        // The selected area is above or left of the currently selected index
        if (direction === 1) {
            // We're shrinking forwards
            min = min + 1;
        } else {
            // We're extending backwards
            min = min - 1;
        }
    } else {
        if (direction === 1) {
            // We're extending forwards
            max = max + 1;
        } else {
            // We're shrinking backwards
            max = max - 1;
        }
    }

    return [Math.max(0, min), max];
}
