import { Filter, getServerContext, QueryKey, Utils } from '@labkey/api';
import { fromJS, List, Map, OrderedMap } from 'immutable';
import { addDays, subDays } from 'date-fns';

import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { cancelEvent, getPasteValue, setCopyValue } from '../../events';
import { formatDate, formatDateTime, getDateTimeDisplayValueFromStr, parseDate } from '../../util/Date';
import {
    caseInsensitive,
    isFloat,
    isInteger,
    parseCsvString,
    parseScientificInt,
    quoteValueWithDelimiters,
} from '../../util/utils';
import { ViewInfo } from '../../ViewInfo';

import { getContainerFilterForLookups } from '../../query/api';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { lookupValidationErrorMessage, resolveErrorMessage } from '../../util/messaging';

import {
    CellMessage,
    EditableColumnMetadata,
    EditableGridLoader,
    EditorMode,
    EditorModel,
    EditorModelProps,
    ValueDescriptor,
} from './models';

import { decimalDifference, genCellKey, getLookupFilters, getValidatedEditableGridValue, parseCellKey } from './utils';

/**
 * Do not use this method directly, use initEditorModel instead.
 * Exported for jest testing.
 */
export const loadEditorModelData = async (
    orderedRows: string[],
    rows: Record<string, any>,
    columns: QueryColumn[],
    forUpdate: boolean,
    api?: ComponentsAPIWrapper
): Promise<Partial<EditorModel>> => {
    const lookupValues = await getLookupValueDescriptors(columns, rows, orderedRows, forUpdate, api);
    const cellMessages: Record<string, CellMessage> = {};
    const cellValues: Record<string, List<ValueDescriptor>> = {};

    // data is initialized in column order
    columns.forEach(col => {
        orderedRows.forEach((id, rn) => {
            const row = rows[id];
            const cellKey = genCellKey(col.fieldKey, rn);

            // Our loaders (e.g. EditableGridLoaderFromSelection) use data objects from selectRows which has
            // rows objects keyed by column name for base table columns and by fieldKey for lookup columns
            // (see comments in QueryColumn index()).
            const value = row[col.index];
            let descriptors: ValueDescriptor[];

            if (Array.isArray(value)) {
                descriptors = value.reduce<ValueDescriptor[]>((list, v) => {
                    list.push(...resolveValueDescriptors(col, lookupValues, cellMessages, cellKey, v));
                    return list;
                }, []);
            } else {
                // Issue 37833: try resolving the value for the lookup to get the displayValue to show in the grid cell
                descriptors = resolveValueDescriptors(col, lookupValues, cellMessages, cellKey, value);
            }

            cellValues[cellKey] = List(descriptors);
        });
    });

    return { cellMessages: Map(cellMessages), cellValues: Map(cellValues) };
};

export const initEditorModel = async (
    loader: EditableGridLoader,
    columnMetadata?: Map<string, EditableColumnMetadata>
): Promise<EditorModel> => {
    const { columns: loaderColumns, queryInfo } = loader;
    const { data, dataIds } = await loader.fetch();
    const rows = data.toJS();
    const orderedRows = dataIds.toArray();
    const forUpdate = loader.mode === EditorMode.Update;
    let columns: QueryColumn[];

    if (loaderColumns) {
        columns = loaderColumns;
    } else if (forUpdate) {
        columns = queryInfo.getUpdateColumns();
    } else {
        columns = queryInfo.getInsertColumns();
    }

    // file input columns are not supported in the editable grid, so remove them
    columns = columns.filter(col => !col.isFileInput);

    // Calculate orderedColumns here before we add PK and Container columns to the columns array because they should
    // be hidden by default.
    const orderedColumns = columns.map(queryColumn => queryColumn.fieldKey.toLowerCase());
    const columnMap = columns.reduce((result, column) => {
        result[column.fieldKey.toLowerCase()] = column;
        return result;
    }, {});

    if (loader.extraColumns) {
        loader.extraColumns.forEach(col => {
            columnMap[col.fieldKey.toLowerCase()] = col;
            columns.push(col);
        });
    }

    if (forUpdate) {
        // If we're updating then we need to ensure that the pkCols and altUpdateKeys are in the columnMap
        queryInfo.getPkCols().forEach(pkCol => {
            if (!columnMap[pkCol.fieldKey.toLowerCase()]) {
                columnMap[pkCol.fieldKey.toLowerCase()] = pkCol;
                columns.push(pkCol);
            }
        });

        queryInfo.altUpdateKeys?.forEach(fieldKey => {
            const col = queryInfo.getColumn(fieldKey);
            if (col && !columnMap[fieldKey.toLowerCase()]) {
                columnMap[fieldKey.toLowerCase()] = col;
                columns.push(col);
            }
        });

        const hasContainerCol =
            columns.filter(c => c.fieldKey.toLowerCase() === 'container' || c.fieldKey.toLowerCase() === 'folder')
                .length > 0;

        if (!hasContainerCol) {
            // If we're updating we need to ensure that the container column is in the column map, so we can validate
            // against it during events like paste.
            const containerCol = queryInfo.getColumn('Container') ?? queryInfo.getColumn('Folder');

            if (containerCol) {
                columnMap[containerCol.fieldKey.toLowerCase()] = containerCol;
                columns.push(containerCol);
            }
        }
    }

    // TODO: Move initEditorModel, loadEditorModelData, and getLookupValueDescriptors to EditorModel as static methods
    const { cellMessages, cellValues } = await loadEditorModelData(orderedRows, rows, columns, forUpdate);

    if (columnMetadata) {
        // If columnMetadata is present force it to use lowercase keys
        columnMetadata = columnMetadata.reduce((result, value, key) => {
            return result.set(key.toLowerCase(), value);
        }, Map<string, EditableColumnMetadata>());
    }

    return new EditorModel({
        cellMessages,
        cellValues,
        columnMetadata,
        columnMap: fromJS(columnMap),
        orderedColumns: fromJS(orderedColumns),
        originalData: data,
        queryInfo,
        rowCount: orderedRows.length,
    } as Partial<EditorModelProps>);
};

export function parseIntIfNumber(val: any): number | string {
    const intVal = !isNaN(val) ? parseInt(val, 10) : undefined;
    return intVal === undefined || isNaN(intVal) ? val : intVal;
}

const resolveDisplayField = (column: QueryColumn): string => {
    // Handle MVFK
    if (column.multiValue && column.isJunctionLookup()) {
        const parts = column.displayField.split('$S');
        if (parts.length > 1) return parts[1];
    }

    return column.lookup.displayColumnFieldKey;
};

interface MessageAndValue {
    message?: CellMessage;
    valueDescriptor: ValueDescriptor;
}

type MessageAndValueMap = Record<string, MessageAndValue[]>;

function resolveValueDescriptors(
    col: QueryColumn,
    lookupValues: MessageAndValueMap,
    cellMessages: Record<string, CellMessage>,
    cellKey: string,
    value: any
): ValueDescriptor[] {
    const raw = value?.value ?? value;

    if (col.isLookup() && Utils.isNumber(raw)) {
        const messageAndValues = lookupValues[col.lookupKey]?.filter(lv => lv.valueDescriptor.raw === raw);
        if (messageAndValues) {
            const descriptors: ValueDescriptor[] = [];
            for (let i = 0; i < messageAndValues.length; i++) {
                if (messageAndValues[i].message) {
                    cellMessages[cellKey] = messageAndValues[i].message;
                }
                descriptors.push(messageAndValues[i].valueDescriptor);
            }

            return descriptors;
        }
    }

    let display = value?.displayValue ?? raw;
    if (col.isTimeOrDateTimeColumn) {
        display = getDateTimeDisplayValueFromStr(raw, col);
    } else if (!col.isLookup() && col.isNumericJsonType) {
        display = raw; // Issue 53934: don't use displayValue for numeric columns
    }

    return [
        {
            display: display !== null ? display : undefined,
            raw: raw !== null ? raw : undefined,
        },
    ];
}

type FindLookupValuesOptions = {
    api?: ComponentsAPIWrapper;
    column: QueryColumn;
    containerPath?: string;
    forUpdate?: boolean;
    lookupKeyValues?: any[];
    lookupValueFilters?: Filter.IFilter[];
    lookupValues?: any[];
};

const findLookupValues = async (options: FindLookupValuesOptions): Promise<ValueDescriptor[]> => {
    const {
        api = getDefaultAPIWrapper(),
        column,
        containerPath,
        forUpdate,
        lookupKeyValues,
        lookupValueFilters,
        lookupValues,
    } = options;
    const { lookup } = column;
    const { keyColumn } = lookup;
    const displayColumnFieldKey = resolveDisplayField(column);

    const results = await api.query.selectRows({
        columns: [displayColumnFieldKey, keyColumn],
        containerPath: lookup.containerPath ?? containerPath,
        containerFilter: lookup.containerFilter ?? getContainerFilterForLookups(),
        filterArray: getLookupFilters(
            column,
            lookupKeyValues,
            lookupValues,
            lookupValueFilters,
            forUpdate,
            displayColumnFieldKey
        ),
        includeTotalCount: false,
        maxRows: -1,
        schemaQuery: lookup.schemaQuery,
        viewName: ViewInfo.DETAIL_NAME, // Use the detail view so values that may be filtered out of the default view show up.
    });

    return results.rows.reduce<ValueDescriptor[]>((desc, row) => {
        const key = caseInsensitive(row, keyColumn)?.value;
        if (key !== undefined && key !== null) {
            const displayRow =
                caseInsensitive(row, displayColumnFieldKey) ??
                caseInsensitive(row, QueryKey.decodePart(displayColumnFieldKey));
            desc.push({ display: displayRow?.displayValue || displayRow?.value, raw: key });
        }
        return desc;
    }, []);
};

// Resolves the folder path for a row during initialization.
// If a folder path is not explicitly resolved, then it defaults to the current folder.
function getRowFolderPath(row: Record<string, any>): string {
    const rowValue = caseInsensitive(row, 'Folder') ?? caseInsensitive(row, 'Container');
    const currentFolder = getServerContext().container;
    let folderPath: string;

    if (Array.isArray(rowValue)) {
        folderPath = rowValue[0]?.value;
    } else {
        folderPath = rowValue?.value;
    }

    // If the value is the current folder's entityId, then return the current folder's path
    if (folderPath !== undefined && folderPath !== currentFolder.id) {
        return folderPath;
    }

    return currentFolder.path;
}

async function getLookupValueDescriptors(
    columns: QueryColumn[],
    rows: Record<string, Record<string, any>>,
    ids: string[],
    forUpdate: boolean,
    api?: ComponentsAPIWrapper
): Promise<MessageAndValueMap> {
    const lookupValues: MessageAndValueMap = {};

    // for each lookup column, find the unique values in the rows and query for those values when they look like ids
    const lookupPromises = columns
        // Issue 53801: Skip validation of ancestor columns
        .filter(col => col.isPublicLookup() && !col.isAncestorInput())
        .map(async col => {
            const allValues = new Set<number>();
            const valueFolderMap: Record<string, Set<number>> = {};
            const displayValueMap: Record<number, any> = {};

            // The same value for a column may be set in rows from different folders. We need to validate each value
            // for each folder where that value is utilized. Due to this we end up making a request per folder/column/value.
            const processValue = (val: number, row: Record<string, any>): void => {
                const folderPath = getRowFolderPath(row);
                if (!valueFolderMap[folderPath]) valueFolderMap[folderPath] = new Set<number>();
                valueFolderMap[folderPath].add(val);
                allValues.add(val);
            };

            for (const id of ids) {
                const row = rows[id];
                const value = row?.[col.fieldKey] ?? row?.[col.name];

                if (Utils.isNumber(value)) {
                    processValue(value, row);
                } else if (Array.isArray(value)) {
                    value.forEach(val => {
                        if (Utils.isNumber(val?.value)) {
                            processValue(val?.value, row);
                            if (val?.displayValue) {
                                displayValueMap[val.value] = val.displayValue;
                            }
                        }
                    });
                }
            }

            if (allValues.size > 0) {
                // Collect errors made when attempting to resolve lookup values so we can at least tell the user
                // something went awry when trying to validate the values. This is expected to be an uncommon scenario.
                const errorMap: Record<number, string> = {};

                const results = await Promise.all(
                    // This must be async as returning the result directly avoids the try/catch handling
                    Object.entries(valueFolderMap).map(async ([containerPath, values]) => {
                        let descriptors_: ValueDescriptor[];
                        try {
                            descriptors_ = await findLookupValues({
                                api,
                                column: col,
                                containerPath,
                                forUpdate,
                                lookupKeyValues: Array.from(values),
                            });
                        } catch (e) {
                            let errorMsg = `Failed to resolves values for column ${col.caption ?? col.name}.`;
                            const resolved = resolveErrorMessage(e);
                            if (resolved) {
                                errorMsg += ' ' + resolved;
                            }
                            values.forEach(value => {
                                errorMap[value] = errorMsg;
                            });
                            descriptors_ = [];
                        }

                        return descriptors_;
                    })
                );

                const messageAndValues: MessageAndValue[] = [];
                results.forEach(descriptors => {
                    descriptors.forEach(valueDescriptor => {
                        if (allValues.has(valueDescriptor.raw)) {
                            allValues.delete(valueDescriptor.raw);
                            messageAndValues.push({ valueDescriptor });
                        }
                    });
                });

                // Issue 52311: Mark unresolved lookup values with a warning.
                for (const value of allValues) {
                    const displayValue = displayValueMap[value];

                    messageAndValues.push({
                        message: {
                            isWarning: true,
                            message: errorMap[value] ?? lookupValidationErrorMessage(value, false, displayValue),
                        },
                        valueDescriptor: { display: displayValue ?? `<${value}>`, raw: value },
                    });
                }

                lookupValues[col.lookupKey] = messageAndValues;
            }
        });

    await Promise.all(lookupPromises);
    return lookupValues;
}

async function getLookupDisplayValue(column: QueryColumn, value: any, containerPath: string): Promise<MessageAndValue> {
    if (value === undefined || value === null) {
        return {
            valueDescriptor: {
                display: value,
                raw: value,
            },
        };
    }

    let message: CellMessage;

    const descriptors = await findLookupValues({ column, containerPath, forUpdate: false, lookupKeyValues: [value] });
    if (!descriptors.length) {
        message = { message: lookupValidationErrorMessage(value) };
    }

    return {
        message,
        valueDescriptor: descriptors[0],
    };
}

interface CellData {
    message?: CellMessage;
    valueDescriptors: List<ValueDescriptor>;
}

async function convertRowToEditorModelData(
    data: boolean | number | string,
    col: QueryColumn,
    containerPath: string
): Promise<CellData> {
    let message: CellMessage;
    const valueDescriptors: ValueDescriptor[] = [];

    if (data && col?.isPublicLookup()) {
        // value had better be the rowId here, but it may be several in a comma-separated list.
        // If it's the display value, which happens to be a number, much confusion will arise.
        const values = data.toString().split(',');

        for (const val of values) {
            const messageAndValue = await getLookupDisplayValue(col, parseIntIfNumber(val), containerPath);
            message = messageAndValue.message;

            if (messageAndValue.valueDescriptor) {
                valueDescriptors.push(messageAndValue.valueDescriptor);
            }
        }
    } else {
        let display = data;
        if (col?.isTimeOrDateTimeColumn && typeof data === 'string') {
            display = getDateTimeDisplayValueFromStr(data, col);
        }
        valueDescriptors.push({ display, raw: data });
    }

    return { message, valueDescriptors: List(valueDescriptors) };
}

async function prepareInsertRowDataFromBulkForm(
    insertColumns: QueryColumn[],
    rowData: List<any>,
    colMin = 0,
    containerPath: string
): Promise<{ messages: List<CellMessage>; values: List<List<ValueDescriptor>> }> {
    let values = List<List<ValueDescriptor>>();
    let messages = List<CellMessage>();

    for (let cn = 0; cn < rowData.size; cn++) {
        const data = rowData.get(cn);
        const colIdx = colMin + cn;
        const col = insertColumns[colIdx];
        const { message, valueDescriptors } = await convertRowToEditorModelData(data, col, containerPath);
        values = values.push(valueDescriptors);

        if (message) messages = messages.push(message);
    }

    return {
        values,
        messages,
    };
}

async function addBulkRowsToEditorModel(
    editorModel: EditorModel,
    rowData: List<any>,
    numToAdd: number,
    containerPath: string,
    columns: QueryColumn[]
): Promise<Partial<EditorModel>> {
    let { cellMessages, cellValues } = editorModel;
    const selectionCells: string[] = [];
    const insertCols = columns ?? editorModel.queryInfo.getInsertColumns();
    const preparedData = await prepareInsertRowDataFromBulkForm(insertCols, rowData, 0, containerPath);
    const { values, messages } = preparedData;
    const rowCount = editorModel.rowCount + numToAdd;

    for (let rowIdx = editorModel.rowCount; rowIdx < rowCount; rowIdx++) {
        rowData.forEach((value, colIdx) => {
            const fieldKey = editorModel.getFieldKeyByIndex(colIdx);
            const cellKey = genCellKey(fieldKey, rowIdx);
            cellMessages = cellMessages.set(cellKey, messages.get(colIdx));
            selectionCells.push(cellKey);
            cellValues = cellValues.set(cellKey, values.get(colIdx));
        });
    }

    return {
        cellValues,
        cellMessages,
        selectionCells,
        rowCount,
    };
}

export async function addRows(
    editorModel: EditorModel,
    numToAdd: number,
    bulkData: Map<string, any>,
    containerPath: string,
    insertCols?: QueryColumn[]
): Promise<Partial<EditorModel>> {
    let editorModelChanges: Partial<EditorModel>;

    if (bulkData) {
        editorModelChanges = await addBulkRowsToEditorModel(
            editorModel,
            bulkData.toList(),
            numToAdd,
            containerPath,
            insertCols
        );
    } else {
        editorModelChanges = { rowCount: editorModel.rowCount + numToAdd };
    }

    return editorModelChanges;
}

/**
 * Adds columns to the editor model and the underlying model's data
 * @param editorModel
 * @param queryInfo
 * @param originalData
 * @param queryColumns the ordered map of columns to be added
 * @param insertFieldKey the fieldKey of the existing column after which the new columns should be inserted.  If undefined
 * or the column is not found, columns will be added at the beginning.
 */
export function addColumns(
    editorModel: EditorModel,
    queryColumns: ExtendedMap<string, QueryColumn>,
    insertFieldKey?: string
): Partial<EditorModel> {
    if (queryColumns.size === 0) return {};

    // if insertFieldKey is provided, find that index and we will insert after it (or at the beginning if there is no such field)
    let leftColIndex = insertFieldKey
        ? editorModel.orderedColumns.findIndex(column => Utils.caseInsensitiveEquals(column, insertFieldKey))
        : -1;

    let altInsertFieldKey = null; // if there are readOnly fields that comes after insertFieldKey, use the last readOnly field
    if (insertFieldKey && leftColIndex < editorModel.orderedColumns.size - 1) {
        let readOnlyEnded = false;
        editorModel.orderedColumns.forEach((fieldKey, ind) => {
            if (ind <= leftColIndex || readOnlyEnded) return;
            if (!editorModel.columnMap.get(fieldKey).readOnly) readOnlyEnded = true;
            else altInsertFieldKey = fieldKey;
        });

        if (altInsertFieldKey)
            leftColIndex = editorModel.orderedColumns.findIndex(column =>
                Utils.caseInsensitiveEquals(column, altInsertFieldKey)
            );
    }

    const editorModelIndex = leftColIndex + 1;
    const queryColIndex = editorModel.queryInfo.getColumnIndex(altInsertFieldKey ?? insertFieldKey) + 1;

    let newCellValues = editorModel.cellValues;

    for (let rowIdx = 0; rowIdx < editorModel.rowCount; rowIdx++) {
        queryColumns.forEach((value: QueryColumn) => {
            newCellValues = newCellValues.set(genCellKey(value.fieldKey, rowIdx), List<ValueDescriptor>());
        });
    }

    let { orderedColumns, columnMap } = editorModel;
    queryColumns.valueArray.forEach((col, i) => {
        orderedColumns = orderedColumns.insert(i + editorModelIndex, col.fieldKey.toLowerCase());
        columnMap = columnMap.set(col.fieldKey.toLowerCase(), col);
    });
    const queryInfo = editorModel.queryInfo.mutate({
        columns: editorModel.queryInfo.columns.mergeAt(queryColIndex, queryColumns),
    });

    return {
        cellMessages: editorModel.cellMessages,
        cellValues: newCellValues,
        columnMap,
        focusColIdx: -1,
        focusRowIdx: -1,
        orderedColumns,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: [],
        queryInfo,
    };
}

export function changeColumn(
    editorModel: EditorModel,
    existingFieldKey: string,
    newQueryColumn: QueryColumn
): Partial<EditorModel> {
    const colIndex = editorModel.orderedColumns.findIndex(column =>
        Utils.caseInsensitiveEquals(column, existingFieldKey)
    );
    // nothing to do if there is no such column
    if (colIndex === -1) return {};

    let { cellMessages, cellValues, columnMap } = editorModel;

    // Delete the existing data and initialize cells for the new column.
    for (let rowIdx = 0; rowIdx < editorModel.rowCount; rowIdx++) {
        const existingCellKey = genCellKey(existingFieldKey, rowIdx);
        const updatedCellKey = genCellKey(newQueryColumn.fieldKey, rowIdx);
        cellValues = cellValues.delete(existingCellKey);
        cellValues = cellValues.set(updatedCellKey, List());
        cellMessages = cellMessages.delete(existingCellKey);
    }

    columnMap = columnMap.delete(existingFieldKey);
    columnMap = columnMap.set(newQueryColumn.fieldKey.toLowerCase(), newQueryColumn);
    const columns = new ExtendedMap<string, QueryColumn>(editorModel.queryInfo.columns);
    columns.delete(existingFieldKey.toLowerCase());
    columns.set(newQueryColumn.fieldKey.toLowerCase(), newQueryColumn);

    return {
        cellMessages,
        cellValues,
        columnMap,
        focusColIdx: -1,
        focusRowIdx: -1,
        orderedColumns: editorModel.orderedColumns.set(colIndex, newQueryColumn.fieldKey.toLowerCase()),
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: [],
        queryInfo: editorModel.queryInfo.mutate({ columns }),
    };
}

export function removeColumns(editorModel: EditorModel, fieldKeys: string[]): Partial<EditorModel> {
    let { cellMessages, cellValues, columnMap } = editorModel;

    let orderedColumns = editorModel.orderedColumns;
    let hasRemoved = false;
    fieldKeys.forEach(fieldKey => {
        const deleteIndex = orderedColumns.findIndex(column => Utils.caseInsensitiveEquals(column, fieldKey));
        if (deleteIndex === -1) return;

        orderedColumns = orderedColumns.remove(deleteIndex);
        columnMap = columnMap.delete(fieldKey);
        hasRemoved = true;
    });

    // nothing to do if no columns to remove
    if (!hasRemoved) return {};

    // Delete the existing data and initialize cells for the new column.
    for (let rowIdx = 0; rowIdx < editorModel.rowCount; rowIdx++) {
        fieldKeys.forEach(fieldKey => {
            const cellkey = genCellKey(fieldKey, rowIdx);
            cellValues = cellValues.delete(cellkey);
            cellMessages = cellMessages.delete(cellkey);
        });
    }

    const columns = new ExtendedMap<string, QueryColumn>(editorModel.queryInfo.columns);
    fieldKeys.forEach(fieldKey => {
        columns.delete(fieldKey.toLowerCase());
    });
    const queryInfo = editorModel.queryInfo.mutate({ columns });

    return {
        cellMessages,
        cellValues,
        columnMap,
        focusColIdx: -1,
        focusRowIdx: -1,
        orderedColumns,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: [],
        queryInfo,
    };
}

export function removeColumn(editorModel: EditorModel, fieldKey: string): Partial<EditorModel> {
    return removeColumns(editorModel, [fieldKey]);
}

// altColumns is used when the columns to be updated do not correspond with the insert columns on queryInfo
async function prepareUpdateRowDataFromBulkForm(
    queryInfo: QueryInfo,
    rowData: OrderedMap<string, any>,
    isIncludedColumn?: (col: QueryColumn) => boolean,
    containerPath?: string,
    altColumns?: string[] // TODO: This should use the same metadata for columns as the rest of the editable grid
): Promise<{ messages: OrderedMap<string, CellMessage>; values: OrderedMap<string, List<ValueDescriptor>> }> {
    const columns = queryInfo.getInsertColumns(isIncludedColumn);
    let values = OrderedMap<string, List<ValueDescriptor>>();
    let messages = OrderedMap<string, CellMessage>();

    for (const colKey of rowData.keySeq().toArray()) {
        const data = rowData.get(colKey);
        const col = altColumns ? queryInfo.getColumn(colKey) : columns.find(c => c.fieldKey === colKey);
        const { message, valueDescriptors } = await convertRowToEditorModelData(data, col, containerPath);
        values = values.set(col.fieldKey, valueDescriptors);
        if (message) messages = messages.set(col.fieldKey, message);
    }

    return { values, messages };
}

export async function updateGridFromBulkForm(
    editorModel: EditorModel,
    rowData: OrderedMap<string, any>,
    dataRowIndexes: List<number>,
    lockedOrReadonlyRows?: number[],
    isIncludedColumn?: (col: QueryColumn) => boolean,
    containerPath?: string,
    useEditorModelCols = false
): Promise<Partial<EditorModel>> {
    let cellMessages = editorModel.cellMessages;
    let cellValues = editorModel.cellValues;

    const preparedData = await prepareUpdateRowDataFromBulkForm(
        editorModel.queryInfo,
        rowData,
        isIncludedColumn,
        containerPath,
        useEditorModelCols && editorModel.orderedColumns.toJS()
    );
    const { values, messages } = preparedData; // {3: 'x', 4: 'z}

    dataRowIndexes.forEach(rowIdx => {
        if (lockedOrReadonlyRows && lockedOrReadonlyRows.indexOf(rowIdx) > -1) return;

        values.forEach((value, fieldKey) => {
            const cellKey = genCellKey(fieldKey, rowIdx);
            cellMessages = cellMessages.set(cellKey, messages.get(fieldKey));
            cellValues = cellValues.set(cellKey, value);
        });
    });

    return { cellValues, cellMessages };
}

export async function addRowsPerPivotValue(
    editorModel: EditorModel,
    numPerParent: number,
    pivotKey: string,
    pivotValues: string[],
    bulkData: Map<string, any>,
    containerPath: string,
    insertColumns?: QueryColumn[]
): Promise<Partial<EditorModel>> {
    let updatedModel = editorModel;

    if (numPerParent > 0) {
        for (const value of pivotValues) {
            bulkData = bulkData.set(pivotKey, value);
            const changes = await addBulkRowsToEditorModel(
                updatedModel,
                bulkData.toList(),
                numPerParent,
                containerPath,
                insertColumns
            );
            updatedModel = updatedModel.merge(changes) as EditorModel;
        }
    }

    return {
        cellMessages: updatedModel.cellMessages,
        cellValues: updatedModel.cellValues,
        rowCount: updatedModel.rowCount,
    };
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
export function splitPrefixedNumber(value: number | string): PrefixAndNumber {
    if (value === undefined || value === null || value === '') return [undefined, undefined];
    const text = value.toString();
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

/**
 * Given a string that represents a number it returns the number needed when using String.padStart. It returns undefined
 * in the following scenarios:
 *  - If the value is undefined
 *  - If the value is a decimal (e.g. 001.100)
 *  - If the value is not a padded integer (e.g. 5, 10, 34)
 * @param value a string representing a number
 */
export function detectPadLength(value: string): number {
    // We don't support padded numbers with decimals
    if (value === undefined || value.includes('.') || value[0] !== '0') return undefined;
    return value.length;
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
    initialSelectionValues: List<ValueDescriptor>[]; // yes this is a very odd type, but we can clean it up when we rip out Immutable
    padLength?: number;
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
    let padLength;
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

    if (isIntSeq) {
        firstValue = parseScientificInt(firstValue);
        lastValue = parseScientificInt(lastValue);
        // Note: We only support padLength for integer sequences. This is roughly analogous to how Excel/Sheets works.
        // It's different because what Sheets does is so wrong it's useless, so we're not even going to bother. To see
        // what Sheets does drag fill a sequence that looks like: SP1.5000, SP1.6000, SP1.7000.
        // Note: We determine pad length from the first value in a sequence because that is what Excel and Sheets do
        padLength = detectPadLength(splitValues[0][1]);
    } else if (isFloatSeq) {
        firstValue = parseFloat(firstValue);
        lastValue = parseFloat(lastValue);
    }

    if (isFloatSeq || isIntSeq) {
        // increment = last value minus first value divide by the number of steps in the initial selection
        // Note: our increment calculation is different from Excel/Sheets, but that's because their behavior doesn't
        // make any sense for certain sequences, e.g.:
        //  - 1, 3, 3, 7 increments by 1 once, then 1.8 the rest of the time
        //  - 5, 9, 9, 11 increments by 2 once, then 1.8 the rest of the time
        //  - 1, 1, 1, 2, 2, 2, 3, 3, 3 increments by 0.5 once, then 0.3 the rest of the time
        // Our behavior results in a consistent increment and can be easily explained
        increment = decimalDifference(lastValue, firstValue);
        increment = increment / (displayValues.length - 1);
        incrementType = IncrementType.NUMBER;
    }

    return {
        direction,
        increment,
        incrementType,
        initialSelectionValues: values,
        padLength,
        prefix,
        startingValue: direction === IncrementDirection.FORWARD ? lastValue : firstValue,
    };
}

/**
 * Gets the string representation of the primary key for a given row. It needs to be a string because it will be
 * compared against the values coming from QueryModel.orderedRows, which are string representations of PK values.
 * @param row
 * @param queryInfo
 */
function getPkValue(row: any, queryInfo: QueryInfo): string {
    const keyCols = queryInfo.getPkCols();
    let key;

    if (keyCols.length === 1) {
        key = caseInsensitive(row.toJS(), keyCols[0].fieldKey);
        if (Array.isArray(key)) key = key[0];
        if (typeof key === 'object') key = key.value;
    }

    // The key may be anything (often it's a number because it's RowId), so we coerce it to a string
    return key?.toString();
}

/**
 * Returns only the newly selected area given an initial selection and a final selection. These are the keys that will
 * be filled with generated data based on the initially selected data.
 * @param editorModel The EditorModel
 * @param initialSelection The area initially selected
 * @param finalSelection The final area selected, including the initially selected area
 */
export function generateFillCellKeys(
    editorModel: EditorModel,
    initialSelection: string[],
    finalSelection: string[]
): string[][] {
    const firstInitial = parseCellKey(initialSelection[0]);
    const lastInitial = parseCellKey(initialSelection[initialSelection.length - 1]);
    const minCol = editorModel.orderedColumns.indexOf(firstInitial.fieldKey);
    const maxCol = editorModel.orderedColumns.indexOf(lastInitial.fieldKey);
    const initialMinRow = firstInitial.rowIdx;
    const initialMaxRow = lastInitial.rowIdx;
    const finalMinRow = parseCellKey(finalSelection[0]).rowIdx;
    const finalMaxRow = parseCellKey(finalSelection[finalSelection.length - 1]).rowIdx;
    let start: number;
    let end: number;

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

    const fillCellKeys: string[][] = [];

    // Construct arrays of columns, because we're going to generate fill sequences for columns
    for (let colIdx = minCol; colIdx <= maxCol; colIdx++) {
        const columnKeys: string[] = [];

        for (let rowIdx = start; rowIdx <= end; rowIdx++) {
            columnKeys.push(genCellKey(editorModel.orderedColumns.get(colIdx), rowIdx));
        }

        fillCellKeys.push(columnKeys);
    }

    return fillCellKeys;
}

export function parsePastedLookup(
    column: QueryColumn,
    descriptors: ValueDescriptor[],
    value: string | string[]
): CellData {
    const originalValues = List([{ display: value, raw: value }]);

    if (column.required && (value == null || value === '')) {
        return {
            valueDescriptors: originalValues,
            message: {
                message: column.caption + ' is required.',
            },
        };
    }

    if (value === undefined || value === null || value.toString().trim() === '' || typeof value !== 'string') {
        return { valueDescriptors: originalValues };
    }

    let message: CellMessage;
    let values: ValueDescriptor[];
    const unmatched: string[] = [];

    // Parse pasted strings to split properly around quoted values.
    // Remove the quotes for storing the actual values in the grid.
    const parsedValues = parseCsvString(value, ',', true);

    // Issue 53055: Do not attempt to resolve multiple values for a single-value column
    if (!column.isJunctionLookup() && parsedValues.length > 1) {
        const vt = value.trim();
        unmatched.push(vt);
        values = [{ display: vt, raw: vt }];
    } else {
        values = parsedValues.flatMap(v => {
            const vt = v.trim();
            if (!vt) return [];

            const vl = vt.toLowerCase();
            const vd = descriptors.find(d => d.display && d.display.toString().toLowerCase() === vl);
            if (vd) return [vd];

            unmatched.push(vt);
            return [{ display: vt, raw: vt }];
        });
    }

    if (unmatched.length) {
        const valueStr = unmatched
            .slice(0, 4)
            .map(u => '"' + u + '"')
            .join(', ');
        message = { message: lookupValidationErrorMessage(valueStr, true) };
    }

    return { message, valueDescriptors: List(values) };
}

type LookupValueCache = Record<string, Promise<ValueDescriptor[]>>;

async function getParsedLookup(
    column: QueryColumn,
    lookupValueCache: LookupValueCache,
    display: any[],
    value: string | string[],
    cellKey: string,
    forUpdate: boolean,
    targetContainerPath: string,
    editorModel: EditorModel
): Promise<CellData> {
    const containerPath = forUpdate ? editorModel.getFolderValueForCell(cellKey) : targetContainerPath;
    const cacheKey = `${column.fieldKey}||${containerPath}`;

    if (!lookupValueCache.hasOwnProperty(cacheKey)) {
        const columnMetadata = editorModel.getColumnMetadata(column.fieldKey);

        lookupValueCache[cacheKey] = findLookupValues({
            column,
            containerPath,
            forUpdate,
            lookupValueFilters: columnMetadata?.lookupValueFilters,
            lookupValues: display,
        });
    }

    const descriptors = await lookupValueCache[cacheKey];
    return parsePastedLookup(column, descriptors, value);
}

/**
 * Generates an array of string values to paste into a selection of cells based on the values of an initial selection.
 *
 * If the initialSelection is for a single cell, the fill operation will always be a copy of that value.
 * If the initialSelection includes a range of cells and all values are numeric (or numbers prefixed with the same
 * string), fill via a generated sequence where the step/diff is based on the first and last value in the initSelection.
 * if the initialSelection is a single row, and the value is a date (as determined by the date format set by the server)
 * then we will fill via a generated sequence that increments the date by one day each row.
 * If the initialSelection includes a range of cells and not all values are numeric, fill via a copy of all the values
 * in initSelection.
 * @param editorModel An EditorModel object
 * @param initialSelection An array of sorted cell keys, all from the same column that were initially selected
 * @param readonlyRows An array of readonly rows
 * @param selectionToFill An array of sorted cell keys, all from the same column, to be filled with values based on the
 * content of initialSelection
 */
export function generateColumnFillValues(
    editorModel: EditorModel,
    initialSelection: string[],
    readonlyRows: string[],
    selectionToFill: string[]
): string[] {
    const { direction, increment, incrementType, padLength, prefix, startingValue, initialSelectionValues } =
        inferSelectionIncrement(editorModel, initialSelection, selectionToFill);

    if (direction === IncrementDirection.BACKWARD) {
        selectionToFill.reverse();
    }

    return selectionToFill.map((cellKey, i) => {
        const { fieldKey, rowIdx } = parseCellKey(cellKey);
        const { isReadonlyCell, isReadonlyRow } = editorModel.getCellReadStatus(fieldKey, rowIdx, readonlyRows);
        // Only need to generate blank values for read only cells, paste will ignore them
        if (isReadonlyCell || isReadonlyRow) return '';

        const initialValue = initialSelectionValues[i % initialSelectionValues.length];
        let value = initialValue.map(v => quoteValueWithDelimiters(v.display, ',')).join(',');
        if (incrementType === IncrementType.NUMBER) {
            const amount = increment * (i + 1);
            let raw: number | string;

            if (direction === IncrementDirection.FORWARD) {
                raw = decimalDifference(amount, startingValue as number, false);
            } else {
                raw = decimalDifference(startingValue as number, amount, true);
            }

            if (padLength !== undefined) {
                raw = raw.toString(10).padStart(padLength, '0');
            }

            if (prefix !== undefined) raw = prefix + raw;
            // Issue 52412
            value = quoteValueWithDelimiters(raw.toString(), ',');
        } else if (incrementType === IncrementType.DATE || incrementType === IncrementType.DATETIME) {
            let date = parseDate(startingValue);

            if (direction === IncrementDirection.FORWARD) {
                date = addDays(date, i + 1);
            } else {
                date = subDays(date, i + 1);
            }

            value = incrementType === IncrementType.DATE ? formatDate(date) : formatDateTime(date);
        }

        return value;
    });
}

/**
 * @param editorModel An EditorModel object
 * @param initialSelection The initial selection before the selection was expanded
 * @param readonlyRows An array of readonly rows
 * @param forUpdate True if this is operating on update query filters.
 * @param targetContainerPath The container path to use when looking up lookup values in the forUpdate false case
 */
export function dragFillEvent(
    editorModel: EditorModel,
    initialSelection: string[],
    readonlyRows: string[],
    forUpdate: boolean,
    targetContainerPath: string
): Promise<Partial<EditorModel>> {
    // Note: this method works by generating a TSV of new values and treating it as if the user pasted the TSV. This
    // lets us reuse our paste code which is reasonably complex.
    const { columnMap, selectionCells } = editorModel;
    const { cellMessages, cellValues } = editorModel;

    // If the selection size hasn't changed, then the selection hasn't changed, so return the existing cellValues
    if (selectionCells.length === initialSelection.length) return Promise.resolve({ cellMessages, cellValues });

    const selectionToFill = generateFillCellKeys(editorModel, initialSelection, selectionCells);
    const filledColumns = [];
    for (const columnCells of selectionToFill) {
        const { fieldKey } = parseCellKey(columnCells[0]);
        const initialSelectionByCol = initialSelection.filter(cellKey => parseCellKey(cellKey).fieldKey === fieldKey);
        const column = columnMap.get(fieldKey);

        if (column.readOnly) {
            // Generate blank values for readOnly columns, they'll be ignored during paste
            filledColumns.push(columnCells.map(() => ''));
            continue;
        }

        filledColumns.push(generateColumnFillValues(editorModel, initialSelectionByCol, readonlyRows, columnCells));
    }

    const rowStrings = [];
    for (let rowIdx = 0; rowIdx < filledColumns[0].length; rowIdx++) {
        rowStrings.push(filledColumns.map(column => column[rowIdx]).join('\t'));
    }

    const tsv = rowStrings.join('\n');

    return validateAndInsertPastedData(
        editorModel,
        tsv,
        readonlyRows,
        true,
        forUpdate,
        targetContainerPath,
        false,
        selectionToFill
    );
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
    const { orderedColumns, selectionCells } = model;
    const minSelection = parseCellKey(selectionCells[0]);
    const maxSelection = parseCellKey(selectionCells[selectionCells.length - 1]);
    const selectionColCount =
        orderedColumns.indexOf(maxSelection.fieldKey) - orderedColumns.indexOf(minSelection.fieldKey) + 1;
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
    allowExpand: boolean,
    readOnlyRowCount?: number
): PasteModel {
    const maxRowPaste = 1000;
    let success = true;
    let message;
    let payload = parsePaste(value);

    if (model.isMultiSelect && allowExpand) {
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
    if (coordinates.colMax >= model.orderedColumns.size) {
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

async function insertPastedData(
    editorModel: EditorModel,
    paste: PasteModel,
    readonlyRows: string[],
    lockRowCount: boolean,
    forUpdate: boolean,
    targetContainerPath: string,
    selectCells: boolean
): Promise<Partial<EditorModel>> {
    const pastedData = paste.payload.data;
    let cellMessages = editorModel.cellMessages;
    let cellValues = editorModel.cellValues;
    const selectionCells: string[] = [];
    let rowCount = editorModel.rowCount;

    if (paste.rowsToAdd > 0 && !lockRowCount) {
        rowCount += paste.rowsToAdd;
    }

    const byColumnValues = getPasteValuesByColumn(paste);
    const lookupValueCache: LookupValueCache = {};
    const { colMin, rowMin } = paste.coordinates;
    let rowIdx = rowMin;

    for (let r = 0; r < pastedData.size; r++) {
        const row = pastedData.get(r);

        if (readonlyRows) {
            while (rowIdx < rowCount && editorModel.isReadOnlyRow(rowIdx, readonlyRows)) {
                // Skip over readonly rows
                rowIdx++;
            }
        }

        if (rowIdx >= rowCount && lockRowCount) {
            // If we've reached the row limit we can short-circuit allowing at least a partial paste.
            break;
        }

        let pkValue = getPkValue(row, editorModel.queryInfo);
        if (!pkValue) pkValue = editorModel.getPkValue(rowIdx);

        for (let cn = 0; cn < row.size; cn++) {
            const val = row.get(cn);
            const colIdx = colMin + cn;
            const col = editorModel.getColumnByIndex(colIdx);
            const cellKey = genCellKey(col.fieldKey, rowIdx);
            const metadata = editorModel.getColumnMetadata(col?.fieldKey);
            const readOnlyCol = col?.readOnly;
            const readOnlyCell = metadata?.isReadOnlyCell?.(pkValue);

            if (!readOnlyCol && !readOnlyCell) {
                let cv: List<ValueDescriptor>;
                let msg: CellMessage;

                if (col?.isPublicLookup()) {
                    // If the column is a lookup and forUpdate is true, then we need to query for the rowIds so we can set the correct raw values,
                    // otherwise insert will fail. This is most common for cross-folder sample selection (Issue 50363)
                    const display = byColumnValues.get(cn)?.toArray();
                    const { message, valueDescriptors } = await getParsedLookup(
                        col,
                        lookupValueCache,
                        display,
                        val,
                        cellKey,
                        forUpdate,
                        targetContainerPath,
                        editorModel
                    );
                    cv = valueDescriptors;
                    msg = message;
                } else {
                    const { message, value } = getValidatedEditableGridValue(val, col);
                    let display = value;

                    // Issue 52326: Copy/paste of date values across cells changes date formats
                    // Set display value to the pasted value, not the validated value, because for dates we use the JSON
                    // format provided by LKS, which can include microseconds, and users probably didn't paste those.
                    if (col?.jsonType === 'date') display = val;

                    cv = List([{ display, raw: value }]);
                    msg = message;
                }

                cellMessages = cellMessages.set(cellKey, msg);
                cellValues = cellValues.set(cellKey, cv);
            }

            if (selectCells) {
                selectionCells.push(cellKey);
            }
        }

        rowIdx++;
    }

    return { cellMessages, cellValues, rowCount, selectionCells };
}

function getReadonlyRowCount(editorModel: EditorModel, startRowInd: number, readonlyRows: string[]): number {
    const pkCols = editorModel.queryInfo.getPkCols();

    // Rows with multiple PKs are always read-only
    if (pkCols.length !== 1) {
        return editorModel.rowCount - startRowInd;
    }

    let total = 0;

    for (let index = startRowInd; index < editorModel.rowCount; index++) {
        const pkValue = editorModel.getPkValue(index);
        if (readonlyRows.includes(pkValue.toString())) total++;
    }

    return total;
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

export function validateAndInsertPastedData(
    editorModel: EditorModel,
    value: string,
    readonlyRows: string[],
    lockRowCount: boolean,
    forUpdate: boolean,
    targetContainerPath: string,
    selectCells: boolean,
    selectionToFill?: string[][]
): Promise<Partial<EditorModel>> {
    let selectedColIdx: number;
    let selectedRowIdx: number;

    if (editorModel.isMultiSelect) {
        // Issue 51359 - When pasting during multiselect we want to paste from the first cell in the selection,
        // otherwise we'll paste from the initially selected cell, which will fill the wrong area. This is most obvious
        // if you select upwards, then paste.
        const minCellKey = selectionToFill !== undefined ? selectionToFill[0][0] : editorModel.selectionCells[0];
        const { fieldKey, rowIdx } = parseCellKey(minCellKey);
        selectedRowIdx = rowIdx;
        selectedColIdx = editorModel.orderedColumns.indexOf(fieldKey);
    } else {
        selectedRowIdx = editorModel.selectedRowIdx;
        selectedColIdx = editorModel.selectedColIdx;
    }

    const readOnlyRowCount =
        readonlyRows && !lockRowCount ? getReadonlyRowCount(editorModel, selectedRowIdx, readonlyRows) : 0;

    const paste = validatePaste(
        editorModel,
        selectedColIdx,
        selectedRowIdx,
        value,
        selectionToFill === undefined, // Issue 52737 -- we do not want to expand paste during drag fill
        readOnlyRowCount
    );

    if (paste.success) {
        return insertPastedData(
            editorModel,
            paste,
            readonlyRows,
            lockRowCount,
            forUpdate,
            targetContainerPath,
            selectCells
        );
    } else {
        const fieldKey = editorModel.getFieldKeyByIndex(selectedColIdx);
        const cellKey = genCellKey(fieldKey, selectedRowIdx);
        // We have to coerce this to a promise because insertPastedData returns a promise.
        return Promise.resolve({ cellMessages: editorModel.cellMessages.set(cellKey, { message: paste.message }) });
    }
}

export function pasteEvent(
    editorModel: EditorModel,
    event: any,
    readonlyRows: string[],
    lockRowCount: boolean,
    forUpdate: boolean,
    targetContainerPath: string
): Promise<Partial<EditorModel>> {
    // If a cell has focus do not accept incoming paste events -- allow for normal paste to input
    if (editorModel && editorModel.hasSelection && !editorModel.hasFocus) {
        cancelEvent(event);
        const value = getPasteValue(event);
        return validateAndInsertPastedData(
            editorModel,
            value,
            readonlyRows,
            lockRowCount,
            forUpdate,
            targetContainerPath,
            true
        );
    }

    return undefined;
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

function getCopyValue(model: EditorModel, hideReadOnlyRows: boolean, readonlyRows: string[]): string {
    let copyValue = '';
    const EOL = '\n';
    const selectionCells = [...model.selectionCells];
    const fieldKey = model.orderedColumns.get(model.selectedColIdx);
    selectionCells.push(genCellKey(fieldKey, model.selectedRowIdx));

    for (let rn = 0; rn < model.rowCount; rn++) {
        let cellSep = '';
        let inSelection = false;

        // Do not include hidden rows in copy values
        if (hideReadOnlyRows && readonlyRows) {
            if (model.isReadOnlyRow(rn, readonlyRows)) continue;
        }

        model.orderedColumns.forEach(fieldKey => {
            const cellKey = genCellKey(fieldKey, rn);

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

export function copyEvent(
    editorModel: EditorModel,
    event: any,
    hideReadOnlyRows: boolean,
    readonlyRows: string[]
): boolean {
    if (editorModel && !editorModel.hasFocus && editorModel.hasSelection && !editorModel.isSparseSelection) {
        cancelEvent(event);
        setCopyValue(event, getCopyValue(editorModel, hideReadOnlyRows, readonlyRows));
        return true;
    }

    return false;
}
