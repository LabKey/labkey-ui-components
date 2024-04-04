import { Filter, Utils } from '@labkey/api';
import { fromJS, List, Map, OrderedMap, Set as ImmutableSet } from 'immutable';
import moment from 'moment';

import { ExtendedMap } from '../../../public/ExtendedMap';
import { LoadingState } from '../../../public/LoadingState';
import { QueryColumn } from '../../../public/QueryColumn';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { QueryInfo } from '../../../public/QueryInfo';
import { GRID_EDIT_INDEX } from '../../constants';
import { cancelEvent, getPasteValue, setCopyValue } from '../../events';
import { GridData } from '../../models';
import { formatDate, formatDateTime, parseDate } from '../../util/Date';
import { caseInsensitive, isFloat, isInteger, parseCsvString, parseScientificInt } from '../../util/utils';
import { ViewInfo } from '../../ViewInfo';

import { selectRows } from '../../query/selectRows';

import {
    CellMessage,
    CellMessages,
    CellValues,
    EditableColumnMetadata,
    EditableGridLoader,
    EditableGridModels,
    EditorMode,
    EditorModel,
    EditorModelAndGridData,
    EditorModelUpdates,
    MessageAndValue,
    ValueDescriptor,
} from './models';

import { decimalDifference, genCellKey, getLookupFilters, parseCellKey } from './utils';

const EMPTY_ROW = Map<string, any>();
let ID_COUNTER = 0;

/**
 * @deprecated Use initEditableGridModel() or initEditableGridModels() instead.
 * This method does not make use the grid loader paradigm. Usages of this method directly
 * is susceptible to data misalignment errors with the associated view.
 */
export const loadEditorModelData = async (
    queryModelData: Partial<QueryModel>,
    editorColumns?: QueryColumn[],
    forUpdate?: boolean
): Promise<Partial<EditorModel>> => {
    const { orderedRows, rows, queryInfo } = queryModelData;
    const columns = editorColumns ?? queryInfo.getInsertColumns();
    const lookupValueDescriptors = await getLookupValueDescriptors(
        columns,
        fromJS(rows),
        fromJS(orderedRows),
        forUpdate
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
        columns: List(columns.map(col => col.fieldKey)),
        deletedIds: ImmutableSet<any>(),
        rowCount: orderedRows.length,
    };
};

export const initEditableGridModel = async (
    dataModel: QueryModel,
    editorModel: EditorModel,
    loader: EditableGridLoader,
    queryModel: QueryModel,
    colFilter?: (col: QueryColumn) => boolean
): Promise<{ dataModel: QueryModel; editorModel: EditorModel }> => {
    const response = await loader.fetch(queryModel);
    const gridData: Partial<QueryModel> = {
        rows: response.data.toJS(),
        orderedRows: response.dataIds.toArray(),
        queryInfo: loader.queryInfo,
    };

    let columns: QueryColumn[];
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

    const editorModelData = await loadEditorModelData(gridData, columns, forUpdate);

    return {
        dataModel: dataModel.mutate({
            ...gridData,
            rowsLoadingState: LoadingState.LOADED,
            queryInfoLoadingState: LoadingState.LOADED,
        }),
        editorModel: editorModel.merge(editorModelData) as EditorModel,
    };
};

export const initEditableGridModels = async (
    dataModels: QueryModel[],
    editorModels: EditorModel[],
    loaders: EditableGridLoader[],
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

export function parseIntIfNumber(val: any): number | string {
    const intVal = !isNaN(val) ? parseInt(val, 10) : undefined;
    return intVal === undefined || isNaN(intVal) ? val : intVal;
}

const resolveDisplayColumn = (column: QueryColumn): string => {
    // Handle MVFK
    if (column.multiValue && column.isJunctionLookup()) {
        const parts = column.displayField.split('$S');
        if (parts.length > 1) return parts[1];
    }

    return column.lookup.displayColumn;
};

type ColumnLoaderPromise = Promise<{ column: QueryColumn; descriptors: ValueDescriptor[] }>;

const findLookupValues = async (
    column: QueryColumn,
    lookupKeyValues?: any[],
    lookupValues?: any[],
    lookupValueFilters?: Filter.IFilter[],
    forUpdate?: boolean
): ColumnLoaderPromise => {
    const { lookup } = column;
    const { keyColumn } = lookup;
    const displayColumn = resolveDisplayColumn(column);

    const results = await selectRows({
        columns: [displayColumn, keyColumn],
        containerPath: lookup.containerPath,
        filterArray: getLookupFilters(
            column,
            lookupKeyValues,
            lookupValues,
            lookupValueFilters,
            forUpdate,
            displayColumn
        ),
        includeTotalCount: false,
        maxRows: -1,
        schemaQuery: lookup.schemaQuery,
        viewName: ViewInfo.DETAIL_NAME, // Use the detail view so values that may be filtered out of the default view show up.
    });

    const descriptors = results.rows.reduce<ValueDescriptor[]>((desc, row) => {
        const key = caseInsensitive(row, keyColumn)?.value;
        if (key !== undefined && key !== null) {
            const displayRow = caseInsensitive(row, displayColumn);
            desc.push({ display: displayRow?.displayValue || displayRow?.value, raw: key });
        }
        return desc;
    }, []);

    return { column, descriptors };
};

async function getLookupValueDescriptors(
    columns: QueryColumn[],
    rows: Map<any, Map<string, any>>,
    ids: List<any>,
    forUpdate?: boolean
): Promise<{ [colKey: string]: ValueDescriptor[] }> {
    const descriptorMap = {};
    // for each lookup column, find the unique values in the rows and query for those values when they look like ids
    for (let cn = 0; cn < columns.length; cn++) {
        const col = columns[cn];
        let values = ImmutableSet<number>();

        if (col.isPublicLookup()) {
            ids.forEach(id => {
                const row = rows.get(id);
                const value = row?.get(col.fieldKey);
                if (Utils.isNumber(value)) {
                    values = values.add(value);
                } else if (List.isList(value)) {
                    value.forEach(val => {
                        values = values.add(val);
                    });
                }
            });
            if (!values.isEmpty()) {
                const { descriptors } = await findLookupValues(col, values.toArray(), undefined, undefined, forUpdate);
                descriptorMap[col.lookupKey] = descriptors;
            }
        }
    }

    return descriptorMap;
}

export async function getLookupDisplayValue(column: QueryColumn, value: any): Promise<MessageAndValue> {
    if (value === undefined || value === null || typeof value === 'string') {
        return {
            valueDescriptor: {
                display: value,
                raw: value,
            },
        };
    }

    let message: CellMessage;

    const { descriptors } = await findLookupValues(column, [value]);
    if (!descriptors.length) {
        message = {
            message: 'Could not find data for ' + value,
        };
    }

    return {
        message,
        valueDescriptor: descriptors[0],
    };
}

async function prepareInsertRowDataFromBulkForm(
    insertColumns: List<QueryColumn>,
    rowData: List<any>,
    colMin = 0
): Promise<{ messages: List<CellMessage>; values: List<List<ValueDescriptor>> }> {
    let values = List<List<ValueDescriptor>>();
    let messages = List<CellMessage>();

    for (let cn = 0; cn < rowData.size; cn++) {
        const data = rowData.get(cn);
        const colIdx = colMin + cn;
        const col = insertColumns.get(colIdx);
        let cv: List<ValueDescriptor>;

        if (data && col && col.isLookup()) {
            cv = List<ValueDescriptor>();
            // value had better be the rowId here, but it may be several in a comma-separated list.
            // If it's the display value, which happens to be a number, much confusion will arise.
            const values = data.toString().split(',');
            for (const val of values) {
                const { message, valueDescriptor } = await getLookupDisplayValue(col, parseIntIfNumber(val));
                cv = cv.push(valueDescriptor);
                if (message) {
                    messages = messages.push(message);
                }
            }
        } else {
            cv = List([{ display: data, raw: data }]);
        }

        values = values.push(cv);
    }

    return {
        values,
        messages,
    };
}

export async function addRowsToEditorModel(
    rowCount: number,
    cellMessages: CellMessages,
    cellValues: CellValues,
    insertColumns: List<QueryColumn>,
    rowData: List<any>,
    numToAdd: number,
    rowMin = 0
): Promise<Partial<EditorModel>> {
    const selectionCells: string[] = [];
    const preparedData = await prepareInsertRowDataFromBulkForm(insertColumns, rowData, 0);
    const { values, messages } = preparedData;

    for (let rowIdx = rowMin; rowIdx < rowMin + numToAdd; rowIdx++) {
        // eslint-disable-next-line no-loop-func
        rowData.forEach((value, colIdx) => {
            const cellKey = genCellKey(colIdx, rowIdx);
            cellMessages = cellMessages.set(cellKey, messages.get(colIdx));
            selectionCells.push(cellKey);
            cellValues = cellValues.set(cellKey, values.get(colIdx));
        });
    }

    return {
        cellValues,
        cellMessages,
        selectionCells,
        rowCount: Math.max(rowMin + Number(numToAdd), rowCount),
    };
}

function addRowsToGridData(
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    count: number,
    rowData?: Map<string, any>
): GridData {
    for (let i = 0; i < count; i++) {
        // ensure we don't step on another ID
        const id = GRID_EDIT_INDEX + ID_COUNTER++;
        data = data.set(id, rowData || EMPTY_ROW);
        dataKeys = dataKeys.push(id);
    }

    return { data, dataKeys };
}

export async function addRows(
    editorModel: EditorModel,
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    insertColumns: List<QueryColumn>,
    numToAdd: number,
    rowData?: Map<string, any>
): Promise<EditorModelAndGridData> {
    let editorModelChanges: Partial<EditorModel>;

    if (rowData) {
        editorModelChanges = await addRowsToEditorModel(
            editorModel.rowCount,
            editorModel.cellMessages,
            editorModel.cellValues,
            insertColumns,
            rowData.toList(),
            numToAdd,
            data.size
        );
    } else {
        editorModelChanges = { rowCount: editorModel.rowCount + numToAdd };
    }

    const dataChanges = addRowsToGridData(dataKeys, data, numToAdd, rowData);
    data = dataChanges.data;
    dataKeys = dataChanges.dataKeys;

    return { editorModel: editorModelChanges, data, dataKeys };
}

/**
 * Adds columns to the editor model and the underlying model's data
 * @param editorModel
 * @param queryInfo
 * @param originalData
 * @param queryColumns the ordered map of columns to be added
 * @param fieldKey the fieldKey of the existing column after which the new columns should be inserted.  If undefined
 * or the column is not found, columns will be added at the beginning.
 */
export function addColumns(
    editorModel: EditorModel,
    queryInfo: QueryInfo,
    originalData: Map<any, Map<string, any>>,
    queryColumns: ExtendedMap<string, QueryColumn>,
    fieldKey?: string
): EditorModelUpdates {
    if (queryColumns.size === 0) return {};

    // if fieldKey is provided, find that index and we will insert after it
    const leftColIndex = fieldKey ? editorModel.columns.findIndex(column => column?.toLowerCase() === fieldKey.toLowerCase()) : -1;
    if (fieldKey && leftColIndex === -1) return {};

    const editorModelIndex = leftColIndex + 1;
    const queryColIndex = queryInfo.getColumnIndex(fieldKey) + 1;

    const newCellMessages = editorModel.cellMessages.reduce((cellMessages, message, cellKey) => {
        const [oldColIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));
        if (oldColIdx >= editorModelIndex) {
            return cellMessages.set([oldColIdx + queryColumns.size, oldRowIdx].join('-'), message);
        } else if (oldColIdx < editorModelIndex) {
            return cellMessages.set(cellKey, message);
        }

        return cellMessages;
    }, Map<string, CellMessage>());

    let newCellValues = editorModel.cellValues.reduce((cellValues, value, cellKey) => {
        const [oldColIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));

        if (oldColIdx >= editorModelIndex) {
            return cellValues.set([oldColIdx + queryColumns.size, oldRowIdx].join('-'), value);
        } else if (oldColIdx < editorModelIndex) {
            return cellValues.set(cellKey, value);
        }

        return cellValues;
    }, Map<string, List<ValueDescriptor>>());

    for (let rowIdx = 0; rowIdx < editorModel.rowCount; rowIdx++) {
        for (let c = 0; c < queryColumns.size; c++) {
            newCellValues = newCellValues.set(genCellKey(editorModelIndex + c, rowIdx), List<ValueDescriptor>());
        }
    }

    const data = originalData
        .map(rowData => {
            queryColumns.forEach(column => {
                rowData = rowData.set(column.fieldKey, undefined);
            });
            return rowData;
        })
        .toMap();

    let { columns } = editorModel;
    queryColumns.valueArray.forEach((col, i) => {
        columns = columns.insert(i + editorModelIndex, col.fieldKey);
    });
    columns = columns.toList();

    return {
        editorModelChanges: {
            columns,
            focusColIdx: -1,
            focusRowIdx: -1,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: [],
            cellMessages: newCellMessages,
            cellValues: newCellValues,
        },
        data,
        queryInfo: queryInfo.mutate({ columns: queryInfo.columns.mergeAt(queryColIndex, queryColumns) }),
    };
}

export function changeColumn(
    editorModel: EditorModel,
    queryInfo: QueryInfo,
    originalData: Map<any, Map<string, any>>,
    existingFieldKey: string,
    newQueryColumn: QueryColumn
): EditorModelUpdates {
    const colIndex = editorModel.columns.findIndex(column => column === existingFieldKey);

    // nothing to do if there is no such column
    if (colIndex === -1) return {};

    // get rid of existing messages and values at the designated index.
    const newCellMessages = editorModel.cellMessages.reduce((cellMessages, message, cellKey) => {
        const [oldColIdx] = cellKey.split('-').map(v => parseInt(v, 10));
        if (oldColIdx !== colIndex) {
            return cellMessages.set(cellKey, message);
        }

        return cellMessages;
    }, Map<string, CellMessage>());

    const newCellValues = editorModel.cellValues.reduce((cellValues, value, cellKey) => {
        const [oldColIdx] = cellKey.split('-').map(v => parseInt(v, 10));

        if (oldColIdx !== colIndex) {
            return cellValues.set(cellKey, value);
        }

        return cellValues;
    }, Map<string, List<ValueDescriptor>>());

    const currentCol = queryInfo.getColumn(existingFieldKey);

    // remove existing column and set new column in data
    const data = originalData
        .map(rowData => {
            rowData = rowData.remove(currentCol.fieldKey);
            return rowData.set(newQueryColumn.fieldKey, undefined);
        })
        .toMap();

    const columns = new ExtendedMap<string, QueryColumn>();
    queryInfo.columns.forEach((column, key) => {
        if (column.fieldKey === currentCol.fieldKey) {
            columns.set(newQueryColumn.fieldKey.toLowerCase(), newQueryColumn);
        } else {
            columns.set(key, column);
        }
    });

    let editorModelColumns = editorModel.columns;
    const replaceIdx = editorModelColumns.findIndex(fieldKey => fieldKey === existingFieldKey);
    if (replaceIdx > -1) {
        editorModelColumns = editorModelColumns.set(replaceIdx, newQueryColumn.fieldKey);
    }

    return {
        editorModelChanges: {
            columns: editorModelColumns,
            focusColIdx: -1,
            focusRowIdx: -1,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: [],
            cellMessages: newCellMessages,
            cellValues: newCellValues,
        },
        data,
        queryInfo: queryInfo.mutate({ columns }),
    };
}

export function removeColumn(
    editorModel: EditorModel,
    queryInfo: QueryInfo,
    originalData: Map<any, Map<string, any>>,
    fieldKey: string
): EditorModelUpdates {
    const deleteIndex = editorModel.columns.findIndex(column => column === fieldKey);
    // nothing to do if there is no such column
    if (deleteIndex === -1) return {};

    const newCellMessages = editorModel.cellMessages.reduce((cellMessages, message, cellKey) => {
        const [oldColIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));
        if (oldColIdx > deleteIndex) {
            return cellMessages.set([oldColIdx - 1, oldRowIdx].join('-'), message);
        } else if (oldColIdx < deleteIndex) {
            return cellMessages.set(cellKey, message);
        }

        return cellMessages;
    }, Map<string, CellMessage>());

    const newCellValues = editorModel.cellValues.reduce((cellValues, value, cellKey) => {
        const [oldColIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));

        if (oldColIdx > deleteIndex) {
            return cellValues.set([oldColIdx - 1, oldRowIdx].join('-'), value);
        } else if (oldColIdx < deleteIndex) {
            return cellValues.set(cellKey, value);
        }

        return cellValues;
    }, Map<string, List<ValueDescriptor>>());

    // remove column from all rows in model data
    const data = originalData.map(rowData => rowData.remove(fieldKey)).toMap();

    let columns = editorModel.columns;
    const removeIdx = editorModel.columns.findIndex(colFieldKey => Utils.caseInsensitiveEquals(colFieldKey, fieldKey));
    if (removeIdx > -1) {
        columns = columns.remove(removeIdx);
    }

    return {
        editorModelChanges: {
            columns,
            focusColIdx: -1,
            focusRowIdx: -1,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: [],
            cellMessages: newCellMessages,
            cellValues: newCellValues,
        },
        data,
        queryInfo: queryInfo.mutate({
            columns: queryInfo.columns.filter(col => col.fieldKey.toLowerCase() !== fieldKey.toLowerCase()),
        }) as QueryInfo,
    };
}

async function prepareUpdateRowDataFromBulkForm(
    queryInfo: QueryInfo,
    rowData: OrderedMap<string, any>,
    isIncludedColumn?: (col: QueryColumn) => boolean
): Promise<{ messages: OrderedMap<number, CellMessage>; values: OrderedMap<number, List<ValueDescriptor>> }> {
    const columns = queryInfo.getInsertColumns(isIncludedColumn);
    let values = OrderedMap<number, List<ValueDescriptor>>();
    let messages = OrderedMap<number, CellMessage>();

    for (const colKey of rowData.keySeq().toArray()) {
        const data = rowData.get(colKey);
        const colIdx = columns.findIndex(col => col.fieldKey === colKey);
        const col = columns[colIdx];
        let cv: List<ValueDescriptor>;

        if (data && col && col.isLookup()) {
            cv = List<ValueDescriptor>();
            // value had better be the rowId here, but it may be several in a comma-separated list.
            // If it's the display value, which happens to be a number, much confusion will arise.
            const rawValues = data.toString().split(',');
            for (const val of rawValues) {
                const { message, valueDescriptor } = await getLookupDisplayValue(col, parseIntIfNumber(val));
                cv = cv.push(valueDescriptor);
                if (message) {
                    messages = messages.set(colIdx, message);
                }
            }
        } else {
            cv = List([{ display: data, raw: data }]);
        }

        values = values.set(colIdx, cv);
    }

    return { values, messages };
}

export async function updateGridFromBulkForm(
    editorModel: EditorModel,
    queryInfo: QueryInfo,
    rowData: OrderedMap<string, any>,
    dataRowIndexes: List<number>,
    lockedOrReadonlyRows?: number[],
    isIncludedColumn?: (col: QueryColumn) => boolean
): Promise<Partial<EditorModel>> {
    let cellMessages = editorModel.cellMessages;
    let cellValues = editorModel.cellValues;

    const preparedData = await prepareUpdateRowDataFromBulkForm(queryInfo, rowData, isIncludedColumn);
    const { values, messages } = preparedData; // {3: 'x', 4: 'z}

    dataRowIndexes.forEach(rowIdx => {
        if (lockedOrReadonlyRows && lockedOrReadonlyRows.indexOf(rowIdx) > -1) return;

        values.forEach((value, colIdx) => {
            const cellKey = genCellKey(colIdx, rowIdx);
            cellMessages = cellMessages.set(cellKey, messages.get(colIdx));
            cellValues = cellValues.set(cellKey, value);
        });
    });

    return { cellValues, cellMessages };
}

export async function addRowsPerPivotValue(
    editorModel: EditorModel,
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    insertColumns: List<QueryColumn>,
    numPerParent: number,
    pivotKey: string,
    pivotValues: string[],
    rowData: Map<string, any>
): Promise<EditorModelAndGridData> {
    let { cellMessages, cellValues, rowCount } = editorModel;

    if (numPerParent > 0) {
        for (const value of pivotValues) {
            rowData = rowData.set(pivotKey, value);
            const changes = await addRowsToEditorModel(
                rowCount,
                cellMessages,
                cellValues,
                insertColumns,
                rowData.toList(),
                numPerParent,
                dataKeys.size
            );
            cellMessages = changes.cellMessages;
            cellValues = changes.cellValues;
            rowCount = changes.rowCount;
            const dataChanges = addRowsToGridData(dataKeys, data, numPerParent, rowData);
            data = dataChanges.data;
            dataKeys = dataChanges.dataKeys;
        }
    }

    return { editorModel: { cellMessages, cellValues, rowCount }, data, dataKeys };
}

/**
 * This REGEX will match for any strings that are suffixed with a number, it has several capture groups to allow us to
 * easily grab the number and the prefix. The following values should match:
 *      ABC-123 captures as ['ABC-123', 'ABC-', '123', undefined]
 *      ABC123 captures as ['ABC123', 'ABC', '123', undefined]
 *      ABC-1.23 captures as ['ABC-1.23', 'ABC-', '1.23', '.23']
 *      ABC.123 captures as ['ABC.123', 'ABC.', '123', undefined]
 */
const POSTFIX_REGEX = /^(.*?)(\d+(\.\d+)?)$/;
type PrefixAndNumber = [string | undefined, string | undefined];

/**
 * Given a string it returns an array in the form of [prefix, number suffix]. If the string is not suffixed with a
 * number the number suffix is undefined. If the entire string is a number the prefix will be undefined. This method
 * intentionally does not parse the numbers.
 */
export function splitPrefixedNumber(text: string): PrefixAndNumber {
    if (text === undefined || text === null || text === '') return [undefined, undefined];
    const matches = text?.toString().match(POSTFIX_REGEX);

    if (matches === null) {
        return [text, undefined];
    }

    return [matches[1] === '' ? undefined : matches[1], matches[2]];
}

/**
 * Given an array of values computed by splitPrefixedNumber returns true if they all have the same prefix
 */
function everyValueHasSamePrefix(values: PrefixAndNumber[]): boolean {
    if (values.length === 0) return false;
    const prefix = values[0][0];
    return values.every(value => value[0] === prefix);
}

enum IncrementDirection {
    FORWARD,
    BACKWARD,
}

enum IncrementType {
    DATE,
    DATETIME,
    NONE,
    NUMBER,
}

interface SelectionIncrement {
    direction: IncrementDirection;
    increment?: number;
    incrementType: IncrementType;
    initialSelectionValues: Array<List<ValueDescriptor>>; // yes this is a very odd type, but we can clean it up when we rip out Immutable
    prefix?: string;
    startingValue: number | string;
}

function inferSelectionDirection(initialCellKeys: string[], cellKeysToFill: string[]): IncrementDirection {
    const initialMin = parseCellKey(initialCellKeys[0]);
    const fillMin = parseCellKey(cellKeysToFill[0]);

    if (initialMin.rowIdx < fillMin.rowIdx) return IncrementDirection.FORWARD;
    return IncrementDirection.BACKWARD;
}

function inferSelectionIncrement(
    editorModel: EditorModel,
    initialCellKeys: string[],
    cellKeysToFill: string[]
): SelectionIncrement {
    const direction = inferSelectionDirection(initialCellKeys, cellKeysToFill);
    const values = initialCellKeys.map(cellKey => editorModel.getValueForCellKey(cellKey));
    // use the display values to determine sequence type to account for lookup cell values with numeric key/raw values
    let displayValues = values.map(value => value.get(0)?.display);
    let firstValue = displayValues[0];
    let lastValue = displayValues[displayValues.length - 1];
    const firstValueIsEmpty = firstValue === undefined || firstValue === '';
    const isDateSeq = values.length === 1 && !firstValueIsEmpty && formatDate(parseDate(firstValue)) === firstValue;
    const isDateTimeSeq =
        values.length === 1 && !firstValueIsEmpty && formatDateTime(parseDate(firstValue)) === firstValue;

    // Date sequence detection takes precedence otherwise we'd never parse dates, because we'd always consider something
    // like 2023-06-01, 6/1/2023, or 1-6-2023, to be a prefixed number string.
    if (isDateSeq || isDateTimeSeq) {
        return {
            direction,
            increment: 1, // Right now we only increment dates by 1 day
            incrementType: isDateSeq ? IncrementType.DATE : IncrementType.DATETIME,
            initialSelectionValues: values,
            prefix: undefined,
            startingValue: direction === IncrementDirection.FORWARD ? lastValue : firstValue,
        };
    }

    let prefix;
    let incrementType = IncrementType.NONE;
    let increment;
    const splitValues = displayValues.map(splitPrefixedNumber);
    const allPrefixed = everyValueHasSamePrefix(splitValues);

    if (allPrefixed && splitValues[0][0] !== undefined) {
        prefix = splitValues[0][0];
        displayValues = splitValues.map(value => value[1]);
        firstValue = displayValues[0];
        lastValue = displayValues[displayValues.length - 1];
    }

    const isFloatSeq = values.length > 1 && displayValues.every(isFloat);
    const isIntSeq = values.length > 1 && displayValues.every(isInteger);

    if (isFloatSeq) {
        firstValue = parseFloat(firstValue);
        lastValue = parseFloat(lastValue);
    } else if (isIntSeq) {
        firstValue = parseScientificInt(firstValue);
        lastValue = parseScientificInt(lastValue);
    }

    if (isFloatSeq || isIntSeq) {
        // increment -> last value minus first value divide by the number of steps in the initial selection
        increment = decimalDifference(lastValue, firstValue);
        increment = increment / (displayValues.length - 1);
        incrementType = IncrementType.NUMBER;
    }

    return {
        direction,
        increment,
        incrementType,
        initialSelectionValues: values,
        prefix,
        startingValue: direction === IncrementDirection.FORWARD ? lastValue : firstValue,
    };
}

function getPkValue(row: any, queryInfo: QueryInfo): string {
    const keyCols = queryInfo.getPkCols();
    let key;

    if (keyCols.length === 1) {
        key = caseInsensitive(row.toJS(), keyCols[0].fieldKey);
        if (Array.isArray(key)) key = key[0];
        if (typeof key === 'object') key = key.value;
    }

    return key;
}

interface CellReadStatus {
    isLockedRow: boolean;
    isReadonlyCell: boolean;
    isReadonlyRow: boolean;
}

export function checkCellReadStatus(
    row: any,
    queryInfo: QueryInfo,
    columnMetadata: EditableColumnMetadata,
    readonlyRows: string[],
    lockedRows: string[]
): CellReadStatus {
    if (readonlyRows || columnMetadata?.isReadOnlyCell || lockedRows) {
        const keyCols = queryInfo.getPkCols();
        if (keyCols.length === 1) {
            const key = getPkValue(row, queryInfo);

            return {
                isReadonlyRow: readonlyRows && key ? readonlyRows.includes(key) : false,
                isReadonlyCell: columnMetadata?.isReadOnlyCell ? columnMetadata.isReadOnlyCell(key) : false,
                isLockedRow: lockedRows && key ? lockedRows.includes(key) : false,
            };
        } else {
            console.warn(
                'Setting readonly rows or cells for models with ' + keyCols.length + ' keys is not currently supported.'
            );
        }
    }

    return {
        isReadonlyRow: false,
        isReadonlyCell: false,
        isLockedRow: false,
    };
}

/**
 * Returns only the newly selected area given an initial selection and a final selection. These are the keys that will
 * be filled with generated data based on the initially selected data.
 * @param initialSelection: The area initially selected
 * @param finalSelection: The final area selected, including the initially selected area
 */
export function generateFillCellKeys(initialSelection: string[], finalSelection: string[]): string[][] {
    const firstInitial = parseCellKey(initialSelection[0]);
    const lastInitial = parseCellKey(initialSelection[initialSelection.length - 1]);
    const minCol = firstInitial.colIdx;
    const maxCol = lastInitial.colIdx;
    const initialMinRow = firstInitial.rowIdx;
    const initialMaxRow = lastInitial.rowIdx;
    const finalMinRow = parseCellKey(finalSelection[0]).rowIdx;
    const finalMaxRow = parseCellKey(finalSelection[finalSelection.length - 1]).rowIdx;
    let start;
    let end;

    if (finalMaxRow > initialMaxRow) {
        // Final selected area is below the initial selection, so we will be incrementing from the row after
        // initialMaxRow
        start = initialMaxRow + 1;
        end = finalMaxRow;
    } else {
        // Newly selected area is above the initial selection, so we will be incrementing from finalMinRow
        start = finalMinRow;
        end = initialMinRow - 1;
    }

    const fillCellKeys = [];

    // Construct arrays of columns, because we're going to generate fill sequences for columns
    for (let colIdx = minCol; colIdx <= maxCol; colIdx++) {
        const columnKeys = [];

        for (let rowIdx = start; rowIdx <= end; rowIdx++) {
            columnKeys.push(genCellKey(colIdx, rowIdx));
        }

        fillCellKeys.push(columnKeys);
    }

    return fillCellKeys;
}

/**
 * Fills a column of cells based on the initially selected values.
 * If the initialSelection is for a single cell, the fill operation will always be a copy of that value.
 * If the initialSelection includes a range of cells and all values are numeric (or numbers prefixed with the same
 * string), fill via a generated sequence where the step/diff is based on the first and last value in the initSelection.
 * if the initialSelection is a single row, and the value is a date (as determined by the date format set by the server)
 * then we will fill via a generated sequence that increments the date by one day each row.
 * If the initialSelection includes a range of cells and not all values are numeric, fill via a copy of all of the values
 * in initSelection.
 * @param editorModel An EditorModel object
 * @param column
 * @param columnMetadata
 * @param cellMessages The CellMessages object to mutate, we cannot use the one from EditorModel because we may need to
 * modify multiple columns of data in one event (see dragFillEvent).
 * @param cellValues The CellValues object to mutate, we cannot use the one from EditorModel because we may need to
 * modify multiple columns of data in one event (see dragFillEvent).
 * @param initialSelection An array of sorted cell keys, all from the same column that were initially selected
 * @param selectionToFill An array of sorted cell keys, all from the same column, to be filled with values based on the
 * content of initialSelection
 */
export async function fillColumnCells(
    editorModel: EditorModel,
    column: QueryColumn,
    columnMetadata: EditableColumnMetadata,
    cellMessages: CellMessages,
    cellValues: CellValues,
    initialSelection: string[],
    selectionToFill: string[]
): Promise<CellMessagesAndValues> {
    const { direction, increment, incrementType, prefix, startingValue, initialSelectionValues } =
        inferSelectionIncrement(editorModel, initialSelection, selectionToFill);

    if (direction === IncrementDirection.BACKWARD) {
        selectionToFill.reverse();
    }

    const displayValues = [];
    selectionToFill.forEach((cellKey, i) => {
        let fillValue = initialSelectionValues[i % initialSelectionValues.length];

        if (incrementType === IncrementType.NUMBER) {
            const amount = increment * (i + 1);
            let raw: number | string;

            if (direction === IncrementDirection.FORWARD) {
                raw = decimalDifference(amount, startingValue as number, false);
            } else {
                raw = decimalDifference(startingValue as number, amount, true);
            }

            if (prefix !== undefined) raw = prefix + raw;
            const display = raw.toString();
            fillValue = List([{ raw, display }]);
            displayValues.push(display);
        } else if (incrementType === IncrementType.DATE || incrementType === IncrementType.DATETIME) {
            const dateValue = moment(parseDate(startingValue as string));

            if (direction === IncrementDirection.FORWARD) {
                dateValue.add(i + 1, 'days');
            } else {
                dateValue.subtract(i + 1, 'days');
            }

            const raw =
                incrementType === IncrementType.DATE
                    ? formatDate(dateValue.toDate())
                    : formatDateTime(dateValue.toDate());
            displayValues.push(raw);
            fillValue = List([{ raw, display: raw }]);
        }

        cellValues = cellValues.set(cellKey, fillValue);
    });

    // If the column is a lookup, and we've generated new displayValues, then we need to query for the rowIds so we can
    // set the correct raw values, otherwise insert will fail. This is most common for samples where we increment sample
    // names during drag fill so S-1 becomes S-2, S-3, etc.
    if (column.isPublicLookup() && displayValues.length) {
        const filteredLookupValues = columnMetadata?.filteredLookupValues?.toArray();
        const { descriptors } = await findLookupValues(column, undefined, displayValues);
        selectionToFill.forEach(cellKey => {
            const display = cellValues.get(cellKey).get(0).display;
            const { message, values } = parsePastedLookup(column, descriptors, filteredLookupValues ?? display);
            cellValues = cellValues.set(cellKey, values);
            cellMessages = cellMessages.set(cellKey, message);
        });
    }

    return { cellValues, cellMessages };
}

type CellMessagesAndValues = Pick<EditorModel, 'cellMessages' | 'cellValues'>;

/**
 * @param editorModel
 * @param initialSelection The initial selection before the selection was expanded
 * @param dataKeys The orderedRows Object from a QueryModel
 * @param data The rows object from a QueryModel
 * @param queryInfo A QueryInfo
 * @param columns
 * @param columnMetadata Array of column metadata, in the same order as the columns in the grid
 * @param readonlyRows A list of readonly rows
 * @param lockedRows A list of locked rows
 */
export async function dragFillEvent(
    editorModel: EditorModel,
    initialSelection: string[],
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    queryInfo: QueryInfo,
    columns: QueryColumn[],
    columnMetadata: EditableColumnMetadata[],
    readonlyRows: string[],
    lockedRows: string[]
): Promise<CellMessagesAndValues> {
    const finalSelection = editorModel.selectionCells;
    let cellValues = editorModel.cellValues;
    let cellMessages = editorModel.cellMessages;

    // If the selection size hasn't changed, then the selection hasn't changed, so return the existing cellValues
    if (finalSelection.length === initialSelection.length) return { cellMessages, cellValues };

    const selectionToFill = generateFillCellKeys(initialSelection, finalSelection);
    for (const columnCells of selectionToFill) {
        const { colIdx } = parseCellKey(columnCells[0]);
        const initialSelectionByCol = initialSelection.filter(cellKey => parseCellKey(cellKey).colIdx === colIdx);
        const column = columns[colIdx];
        const metadata = columnMetadata[colIdx];

        // Don't manipulate any values in read only columns
        if (column.readOnly) {
            continue;
        }

        const selectionToFillByCol = columnCells.filter(cellKey => {
            const { rowIdx } = parseCellKey(cellKey);
            const row = data.get(dataKeys.get(rowIdx));
            const { isReadonlyCell, isReadonlyRow, isLockedRow } = checkCellReadStatus(
                row,
                queryInfo,
                metadata,
                readonlyRows,
                lockedRows
            );
            return !isReadonlyCell && !isReadonlyRow && !isLockedRow;
        });

        // eslint-disable-next-line no-await-in-loop
        const messagesAndValues = await fillColumnCells(
            editorModel,
            column,
            metadata,
            cellMessages,
            cellValues,
            initialSelectionByCol,
            selectionToFillByCol
        );
        cellValues = messagesAndValues.cellValues;
        cellMessages = messagesAndValues.cellMessages;
    }

    return { cellMessages, cellValues };
}

/**
 * Expands the pasted data in the X and/or Y direction if the user has selected an area that is a multiple of X or Y.
 *
 * For example:
 * If the user copied two rows and two columns to their clipboard, but selected four rows and two columns on the grid we
 * would paste the contents twice across the four selected rows. If they had selected two rows and four columns we would
 * paste the contents twice across the selected columns.
 */
function expandPaste(model: EditorModel, payload: ParsePastePayload): ParsePastePayload {
    const selection = model.selectionCells;
    const minSelection = parseCellKey(selection[0]);
    const maxSelection = parseCellKey(selection[selection.length - 1]);
    const selectionColCount = maxSelection.colIdx - minSelection.colIdx + 1;
    const selectionRowCount = maxSelection.rowIdx - minSelection.rowIdx + 1;
    let { data, numCols, numRows } = payload;

    if (selectionColCount > payload.numCols && selectionColCount % payload.numCols === 0) {
        const colCopyMultiple = selectionColCount / payload.numCols;
        numCols = payload.numCols * colCopyMultiple;
        data = data.reduce((reduction, row) => {
            let updatedRow = row;
            for (let i = 0; i < colCopyMultiple - 1; i++) {
                updatedRow = updatedRow.concat(row).toList();
            }

            return reduction.push(updatedRow);
        }, List<List<string>>());
    }

    if (selectionRowCount > payload.numRows && selectionRowCount % payload.numRows === 0) {
        const rowCopyMultiple = selectionRowCount / payload.numRows;
        numRows = payload.numRows * rowCopyMultiple;
        const originalRows = data;
        for (let i = 0; i < rowCopyMultiple - 1; i++) {
            data = data.concat(originalRows).toList();
        }
    }

    return { data, numCols, numRows };
}

function validatePaste(
    model: EditorModel,
    colMin: number,
    rowMin: number,
    value: string,
    readOnlyRowCount?: number
): PasteModel {
    const maxRowPaste = 1000;
    let success = true;
    let message;
    let payload = parsePaste(value);

    if (model.isMultiSelect) {
        payload = expandPaste(model, payload);
    }

    const coordinates = {
        colMax: colMin + payload.numCols - 1,
        colMin,
        rowMax: rowMin + payload.numRows - 1,
        rowMin,
    };

    // If P = 1 then target can be 1 or M
    // If P = M(x,y) then target can be 1 or exact M(x,y)
    if (coordinates.colMax >= model.columns.size) {
        success = false;
        message = 'Unable to paste. Cannot paste columns beyond the columns found in the grid.';
    } else if (coordinates.rowMax - coordinates.rowMin > maxRowPaste) {
        success = false;
        message = 'Unable to paste. Cannot paste more than ' + maxRowPaste + ' rows.';
    }

    return {
        coordinates,
        message,
        payload,
        rowsToAdd: Math.max(
            0,
            coordinates.rowMin + payload.numRows + (readOnlyRowCount ? readOnlyRowCount : 0) - model.rowCount
        ),
        success,
    };
}

type ParsePastePayload = {
    data: List<List<string>>;
    numCols: number;
    numRows: number;
};

type PasteModel = {
    coordinates: {
        colMax: number;
        colMin: number;
        rowMax: number;
        rowMin: number;
    };
    message?: string;
    payload: ParsePastePayload;
    rowsToAdd: number;
    success: boolean;
};

function parsePaste(value: string): ParsePastePayload {
    let numCols = 0;
    let data = List<List<string>>();

    if (value === undefined || value === null || typeof value !== 'string') {
        return { data, numCols, numRows: 0 };
    }

    // remove trailing newline from pasted data to avoid creating an empty row of cells
    if (value.endsWith('\n')) value = value.substring(0, value.length - 1);

    value.split('\n').forEach(rv => {
        const columns = List(rv.split('\t'));
        if (numCols < columns.size) {
            numCols = columns.size;
        }
        data = data.push(columns);
    });

    // Normalize the number columns in each row in case a user pasted rows with different numbers of columns in them
    data = data
        .map(columns => {
            if (columns.size < numCols) {
                const remainder = [];
                for (let i = columns.size; i < numCols; i++) {
                    remainder.push('');
                }
                return columns.push(...remainder);
            }
            return columns;
        })
        .toList();

    return {
        data,
        numCols,
        numRows: data.size,
    };
}

interface ParseLookupPayload {
    message?: CellMessage;
    values: List<ValueDescriptor>;
}

function parsePastedLookup(column: QueryColumn, descriptors: ValueDescriptor[], value: string): ParseLookupPayload {
    if (value === undefined || value === null || typeof value !== 'string') {
        return {
            values: List([
                {
                    display: value,
                    raw: value,
                },
            ]),
        };
    }

    let message: CellMessage;
    const unmatched: string[] = [];

    // parse pasted strings to split properly around quoted values.
    // Remove the quotes for storing the actual values in the grid.
    const values = parseCsvString(value, ',', true)
        .map(v => {
            const vt = v.trim();
            if (vt.length > 0) {
                const vl = vt.toLowerCase();
                const vd = descriptors.find(d => d.display && d.display.toString().toLowerCase() === vl);
                if (!vd) {
                    unmatched.push(vt);
                    return { display: vt, raw: vt };
                } else {
                    return vd;
                }
            }
        })
        .filter(v => v !== undefined)
        .reduce((list, v) => list.push(v), List<ValueDescriptor>());

    if (unmatched.length) {
        message = {
            message:
                'Could not find data for ' +
                unmatched
                    .slice(0, 4)
                    .map(u => '"' + u + '"')
                    .join(', '),
        };
    }

    return {
        message,
        values,
    };
}

function isReadonlyRow(row: Map<string, any>, pkCols: QueryColumn[], readonlyRows: string[]): boolean {
    if (pkCols.length === 1 && row) {
        const pkValue = caseInsensitive(row.toJS(), pkCols[0].fieldKey);
        return readonlyRows.includes(pkValue);
    }

    return false;
}

function insertPastedData(
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    queryInfo: QueryInfo,
    columns: QueryColumn[],
    editorModel: EditorModel,
    paste: PasteModel,
    lookupDescriptorMap: { [colKey: string]: ValueDescriptor[] },
    columnMetadata: Map<string, EditableColumnMetadata>,
    readonlyRows: string[],
    lockedRows: string[],
    lockRowCount: boolean,
    selectCells: boolean
): EditorModelAndGridData {
    const pastedData = paste.payload.data;
    let cellMessages = editorModel.cellMessages;
    let cellValues = editorModel.cellValues;
    const selectionCells: string[] = [];
    let rowCount = editorModel.rowCount;
    let updatedDataKeys: List<any>;
    let updatedData: Map<any, Map<string, any>>;

    if (paste.rowsToAdd > 0 && !lockRowCount) {
        rowCount += paste.rowsToAdd;
        const dataChanges = addRowsToGridData(dataKeys, data, paste.rowsToAdd);
        updatedData = dataChanges.data;
        updatedDataKeys = dataChanges.dataKeys;
    }

    const { colMin, rowMin } = paste.coordinates;
    const pkCols = queryInfo.getPkCols();
    let rowIdx = rowMin;
    let hasReachedRowLimit = false;
    let allReadOnlyRows;

    if (readonlyRows && lockedRows) {
        allReadOnlyRows = readonlyRows.concat(lockedRows);
    } else if (readonlyRows) {
        allReadOnlyRows = readonlyRows;
    } else if (lockedRows) {
        allReadOnlyRows = lockedRows;
    }

    pastedData.forEach(row => {
        if (hasReachedRowLimit && lockRowCount) return;

        if (allReadOnlyRows) {
            while (rowIdx < rowCount && isReadonlyRow(data.get(dataKeys.get(rowIdx)), pkCols, allReadOnlyRows)) {
                // Skip over readonly rows
                rowIdx++;
            }

            if (rowIdx >= rowCount) {
                hasReachedRowLimit = true;
                return;
            }
        }

        const pkValue = getPkValue(row, queryInfo);

        row.forEach((value, cn) => {
            const colIdx = colMin + cn;
            const cellKey = genCellKey(colIdx, rowIdx);
            const col = columns[colIdx];
            const metadata = columnMetadata?.get(col?.fieldKey.toLowerCase());
            let cv: List<ValueDescriptor>;
            let msg: CellMessage;

            if (col?.isPublicLookup()) {
                const { message, values } = parsePastedLookup(col, lookupDescriptorMap[col.lookupKey], value);
                cv = values;

                if (message) {
                    msg = message;
                }
            } else {
                cv = List([{ display: value, raw: value }]);
            }

            const readOnlyCol = col?.readOnly || metadata?.readOnly;
            const readOnlyCell = metadata?.isReadOnlyCell(pkValue);

            if (!readOnlyCol && !readOnlyCell) {
                if (msg) {
                    cellMessages = cellMessages.set(cellKey, msg);
                } else {
                    cellMessages = cellMessages.remove(cellKey);
                }
                cellValues = cellValues.set(cellKey, cv);
            }

            if (selectCells) {
                selectionCells.push(cellKey);
            }
        });

        rowIdx++;
    });

    return {
        editorModel: { cellMessages, cellValues, rowCount, selectionCells },
        data: updatedData,
        dataKeys: updatedDataKeys,
    };
}

function getReadonlyRowCount(
    rowCount: number,
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    queryInfo: QueryInfo,
    startRowInd: number,
    readonlyRows: string[]
): number {
    const pkCols = queryInfo.getPkCols();

    // Rows with multiple PKs are always read-only
    if (pkCols.length !== 1) {
        return rowCount - startRowInd;
    }

    return dataKeys.slice(startRowInd, rowCount).reduce((total, index) => {
        if (isReadonlyRow(data.get(dataKeys.get(index)), pkCols, readonlyRows)) total++;
        return total;
    }, 0);
}

// Gets the non-blank values pasted for each column.  The values in the resulting lists may not align to the rows
// pasted if there were empty cells within the paste block.
function getPasteValuesByColumn(paste: PasteModel): List<List<string>> {
    const { data } = paste.payload;
    const valuesByColumn = List<List<string>>().asMutable();

    for (let i = 0; i < data.get(0).size; i++) {
        valuesByColumn.push(List<string>().asMutable());
    }
    data.forEach(row => {
        row.forEach((value, index) => {
            // if values contain commas, users will need to paste the values enclosed in quotes
            // but we don't want to retain these quotes for purposes of selecting values in the grid
            parseCsvString(value, ',', true).forEach(v => {
                if (v.trim().length > 0) valuesByColumn.get(index).push(v.trim());
            });
        });
    });
    return valuesByColumn.asImmutable();
}

export async function validateAndInsertPastedData(
    editorModel: EditorModel,
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    queryInfo: QueryInfo,
    columns: QueryColumn[],
    value: string,
    columnMetadata: Map<string, EditableColumnMetadata>,
    readonlyRows: string[],
    lockedRows: string[],
    lockRowCount: boolean,
    forUpdate: boolean,
    selectCells: boolean
): Promise<EditorModelAndGridData> {
    const { selectedColIdx, selectedRowIdx } = editorModel;
    const readOnlyRowCount =
        readonlyRows && !lockRowCount
            ? getReadonlyRowCount(editorModel.rowCount, dataKeys, data, queryInfo, selectedRowIdx, readonlyRows)
            : 0;
    const paste = validatePaste(editorModel, selectedColIdx, selectedRowIdx, value, readOnlyRowCount);

    if (paste.success) {
        const byColumnValues = getPasteValuesByColumn(paste);
        const { colMax, colMin } = paste.coordinates;

        // prior to load, ensure lookup column stores are loaded
        const columnLoaders = columns.reduce<ColumnLoaderPromise[]>((arr, column, index) => {
            if (column.isPublicLookup() && !column.readOnly) {
                const metadata = columnMetadata?.get(column.fieldKey.toLowerCase());
                let lookupValues = metadata?.filteredLookupValues?.toArray();

                if (
                    lookupValues === undefined &&
                    index >= colMin &&
                    index <= colMax &&
                    byColumnValues.get(index - colMin).size > 0
                ) {
                    lookupValues = byColumnValues.get(index - colMin).toArray();
                }

                if (lookupValues !== undefined) {
                    arr.push(
                        findLookupValues(column, undefined, lookupValues, metadata?.lookupValueFilters, forUpdate)
                    );
                }
            }
            return arr;
        }, []);

        const results = await Promise.all(columnLoaders);
        const descriptorMap = results.reduce((reduction, result) => {
            const { column, descriptors } = result;
            reduction[column.lookupKey] = descriptors;
            return reduction;
        }, {});
        return insertPastedData(
            dataKeys,
            data,
            queryInfo,
            columns,
            editorModel,
            paste,
            descriptorMap,
            columnMetadata,
            readonlyRows,
            lockedRows,
            lockRowCount,
            selectCells
        );
    } else {
        const cellKey = genCellKey(selectedColIdx, selectedRowIdx);
        return {
            data: undefined,
            dataKeys: undefined,
            editorModel: { cellMessages: editorModel.cellMessages.set(cellKey, { message: paste.message }) },
        };
    }
}

export async function pasteEvent(
    editorModel: EditorModel,
    dataKeys: List<any>,
    data: Map<any, Map<string, any>>,
    queryInfo: QueryInfo,
    columns: QueryColumn[],
    event: any,
    columnMetadata: Map<string, EditableColumnMetadata>,
    readonlyRows: string[],
    lockedRows: string[],
    lockRowCount: boolean,
    forUpdate: boolean
): Promise<EditorModelAndGridData> {
    // If a cell has focus do not accept incoming paste events -- allow for normal paste to input
    if (editorModel && editorModel.hasSelection && !editorModel.hasFocus) {
        cancelEvent(event);
        const value = getPasteValue(event);
        return await validateAndInsertPastedData(
            editorModel,
            dataKeys,
            data,
            queryInfo,
            columns,
            value,
            columnMetadata,
            readonlyRows,
            lockedRows,
            lockRowCount,
            forUpdate,
            true
        );
    }

    return { data: undefined, dataKeys: undefined, editorModel: undefined };
}

function getCellCopyValue(valueDescriptors: List<ValueDescriptor>): string {
    let value = '';

    if (valueDescriptors && valueDescriptors.size > 0) {
        let sep = '';
        value = valueDescriptors.reduce((agg, vd) => {
            agg += sep + (vd.display !== undefined ? vd.display.toString().trim() : '');
            sep = ', ';
            return agg;
        }, value);
    }

    return value;
}

function getCopyValue(model: EditorModel, insertColumns: QueryColumn[]): string {
    let copyValue = '';
    const EOL = '\n';
    const selectionCells = [...model.selectionCells];
    selectionCells.push(genCellKey(model.selectedColIdx, model.selectedRowIdx));

    for (let rn = 0; rn < model.rowCount; rn++) {
        let cellSep = '';
        let inSelection = false;

        insertColumns.forEach((col, cn) => {
            const cellKey = genCellKey(cn, rn);

            if (selectionCells.find(key => key === cellKey)) {
                inSelection = true;
                copyValue += cellSep + getCellCopyValue(model.cellValues.get(cellKey));
                cellSep = '\t';
            }
        });

        if (inSelection) {
            copyValue += EOL;
        }
    }

    if (copyValue[copyValue.length - 1] === EOL) {
        copyValue = copyValue.slice(0, copyValue.length - 1);
    }

    return copyValue;
}

export function copyEvent(editorModel: EditorModel, insertColumns: QueryColumn[], event: any): boolean {
    if (editorModel && !editorModel.hasFocus && editorModel.hasSelection && !editorModel.isSparseSelection) {
        cancelEvent(event);
        setCopyValue(event, getCopyValue(editorModel, insertColumns));
        return true;
    }

    return false;
}
