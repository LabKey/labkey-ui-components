import { List, Map, OrderedMap, Set } from 'immutable';
import { CellMessage, CellMessages, CellValues, EditorModel, LookupStore, ValueDescriptor } from '../../models';
import {
    getEditorModel,
    getLookupStore,
    getQueryGridModel,
    updateEditorModel,
    updateQueryGridModel,
} from '../../global';
import { cancelEvent, caseInsensitive, QueryColumn, QueryGridModel } from '../../..';
import { getLookupDisplayValue, initLookup, selectCell } from '../../actions';
import { GRID_EDIT_INDEX, KEYS, LOOKUP_DEFAULT_SIZE } from '../../constants';
import { getPasteValue, setCopyValue } from '../../events';
import { genCellKey, not } from '../../util/utils';
import { EditableColumnMetadata, IParsePastePayload, IPasteModel } from './models';

const EMPTY_ROW = Map<string, any>();
let ID_COUNTER = 0;

function isCellEmpty(values: List<ValueDescriptor>): boolean {
    return !values || values.isEmpty() || values.some(v => v.raw === undefined || v.raw === null || v.raw === '');
}

function moveDown(colIdx: number, rowIdx: number): { colIdx: number; rowIdx: number } {
    return { colIdx, rowIdx: rowIdx + 1 };
}

function moveLeft(colIdx: number, rowIdx: number): { colIdx: number; rowIdx: number } {
    return { colIdx: colIdx - 1, rowIdx };
}

function moveRight(colIdx: number, rowIdx: number): { colIdx: number; rowIdx: number } {
    return { colIdx: colIdx + 1, rowIdx };
}

function moveUp(colIdx: number, rowIdx: number): { colIdx: number; rowIdx: number } {
    return { colIdx, rowIdx: rowIdx - 1 };
}

export function select(modelId: string, event: React.KeyboardEvent<HTMLElement>): void {
    const editModel = getEditorModel(modelId);

    if (editModel && !editModel.hasFocus()) {
        const colIdx = editModel.selectedColIdx;
        const rowIdx = editModel.selectedRowIdx;

        let nextCol, nextRow;

        switch (event.keyCode) {
            case KEYS.LeftArrow:
                if (event.ctrlKey) {
                    const found = editModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveLeft);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = 0;
                        nextRow = rowIdx;
                    }
                } else {
                    nextCol = colIdx - 1;
                    nextRow = rowIdx;
                }
                break;

            case KEYS.UpArrow:
                if (event.ctrlKey) {
                    const found = editModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveUp);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = colIdx;
                        nextRow = 0;
                    }
                } else {
                    nextCol = colIdx;
                    nextRow = rowIdx - 1;
                }
                break;

            case KEYS.RightArrow:
                if (event.ctrlKey) {
                    const found = editModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveRight);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = editModel.colCount - 1;
                        nextRow = rowIdx;
                    }
                } else {
                    nextCol = colIdx + 1;
                    nextRow = rowIdx;
                }
                break;

            case KEYS.DownArrow:
                if (event.ctrlKey) {
                    const found = editModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveDown);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = colIdx;
                        nextRow = editModel.rowCount - 1;
                    }
                } else {
                    nextCol = colIdx;
                    nextRow = rowIdx + 1;
                }
                break;

            case KEYS.Home:
                nextCol = 0;
                nextRow = rowIdx;
                break;

            case KEYS.End:
                nextCol = editModel.colCount - 1;
                nextRow = rowIdx;
                break;
        }

        if (nextCol !== undefined && nextRow !== undefined) {
            cancelEvent(event);
            selectCell(modelId, nextCol, nextRow);
        }
    }
}

export function removeRows(model: QueryGridModel, dataIdIndexes: List<number>): void {
    const editorModel = getEditorModel(model.getId());

    // sort descending so we remove the data for the row with the largest index first and don't mess up the index number for other rows
    const sortedIdIndexes = dataIdIndexes.sort().reverse();

    let data = model.data;
    let dataIds = model.dataIds;
    let deletedIds = Set<any>();
    sortedIdIndexes.forEach(dataIdIndex => {
        const dataId = dataIds.get(dataIdIndex);
        deletedIds = deletedIds.add(dataId);
        data = data.remove(dataId);
        dataIds = dataIds.remove(dataIdIndex);
    });

    if (model.editable) {
        let newCellMessages = editorModel.cellMessages;
        let newCellValues = editorModel.cellValues;

        sortedIdIndexes.forEach(rowIdx => {
            newCellMessages = newCellMessages.reduce((newCellMessages, message, cellKey) => {
                const [colIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v));
                if (oldRowIdx > rowIdx) {
                    return newCellMessages.set([colIdx, oldRowIdx - 1].join('-'), message);
                } else if (oldRowIdx < rowIdx) {
                    return newCellMessages.set(cellKey, message);
                }

                return newCellMessages;
            }, Map<string, CellMessage>());

            newCellValues = newCellValues.reduce((newCellValues, value, cellKey) => {
                const [colIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v));

                if (oldRowIdx > rowIdx) {
                    return newCellValues.set([colIdx, oldRowIdx - 1].join('-'), value);
                } else if (oldRowIdx < rowIdx) {
                    return newCellValues.set(cellKey, value);
                }

                return newCellValues;
            }, Map<string, List<ValueDescriptor>>());
        });

        updateEditorModel(editorModel, {
            deletedIds: editorModel.deletedIds.merge(deletedIds),
            focusColIdx: -1,
            focusRowIdx: -1,
            rowCount: editorModel.rowCount - dataIdIndexes.size,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: Set<string>(),
            cellMessages: newCellMessages,
            cellValues: newCellValues,
        });
    }

    updateQueryGridModel(model, {
        data,
        dataIds,
        isError: false,
        message: undefined,
    });
}

export function removeRow(model: QueryGridModel, dataId: any, rowIdx: number): void {
    removeRows(
        model,
        List<number>([rowIdx])
    );
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

function getCopyValue(model: EditorModel, queryModel: QueryGridModel): string {
    let copyValue = '';
    const EOL = '\n';

    if (model && queryModel && model.hasSelection() && !model.hasFocus()) {
        const selectionCells = model.selectionCells.add(genCellKey(model.selectedColIdx, model.selectedRowIdx));

        for (let rn = 0; rn < model.rowCount; rn++) {
            let cellSep = '';
            let inSelection = false;

            queryModel.getInsertColumns().forEach((col, cn) => {
                const cellKey = genCellKey(cn, rn);

                if (selectionCells.contains(cellKey)) {
                    inSelection = true;
                    copyValue += cellSep + getCellCopyValue(model.cellValues.get(cellKey));
                    cellSep = '\t';
                }
            });

            if (inSelection) {
                copyValue += EOL;
            }
        }
    }

    if (copyValue[copyValue.length - 1] === EOL) {
        copyValue = copyValue.slice(0, copyValue.length - 1);
    }

    return copyValue;
}

export function copyEvent(modelId: string, event: any): void {
    const editorModel = getEditorModel(modelId);

    if (editorModel && !editorModel.hasFocus() && editorModel.hasSelection()) {
        cancelEvent(event);
        setCopyValue(event, getCopyValue(editorModel, getQueryGridModel(modelId)));
    }
}

const dragLock = Map<string, boolean>().asMutable();

function handleDrag(modelId: string, event: any, handle: () => any): void {
    const model = getEditorModel(modelId);
    if (model && !model.hasFocus()) {
        event.preventDefault();
        handle();
    }
}

export function beginDrag(modelId: string, event: any): void {
    return handleDrag(modelId, event, () => dragLock.set(modelId, true));
}

export function endDrag(modelId: string, event: any): void {
    return handleDrag(modelId, event, () => dragLock.remove(modelId));
}

export function inDrag(modelId: string): boolean {
    return dragLock.get(modelId) !== undefined;
}

export function clearSelection(modelId: string): void {
    const model = getEditorModel(modelId);

    if (model && (model.hasSelection() || model.hasFocus())) {
        updateEditorModel(model, {
            focusColIdx: -1,
            focusRowIdx: -1,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: Set<string>(),
        });
    }
}

function prepareUpdateRowDataFromBulkForm(
    gridModel: QueryGridModel,
    rowData: OrderedMap<string, any>
): { values: OrderedMap<number, List<ValueDescriptor>>; messages: OrderedMap<number, CellMessage> } {
    const columns = gridModel.getInsertColumns();

    const getLookup = (col: QueryColumn) => getLookupStore(col);

    let values = OrderedMap<number, List<ValueDescriptor>>();
    let messages = OrderedMap<number, CellMessage>();

    rowData.forEach((data, colKey) => {
        let colIdx = -1;
        columns.forEach((col, ind) => {
            if (col.fieldKey === colKey) {
                colIdx = ind;
            }
        });

        const col = columns.get(colIdx);

        let cv: List<ValueDescriptor>;

        if (data && col && col.isLookup()) {
            cv = List<ValueDescriptor>();
            // value had better be the rowId here, but it may be several in a comma-separated list.
            // If it's the display value, which happens to be a number, much confusion will arise.
            const values = data.toString().split(',');
            values.forEach(val => {
                const intVal = parseInt(val);
                const { message, valueDescriptor } = getLookupDisplayValue(
                    col,
                    getLookup(col),
                    isNaN(intVal) ? val : intVal
                );
                cv = cv.push(valueDescriptor);
                if (message) {
                    messages = messages.set(colIdx, message);
                }
            });
        } else {
            cv = List([
                {
                    display: data,
                    raw: data,
                },
            ]);
        }

        values = values.set(colIdx, cv);
    });

    return {
        values,
        messages,
    };
}

export function updateGridFromBulkForm(
    gridModel: QueryGridModel,
    rowData: OrderedMap<string, any>,
    dataRowIndexes: List<number>
): EditorModel {
    const editorModel = getEditorModel(gridModel.getId());

    let cellMessages = editorModel.cellMessages;
    let cellValues = editorModel.cellValues;

    const preparedData = prepareUpdateRowDataFromBulkForm(gridModel, rowData);
    const { values, messages } = preparedData; // {3: 'x', 4: 'z}

    dataRowIndexes.forEach(rowIdx => {
        values.forEach((value, colIdx) => {
            const cellKey = genCellKey(colIdx, rowIdx);
            cellMessages = cellMessages.set(cellKey, messages.get(colIdx));
            cellValues = cellValues.set(cellKey, value);
        });
    });

    return updateEditorModel(editorModel, {
        cellValues,
        cellMessages,
    });
}

function prepareInsertRowDataFromBulkForm(
    gridModel: QueryGridModel,
    rowData: List<any>,
    colMin = 0
): { values: List<List<ValueDescriptor>>; messages: List<CellMessage> } {
    const columns = gridModel.getInsertColumns();

    const getLookup = (col: QueryColumn) => getLookupStore(col);

    let values = List<List<ValueDescriptor>>();
    let messages = List<CellMessage>();

    rowData.forEach((data, cn) => {
        const colIdx = colMin + cn;
        const col = columns.get(colIdx);

        let cv: List<ValueDescriptor>;

        if (data && col && col.isLookup()) {
            cv = List<ValueDescriptor>();
            // value had better be the rowId here, but it may be several in a comma-separated list.
            // If it's the display value, which happens to be a number, much confusion will arise.
            const values = data.toString().split(',');
            values.forEach(val => {
                const intVal = parseInt(val);
                const { message, valueDescriptor } = getLookupDisplayValue(
                    col,
                    getLookup(col),
                    isNaN(intVal) ? val : intVal
                );
                cv = cv.push(valueDescriptor);
                if (message) {
                    messages = messages.push(message);
                }
            });
        } else {
            cv = List([
                {
                    display: data,
                    raw: data,
                },
            ]);
        }

        values = values.push(cv);
    });

    return {
        values,
        messages,
    };
}

/**
 * Updates data in the editable grid associated with the given grid model.
 * @param gridModel the model whose editable data is updated
 * @param rowData the data for a single row
 * @param rowCount the number of rows to be added
 * @param rowMin the starting row for the new rows
 * @param colMin the starting column
 */
export function updateEditorData(
    gridModel: QueryGridModel,
    rowData: List<any>,
    rowCount: number,
    rowMin = 0,
    colMin = 0
): EditorModel {
    const editorModel = getEditorModel(gridModel.getId());

    let cellMessages = editorModel.cellMessages;
    let cellValues = editorModel.cellValues;
    let selectionCells = Set<string>();

    const preparedData = prepareInsertRowDataFromBulkForm(gridModel, rowData, colMin);
    const { values, messages } = preparedData;

    for (let rowIdx = rowMin; rowIdx < rowMin + rowCount; rowIdx++) {
        rowData.forEach((value, cn) => {
            const colIdx = colMin + cn;
            const cellKey = genCellKey(colIdx, rowIdx);

            cellMessages = cellMessages.set(cellKey, messages.get(cn));
            selectionCells = selectionCells.add(cellKey);
            cellValues = cellValues.set(cellKey, values.get(cn));
        });
    }

    return updateEditorModel(editorModel, {
        cellValues,
        cellMessages,
        selectionCells,
        rowCount: Math.max(rowMin + Number(rowCount), editorModel.rowCount),
    });
}

function parsePaste(value: string): IParsePastePayload {
    let numCols = 0;
    let rows = List<List<string>>().asMutable();

    if (value === undefined || value === null || typeof value !== 'string') {
        return {
            data: rows.asImmutable(),
            numCols,
            numRows: rows.size,
        };
    }

    // remove trailing newline from pasted data to avoid creating an empty row of cells
    if (value.endsWith('\n')) value = value.substring(0, value.length - 1);

    value.split('\n').forEach(rv => {
        const columns = List(rv.split('\t'));
        if (numCols < columns.size) {
            numCols = columns.size;
        }
        rows.push(columns);
    });

    rows = rows
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
        data: rows.asImmutable(),
        numCols,
        numRows: rows.size,
    };
}

function endPaste(model: EditorModel): EditorModel {
    return updateEditorModel(model, {
        isPasting: false,
        numPastedRows: 0,
    });
}

function getColumnFilteredLookup(
    column: QueryColumn,
    columnMetadata: Map<string, EditableColumnMetadata>
): List<string> {
    const metadata: EditableColumnMetadata = columnMetadata && columnMetadata.get(column.fieldKey);
    if (metadata) return metadata.filteredLookupValues;

    return undefined;
}

function isReadOnly(column: QueryColumn, columnMetadata: Map<string, EditableColumnMetadata>): boolean {
    const metadata: EditableColumnMetadata = columnMetadata && columnMetadata.get(column.fieldKey);
    return (column && column.readOnly) || (metadata && metadata.readOnly);
}

function isReadonlyRow(model: QueryGridModel, rowInd: number, readonlyRows: List<string>): boolean {
    const data: List<Map<string, string>> = model.getDataEdit();
    const keyCols = model.getKeyColumns();

    if (keyCols.size == 1 && data.get(rowInd)) {
        const key = caseInsensitive(data.get(rowInd).toJS(), keyCols.get(0).fieldKey);
        return readonlyRows.contains(key);
    }

    return false;
}

function getReadonlyRowCount(
    model: QueryGridModel,
    editorModel: EditorModel,
    startRowInd: number,
    readonlyRows: List<string>
): number {
    const data: List<Map<string, string>> = model.getDataEdit();
    const keyCols = model.getKeyColumns();

    if (keyCols.size == 1) {
        const fieldKey = keyCols.get(0).fieldKey;
        let editableRowCount = 0;
        for (let i = startRowInd; i < editorModel.rowCount; i++) {
            const key = caseInsensitive(data.get(i).toJS(), fieldKey);
            if (readonlyRows.contains(key)) editableRowCount++;
        }

        return editableRowCount;
    }

    return editorModel.rowCount - startRowInd;
}

interface IParseLookupPayload {
    message?: CellMessage;
    values: List<ValueDescriptor>;
}

function parsePasteCellLookup(column: QueryColumn, lookup: LookupStore, value: string): IParseLookupPayload {
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

    const values = value
        .split(',')
        .map(v => {
            const vt = v.trim();
            if (vt.length > 0) {
                const vl = vt.toLowerCase();
                const vd = lookup.descriptors.find(d => d.display && d.display.toString().toLowerCase() === vl);
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

function parseCellKey(cellKey: string): { colIdx: number; rowIdx: number } {
    const [colIdx, rowIdx] = cellKey.split('-');

    return {
        colIdx: parseInt(colIdx),
        rowIdx: parseInt(rowIdx),
    };
}

function pasteCellLoad(
    model: EditorModel,
    gridModel: QueryGridModel,
    paste: IPasteModel,
    getLookup: (col: QueryColumn) => LookupStore,
    columnMetadata: Map<string, EditableColumnMetadata>,
    readonlyRows?: List<any>,
    lockRowCount?: boolean
): Promise<{ cellMessages: CellMessages; cellValues: CellValues; selectionCells: Set<string> }> {
    return new Promise(resolve => {
        const { data } = paste.payload;
        const columns = gridModel.getInsertColumns();

        const cellMessages = model.cellMessages.asMutable();
        const cellValues = model.cellValues.asMutable();
        const selectionCells = Set<string>().asMutable();

        if (model.hasMultipleSelection()) {
            model.selectionCells.forEach(cellKey => {
                const { colIdx } = parseCellKey(cellKey);
                const col = columns.get(colIdx);

                data.forEach(row => {
                    row.forEach(value => {
                        let cv: List<ValueDescriptor>;
                        let msg: CellMessage;

                        if (col && col.isPublicLookup()) {
                            const { message, values } = parsePasteCellLookup(col, getLookup(col), value);
                            cv = values;

                            if (message) {
                                msg = message;
                            }
                        } else {
                            cv = List([
                                {
                                    display: value,
                                    raw: value,
                                },
                            ]);
                        }

                        if (!isReadOnly(col, columnMetadata)) {
                            if (msg) {
                                cellMessages.set(cellKey, msg);
                            } else {
                                cellMessages.remove(cellKey);
                            }
                            cellValues.set(cellKey, cv);
                        }

                        selectionCells.add(cellKey);
                    });
                });
            });
        } else {
            const { colMin, rowMin } = paste.coordinates;

            let rowIdx = rowMin;
            let hasReachedRowLimit = false;
            data.forEach((row, rn) => {
                if (hasReachedRowLimit && lockRowCount) return;

                if (readonlyRows) {
                    while (rowIdx < model.rowCount && isReadonlyRow(gridModel, rowIdx, readonlyRows)) {
                        // add row if needed
                        rowIdx++;
                    }

                    if (rowIdx >= model.rowCount) {
                        hasReachedRowLimit = true;
                        return;
                    }
                }

                // find the next editable row;
                row.forEach((value, cn) => {
                    const colIdx = colMin + cn;
                    const col = columns.get(colIdx);
                    const cellKey = genCellKey(colIdx, rowIdx);

                    let cv: List<ValueDescriptor>;
                    let msg: CellMessage;

                    if (col && col.isPublicLookup()) {
                        const { message, values } = parsePasteCellLookup(col, getLookup(col), value);
                        cv = values;

                        if (message) {
                            msg = message;
                        }
                    } else {
                        cv = List([
                            {
                                display: value,
                                raw: value,
                            },
                        ]);
                    }

                    if (!isReadOnly(col, columnMetadata)) {
                        if (msg) {
                            cellMessages.set(cellKey, msg);
                        } else {
                            cellMessages.remove(cellKey);
                        }
                        cellValues.set(cellKey, cv);
                    }

                    selectionCells.add(cellKey);
                });

                rowIdx++;
            });
        }

        resolve({
            cellMessages: cellMessages.asImmutable(),
            cellValues: cellValues.asImmutable(),
            selectionCells: selectionCells.asImmutable(),
        });
    });
}

// Gets the non-blank values pasted for each column.  The values in the resulting lists may not align to the rows
// pasted if there were empty cells within the paste block.
function getPasteValuesByColumn(paste: IPasteModel): List<List<string>> {
    const { data } = paste.payload;
    const valuesByColumn = List<List<string>>().asMutable();

    for (let i = 0; i < data.get(0).size; i++) {
        valuesByColumn.push(List<string>().asMutable());
    }
    data.forEach(row => {
        row.forEach((value, index) => {
            value.split(',').forEach(v => {
                if (v.trim().length > 0) valuesByColumn.get(index).push(v.trim());
            });
        });
    });
    return valuesByColumn.asImmutable();
}

function validatePaste(
    model: EditorModel,
    colMin: number,
    rowMin: number,
    value: any,
    readOnlyRowCount?: number
): IPasteModel {
    const maxRowPaste = 1000;
    const payload = parsePaste(value);

    const coordinates = {
        colMax: colMin + payload.numCols - 1,
        colMin,
        rowMax: rowMin + payload.numRows - 1,
        rowMin,
    };

    const paste: IPasteModel = {
        coordinates,
        payload,
        rowsToAdd: Math.max(
            0,
            coordinates.rowMin + payload.numRows + (readOnlyRowCount ? readOnlyRowCount : 0) - model.rowCount
        ),
        success: true,
    };

    // If P = 1 then target can be 1 or M
    // If P = M(x,y) then target can be 1 or exact M(x,y)

    if (
        (coordinates.colMin !== coordinates.colMax || coordinates.rowMin !== coordinates.rowMax) &&
        model.hasMultipleSelection()
    ) {
        paste.success = false;
        paste.message = 'Unable to paste. Paste is not supported against multiple selections.';
    } else if (coordinates.colMax >= model.colCount) {
        paste.success = false;
        paste.message = 'Unable to paste. Cannot paste columns beyond the columns found in the grid.';
    } else if (coordinates.rowMax - coordinates.rowMin > maxRowPaste) {
        paste.success = false;
        paste.message = 'Unable to paste. Cannot paste more than ' + maxRowPaste + ' rows.';
    }

    return paste;
}

function beginPaste(model: EditorModel, numRows: number): EditorModel {
    return updateEditorModel(model, {
        isPasting: true,
        numPastedRows: numRows,
    });
}

export function addRows(model: QueryGridModel, count?: number, rowData?: Map<string, any>): EditorModel {
    let editorModel = getEditorModel(model.getId());
    if (count > 0) {
        if (model.editable) {
            if (rowData) {
                editorModel = updateEditorData(model, rowData.toList(), count, model.getData().size);
            } else {
                editorModel = updateEditorModel(editorModel, {
                    rowCount: editorModel.rowCount + count,
                });
            }
        }

        let data = model.data;
        let dataIds = model.dataIds;

        for (let i = 0; i < count; i++) {
            // ensure we don't step on another ID
            const id = GRID_EDIT_INDEX + ID_COUNTER++;

            data = data.set(id, rowData || EMPTY_ROW);
            dataIds = dataIds.push(id);
        }

        updateQueryGridModel(model, {
            data,
            dataIds,
            isError: false,
            message: undefined,
        });
    }

    return editorModel;
}


function pasteCell(
    modelId: string,
    colIdx: number,
    rowIdx: number,
    value: any,
    onBefore?: any,
    onComplete?: any,
    columnMetadata?: Map<string, EditableColumnMetadata>,
    readonlyRows?: List<any>,
    lockRowCount?: boolean
): void {
    const gridModel = getQueryGridModel(modelId);
    let model = getEditorModel(modelId);

    if (model) {
        const readOnlyRowCount =
            readonlyRows && !lockRowCount ? getReadonlyRowCount(gridModel, model, rowIdx, readonlyRows) : 0;
        const paste = validatePaste(model, colIdx, rowIdx, value, readOnlyRowCount);

        if (paste.success) {
            if (onBefore) {
                onBefore();
            }
            model = beginPaste(model, paste.payload.data.size);

            if (paste.rowsToAdd > 0 && !lockRowCount) {
                model = addRows(gridModel, paste.rowsToAdd);
            }

            const byColumnValues = getPasteValuesByColumn(paste);
            // prior to load, ensure lookup column stores are loaded
            const columnLoaders: any[] = gridModel.getInsertColumns().reduce((arr, column, index) => {
                const filteredLookup = getColumnFilteredLookup(column, columnMetadata);
                if (
                    index >= paste.coordinates.colMin &&
                    index <= paste.coordinates.colMax &&
                    byColumnValues.get(index - paste.coordinates.colMin).size > 0
                )
                    arr.push(
                        initLookup(
                            column,
                            undefined,
                            filteredLookup ? filteredLookup : byColumnValues.get(index - paste.coordinates.colMin)
                        )
                    );
                else arr.push(initLookup(column, LOOKUP_DEFAULT_SIZE, filteredLookup));
                return arr;
            }, []);

            Promise.all(columnLoaders)
                .then(() => {
                    return pasteCellLoad(
                        model,
                        gridModel,
                        paste,
                        (col: QueryColumn) => getLookupStore(col),
                        columnMetadata,
                        readonlyRows,
                        lockRowCount
                    ).then(payload => {
                        model = updateEditorModel(model, {
                            cellMessages: payload.cellMessages,
                            cellValues: payload.cellValues,
                            selectionCells: payload.selectionCells,
                        });

                        model = endPaste(model);
                    });
                })
                .then(() => {
                    if (onComplete) {
                        onComplete();
                    }
                });
        } else {
            const cellKey = genCellKey(colIdx, rowIdx);
            model = updateEditorModel(model, {
                cellMessages: model.cellMessages.set(cellKey, { message: paste.message } as CellMessage),
            });
        }
    }
}

export function pasteEvent(
    modelId: string,
    event: any,
    onBefore?: any,
    onComplete?: any,
    columnMetadata?: Map<string, EditableColumnMetadata>,
    readonlyRows?: List<any>,
    lockRowCount?: boolean
): void {
    const model = getEditorModel(modelId);

    // If a cell has focus do not accept incoming paste events -- allow for normal paste to input
    if (model && model.hasSelection() && !model.hasFocus()) {
        cancelEvent(event);
        pasteCell(
            modelId,
            model.selectedColIdx,
            model.selectedRowIdx,
            getPasteValue(event),
            onBefore,
            onComplete,
            columnMetadata,
            readonlyRows,
            lockRowCount
        );
    }
}
