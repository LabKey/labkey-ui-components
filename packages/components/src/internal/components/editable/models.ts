/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Filter, Query } from '@labkey/api';
import { fromJS, Iterable, List, Map, OrderedMap, Record as ImmutableRecord, Set as ImmutableSet } from 'immutable';
import { ReactNode } from 'react';

import { encodePart } from '../../../public/SchemaQuery';

import { QueryInfo } from '../../../public/QueryInfo';

import { QueryColumn } from '../../../public/QueryColumn';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { GridData } from '../../models';

import { getQueryColumnRenderers } from '../../global';
import { caseInsensitive, quoteValueWithDelimiters } from '../../util/utils';

import { CellCoordinates, EditableGridEvent } from './constants';
import { genCellKey, getValidatedEditableGridValue, parseCellKey } from './utils';

export interface EditableColumnMetadata {
    align?: string;
    caption?: string;
    containerFilter?: Query.ContainerFilter;
    filteredLookupKeys?: List<any>;
    filteredLookupValues?: List<string>;
    getFilteredLookupKeys?: (linkedValues: any[]) => Promise<List<any>>;
    hideTitleTooltip?: boolean;
    isReadOnlyCell?: (rowKey: string) => boolean;
    linkedColInd?: number; // TODO: change to linkedColFieldKey
    lookupValueFilters?: Filter.IFilter[];
    minWidth?: number;
    placeholder?: string;
    popoverClassName?: string;
    readOnly?: boolean;
    toolTip?: ReactNode;
    width?: number;
}

export interface ValueDescriptor {
    display: any;
    raw: any;
}

export interface CellMessage {
    message: string;
}

interface CellReadStatus {
    isReadonlyCell: boolean;
    isReadonlyRow: boolean;
}

export type CellMessages = Map<string, CellMessage>;
export type CellValues = Map<string, List<ValueDescriptor>>;

export interface EditorModelProps {
    cellMessages: CellMessages;
    cellValues: CellValues;
    // columnMap is a Map of fieldKey to QueryColumn, it includes potentially hidden columns such as RowId or Container,
    // which are necessary when updating data. If you need the visible columns use orderedColumns.
    columnMap: Map<string, QueryColumn>;
    columnMetadata: Map<string, EditableColumnMetadata>;
    focusColIdx: number;
    focusRowIdx: number;
    focusValue: List<ValueDescriptor>;
    id: string;
    orderedColumns: List<string>; // List of fieldKeys for the visible columns in the grid
    originalData: Map<string, Map<string, any>>; // The original data associated with this model if we're updating rows
    queryInfo: QueryInfo;
    rowCount: number;
    selectedColIdx: number;
    selectedRowIdx: number;
    selectionCells: string[];
}

export function getPkData(queryInfo: QueryInfo, row: Map<string, any>): Record<string, any> {
    const data = {};
    const pkCols = new Set<string>();
    queryInfo.getPkCols().forEach(col => pkCols.add(col.fieldKey));
    queryInfo.altUpdateKeys?.forEach(key => pkCols.add(key));
    pkCols.forEach(pkCol => {
        let pkVal = caseInsensitive(row.toJS(), pkCol);
        if (Array.isArray(pkVal)) pkVal = pkVal[0];
        if (List.isList(pkVal)) pkVal = pkVal.get(0);

        if (pkVal !== undefined && pkVal !== null) {
            // when backing an editable grid, the data is a simple value, but when
            // backing a grid, it is a Map, which has type 'object'.
            if (Map.isMap(pkVal)) pkVal = pkVal.toJS();

            data[pkCol] = typeof pkVal === 'object' ? pkVal.value : pkVal;
        } else {
            console.warn('Unable to find value for pkCol "' + pkCol + '"');
        }
    });
    return data;
}

const DATA_CHANGE_EVENTS: EditableGridEvent[] = [
    EditableGridEvent.ADD_ROWS,
    EditableGridEvent.BULK_ADD,
    EditableGridEvent.BULK_UPDATE,
    EditableGridEvent.DRAG_FILL,
    EditableGridEvent.FILL_TEXT,
    EditableGridEvent.MODIFY_CELL,
    EditableGridEvent.PASTE,
    EditableGridEvent.REMOVE_ROWS,
];

const SELECTION_EVENTS: EditableGridEvent[] = [
    EditableGridEvent.CLEAR_SELECTION,
    EditableGridEvent.FOCUS_CELL,
    EditableGridEvent.SELECT_CELL,
];

export enum EditorMode {
    Insert,
    Update,
}

export class EditorModel
    extends ImmutableRecord({
        cellMessages: Map<string, CellMessage>(),
        cellValues: Map<string, List<ValueDescriptor>>(),
        columnMap: Map<string, QueryColumn>,
        columnMetadata: Map<string, EditableColumnMetadata>(),
        deletedIds: ImmutableSet<any>(),
        focusColIdx: -1,
        focusRowIdx: -1,
        focusValue: undefined,
        id: undefined,
        isSparseSelection: false,
        orderedColumns: List<string>(),
        originalData: undefined,
        queryInfo: undefined,
        rowCount: 0,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: [],
    })
    implements EditorModelProps
{
    declare cellMessages: CellMessages;
    declare cellValues: CellValues;
    declare columnMap: Map<string, QueryColumn>;
    declare columnMetadata: Map<string, EditableColumnMetadata>;
    declare deletedIds: ImmutableSet<any>;
    declare focusColIdx: number;
    declare focusRowIdx: number;
    declare focusValue: List<ValueDescriptor>;
    declare id: string;
    // NK: This is precomputed property that is updated whenever the selection is updated.
    // See applyEditableGridChangesToModels().
    declare isSparseSelection: boolean;
    declare orderedColumns: List<string>;
    declare originalData: Map<string, Map<string, any>>;
    declare queryInfo: QueryInfo;
    declare rowCount: number;
    declare selectedColIdx: number; // TODO: replace with selectedFieldKey
    declare selectedRowIdx: number;
    // NK: This is pre-sorted array that is updated whenever the selection is updated.
    // See applyEditableGridChangesToModels().
    declare selectionCells: string[];

    get pkFieldKey(): string {
        return this.queryInfo.getPkCols()[0].fieldKey;
    }

    genPkCellKey(rowIndex: number): string {
        return genCellKey(this.pkFieldKey, rowIndex);
    }

    /**
     * Gets the pkValue for a given rowIndex. This assumes there is a single PK column, and is mostly used for handling
     * readonly rows. If you are getting pkValues in order to send data to the server use getPkValues, which will
     * honor multiple PK columns.
     */
    getPkValue(rowIndex: number): any {
        return this.cellValues.get(this.genPkCellKey(rowIndex))?.get(0).raw;
    }

    getPkValueForCell(cellKey: string): any {
        const { rowIdx } = parseCellKey(cellKey);
        return this.getPkValue(rowIdx);
    }

    /**
     * Gets all of the primary key values for a given row.
     * @param rowIndex
     */
    getPkValues(rowIndex: number): Record<string, any> {
        const data = {};
        const pkCols = new Set<string>();
        this.queryInfo.getPkCols().forEach(col => pkCols.add(col.fieldKey));
        this.queryInfo.altUpdateKeys?.forEach(key => pkCols.add(key));
        pkCols.forEach(pkCol => {
            const pkVal = this.getValue(pkCol, rowIndex).get(0).raw;

            if (pkVal !== undefined && pkVal !== null) {
                data[pkCol] = pkVal;
            } else {
                console.warn('Unable to find value for pkCol "' + pkCol + '"');
            }
        });
        return data;
    }

    getFolderValueForCell(cellKey: string): string {
        const { rowIdx } = parseCellKey(cellKey);
        const containerCol = this.columnMap.get('Folder') ?? this.columnMap.get('Container');
        if (!containerCol) return undefined;
        return this.cellValues.get(genCellKey(containerCol.fieldKey, rowIdx)).get(0).raw;
    }

    // TODO: make findNextCell take fieldKey
    findNextCell(
        startCol: number,
        startRow: number,
        predicate: (value: List<ValueDescriptor>, colIdx: number, rowIdx: number) => boolean,
        advance: (colIdx: number, rowIdx: number) => CellCoordinates // TODO: make advance take fieldKey
    ): { colIdx: number; rowIdx: number; value: List<ValueDescriptor> } {
        let colIdx = startCol,
            rowIdx = startRow;

        while (true) {
            ({ colIdx, rowIdx } = advance(colIdx, rowIdx));
            if (!this.isInBounds(colIdx, rowIdx)) break;

            const fieldKey = this.columnMap.get(this.orderedColumns.get(colIdx)).fieldKey;
            const value = this.getValue(fieldKey, rowIdx);
            if (predicate(value, colIdx, rowIdx)) {
                return {
                    value,
                    colIdx,
                    rowIdx,
                };
            }
        }

        // not found
        return undefined;
    }

    getMessage(fieldKey: string, rowIdx: number): CellMessage {
        return this.cellMessages.get(genCellKey(fieldKey, rowIdx));
    }

    getColumns(
        queryInfo: QueryInfo,
        forUpdate?: boolean,
        readOnlyColumns?: string[],
        insertColumns?: QueryColumn[],
        updateColumns?: QueryColumn[],
        colFilter?: (col: QueryColumn) => boolean
    ): QueryColumn[] {
        let columns: QueryColumn[];

        if (forUpdate) {
            columns = updateColumns ?? queryInfo.getUpdateColumns(readOnlyColumns);
        } else {
            columns = insertColumns ?? queryInfo.getInsertColumns();
        }

        if (colFilter) columns = columns.filter(colFilter);
        // file input columns are not supported in the editable grid, so remove them
        return columns.filter(col => !col.isFileInput);
    }

    getColumnValues(fieldKey: string): List<List<ValueDescriptor>> {
        const colIdx = this.orderedColumns.findIndex(colName => colName === fieldKey);
        if (colIdx === -1) {
            console.warn(`Unable to resolve column with fieldKey "${fieldKey}". Cannot retrieve column values.`);
            return List();
        }

        const values = List<List<ValueDescriptor>>().asMutable();
        for (let i = 0; i < this.rowCount; i++) {
            values.push(this.getValue(fieldKey, i));
        }

        return values.asImmutable();
    }

    /** deprecated Use getDataForServerUpload **/
    getRawDataFromModel(
        queryModel: QueryModel,
        displayValues?: boolean,
        forUpdate?: boolean,
        forExport?: boolean
    ): List<Map<string, any>> {
        return this.getDataForServerUpload(displayValues, forUpdate, forExport);
    }

    /**
     * This method formats the EditorModel data so we can upload the data to LKS via insert/updateRows
     * @param displayValues
     * @param forUpdate
     * @param forExport
     */
    getDataForServerUpload(displayValues = true, forUpdate = false, forExport = false): List<Map<string, any>> {
        let rawData = List<Map<string, any>>();
        // TODO: NEED REVIEWER INPUT. Is it safe to use this.columnMap below? It includes pk columns (which we used to
        //  pull from queryModel rows when forUpdate is true) and folder/container columns. I think it is safe to use
        //  this.columnMap because insert cases won't have those columns, but update cases will, so things should just
        //  work™.
        for (let rn = 0; rn < this.rowCount; rn++) {
            let row = Map<string, any>();
            this.columnMap.valueSeq().forEach(col => {
                if (!col) return;
                const values = this.getValue(col.fieldKey, rn);

                // Some column types have special handling of raw data, such as multi value columns like alias, so first
                // check renderer for how to retrieve raw data
                let renderer;
                if (col.columnRenderer) {
                    renderer = getQueryColumnRenderers()[col.columnRenderer.toLowerCase()];
                }

                if (renderer?.getEditableRawValue) {
                    row = row.set(col.name, renderer.getEditableRawValue(values));
                } else if (col.isLookup()) {
                    if (col.isExpInput() || col.isAliquotParent()) {
                        let sep = '';
                        row = row.set(
                            col.name,
                            values.reduce((str, vd) => {
                                if (vd.display !== undefined && vd.display !== null) {
                                    str += sep + quoteValueWithDelimiters(vd.display, ',');
                                    sep = ', ';
                                }
                                return str;
                            }, '')
                        );
                    } else if (col.isJunctionLookup()) {
                        row = row.set(
                            col.name,
                            values.reduce((arr, vd) => {
                                const val = forExport ? vd.display : vd.raw;
                                if (val !== undefined && val !== null) {
                                    arr.push(val);
                                }
                                return arr;
                            }, [])
                        );
                    } else if (col.lookup.displayColumn === col.lookup.keyColumn) {
                        row = row.set(
                            col.name,
                            values.size === 1 ? quoteValueWithDelimiters(values.first()?.display, ',') : undefined
                        );
                    } else {
                        let val;
                        if (values.size === 1) val = forExport ? values.first()?.display : values.first()?.raw;
                        row = row.set(col.name, val);
                    }
                } else if (col.jsonType === 'time') {
                    row = row.set(col.name, values.size === 1 ? values.first().raw : undefined);
                } else if (col.jsonType !== 'date' || !displayValues) {
                    const val = values.size === 1 ? values.first().raw : undefined;
                    row = row.set(col.name, getValidatedEditableGridValue(val, col).value);
                } else {
                    row = row.set(col.name, values.size === 1 ? values.first().raw?.toString().trim() : undefined);
                }
            });

            rawData = rawData.push(row);
        }

        return rawData;
    }

    /**
     * Determines which rows in the grid have missing required fields, which sets of rows have combinations
     * of key fields that are duplicated, and, optionally, which sets of rows have duplicated values for a
     * given field key.
     *
     * @param uniqueFieldKey optional (non-key) field that should be unique.
     */
    validateData(uniqueFieldKey?: string): {
        cellMessages: CellMessages; // updated cell messages with missing required errors
        missingRequired: Map<string, List<number>>; // map from column caption to row numbers with missing values
        uniqueKeyViolations: Map<string, Map<string, List<number>>>; // map from the column captions (joined by ,) to a map from values that are duplicates to row numbers.
    } {
        const columns = this.columnMap.valueSeq().toArray();
        let cellMessages = this.cellMessages;
        let uniqueFieldCol;
        const keyColumns = columns.filter(column => column.isKeyField);
        let keyValues = Map<number, List<string>>(); // map from row number to list of key values on that row
        let uniqueKeyMap = Map<string, List<number>>(); // map from value to rows with that value
        let missingRequired = Map<string, List<number>>(); // map from column caption to list of rows missing a value for that column
        for (let rn = 0; rn < this.rowCount; rn++) {
            columns.forEach(col => {
                const fieldKey = col.fieldKey;
                const cellKey = genCellKey(fieldKey, rn);
                const values = this.getValue(fieldKey, rn);
                if (col.required && !col.isUniqueIdColumn) {
                    const message = this.getMessage(fieldKey, rn);
                    const missingMsg = col.caption + ' is required.';
                    let updatedMsg = message?.message;
                    if (values.isEmpty() || values.find(value => this.hasRawValue(value)) == undefined) {
                        if (!message || message?.message?.indexOf(missingMsg) === -1) {
                            if (!message || !message.message) updatedMsg = missingMsg;
                            else updatedMsg = message.message + '. ' + missingMsg;
                        }

                        if (missingRequired.has(col.caption)) {
                            missingRequired = missingRequired.set(
                                col.caption,
                                missingRequired.get(col.caption).push(rn + 1)
                            );
                        } else {
                            missingRequired = missingRequired.set(col.caption, List<number>([rn + 1]));
                        }
                    } else {
                        if (updatedMsg?.indexOf(missingMsg) > -1) {
                            updatedMsg = updatedMsg.replace(missingMsg, '');
                        }
                    }
                    if (updatedMsg == null || updatedMsg.trim() === '') cellMessages = cellMessages.remove(cellKey);
                    else cellMessages = cellMessages.set(cellKey, { message: updatedMsg });
                }

                if (col.isKeyField) {
                    // there better be only one of these
                    const valueDescriptor = values.get(0);
                    if (this.hasRawValue(valueDescriptor)) {
                        if (keyValues.has(rn + 1)) {
                            keyValues = keyValues.set(
                                rn + 1,
                                keyValues.get(rn + 1).push(valueDescriptor.raw.toString())
                            );
                        } else {
                            keyValues = keyValues.set(rn + 1, List<string>([valueDescriptor.raw.toString()]));
                        }
                    }
                } else if (uniqueFieldKey && col.fieldKey === uniqueFieldKey) {
                    uniqueFieldCol = col;
                    // there better be only one of these
                    const valueDescriptor = values.get(0);
                    if (valueDescriptor && this.hasRawValue(valueDescriptor)) {
                        const stringVal = valueDescriptor.raw.toString().trim().toLowerCase();
                        if (uniqueKeyMap.has(stringVal)) {
                            uniqueKeyMap = uniqueKeyMap.set(stringVal, uniqueKeyMap.get(stringVal).push(rn + 1));
                        } else {
                            uniqueKeyMap = uniqueKeyMap.set(stringVal, List<number>([rn + 1]));
                        }
                    }
                }
            });
        }

        let uniqueKeyViolations = Map<string, Map<string, List<number>>>();
        const duplicates = uniqueKeyMap.filter(rowNumbers => rowNumbers.size > 1).toMap();
        if (duplicates.size > 0 && uniqueFieldCol) {
            uniqueKeyViolations = uniqueKeyViolations.set(uniqueFieldCol.caption, duplicates);
        }

        // Join all the keyValues together and put them in a map with a list of row
        // numbers with that key.  Then filter to those lists with more than one item.
        const keyViolations = keyValues
            .reduce((keyMap, values, rowNumber) => {
                const key = values.join(', ');
                if (keyMap.has(key)) return keyMap.set(key, keyMap.get(key).push(rowNumber));
                else return keyMap.set(key, List<number>([rowNumber]));
            }, Map<string, List<number>>())
            .filter(rowNumbers => rowNumbers.size > 1)
            .toMap();
        if (!keyViolations.isEmpty()) {
            uniqueKeyViolations = uniqueKeyViolations.set(
                keyColumns.map(column => column.caption).join(', '),
                keyViolations
            );
        }

        // need to return a map from the column names/captions to the rows with duplicates.
        // Message:
        //   Duplicate values (val1, val2) for <column1, column2> on rows X, Y, Z.
        return {
            uniqueKeyViolations,
            missingRequired,
            cellMessages,
        };
    }

    getValidationErrors(uniqueFieldKey?: string): { cellMessages: CellMessages; errors: string[] } {
        const { uniqueKeyViolations, missingRequired, cellMessages } = this.validateData(uniqueFieldKey);
        let errors = [];
        if (!uniqueKeyViolations.isEmpty()) {
            const messages = uniqueKeyViolations.reduce((keyMessages, valueMap, fieldNames) => {
                return keyMessages.concat(
                    valueMap.reduce((messages, rowNumbers, values) => {
                        messages.push(
                            'Duplicate value (' +
                                values +
                                ') for ' +
                                fieldNames +
                                ' on rows ' +
                                rowNumbers.join(', ') +
                                '.'
                        );
                        return messages;
                    }, new Array<string>())
                );
            }, new Array<string>());
            errors = errors.concat(messages);
        }
        if (!missingRequired.isEmpty()) {
            const messages = missingRequired
                .reduce((messages, rowNumbers, fieldName) => {
                    messages.push(
                        fieldName +
                            ' is missing from ' +
                            (rowNumbers.size > 1 ? 'rows ' : 'row ') +
                            rowNumbers.join(', ') +
                            '.'
                    );
                    return messages;
                }, new Array<string>())
                .join(' ');
            errors = errors.concat(messages);
        }

        return {
            errors,
            cellMessages,
        };
    }

    getValue(fieldKey: string, rowIdx: number): List<ValueDescriptor> {
        return this.getValueForCellKey(genCellKey(fieldKey, rowIdx));
    }

    getValueForCellKey(cellKey: string): List<ValueDescriptor> {
        if (this.cellValues.has(cellKey)) {
            return this.cellValues.get(cellKey);
        }

        return List<ValueDescriptor>();
    }

    isReadOnlyRow(rowIdx: number, readonlyRows: string[]): boolean {
        const pkValue = this.getPkValue(rowIdx).toString();
        return readonlyRows?.includes(pkValue);
    }

    getCellReadStatus(fieldKey: string, rowIdx: number, readonlyRows: string[]): CellReadStatus {
        const pkValue = this.getPkValue(rowIdx)?.toString();

        return {
            isReadonlyCell: this.columnMetadata?.get(fieldKey)?.isReadOnlyCell(pkValue) ?? false,
            isReadonlyRow: readonlyRows?.includes(pkValue) ?? false,
        };
    }

    get hasFocus(): boolean {
        return this.focusColIdx > -1 && this.focusRowIdx > -1;
    }

    get isMultiSelect(): boolean {
        return this.selectionCells.length > 1;
    }

    get isMultiColumnSelection(): boolean {
        if (!this.isMultiSelect) return false;

        const firstCellColIdx = parseCellKey(this.selectionCells[0]).fieldKey;
        return this.selectionCells.some(cellKey => parseCellKey(cellKey).fieldKey !== firstCellColIdx);
    }

    get hasSelection(): boolean {
        return this.selectedColIdx > -1 && this.selectedRowIdx > -1;
    }

    get selectionKey(): string {
        const fieldKey = this.columnMap.get(this.orderedColumns.get(this.selectedColIdx)).fieldKey;
        if (this.hasSelection) return genCellKey(fieldKey, this.selectedRowIdx);
        return undefined;
    }

    isInBounds(colIdx: number, rowIdx: number): boolean {
        return colIdx >= 0 && colIdx < this.orderedColumns.size && rowIdx >= 0 && rowIdx < this.rowCount;
    }

    inSelection(fieldKey: string, rowIdx: number): boolean {
        if (rowIdx < 0) return false;
        const cellKey = genCellKey(fieldKey, rowIdx);
        return this.selectionCells.find(ck => cellKey === ck) !== undefined;
    }

    hasRawValue(descriptor: ValueDescriptor): boolean {
        return descriptor && descriptor.raw != null && descriptor.raw.toString().trim() !== '';
    }

    get hasData(): boolean {
        return (
            this.cellValues.find(valueList => {
                return valueList?.find(value => this.hasRawValue(value)) !== undefined;
            }) !== undefined
        );
    }

    isFocused(colIdx: number, rowIdx: number): boolean {
        return colIdx > -1 && rowIdx > -1 && this.focusColIdx === colIdx && this.focusRowIdx === rowIdx;
    }

    isSelected(colIdx: number, rowIdx: number): boolean {
        return colIdx > -1 && rowIdx > -1 && this.selectedColIdx === colIdx && this.selectedRowIdx === rowIdx;
    }

    static isDataChangeEvent(event: EditableGridEvent): boolean {
        return DATA_CHANGE_EVENTS.find(e => e === event) !== undefined;
    }

    isSelectionEvent(event: EditableGridEvent): boolean {
        return SELECTION_EVENTS.find(e => e === event) !== undefined;
    }

    static getEditorDataFromQueryValueMap(valueMap: any): List<any> | any {
        // Editor expects to get either a single value or an array of an object with fields displayValue and value
        if (List.isList(valueMap)) {
            return (valueMap as List<any>)
                .map(val => {
                    // If immutable convert to normal JS
                    if (Iterable.isIterable(val)) {
                        return { displayValue: val.get('displayValue'), value: val.get('value') };
                    }
                    return val;
                })
                .toList();
        }

        if (valueMap?.has('value') && valueMap.get('value') !== null && valueMap.get('value') !== undefined) {
            if (valueMap.has('formattedValue')) {
                return List.of({ displayValue: valueMap.get('formattedValue'), value: valueMap.get('value') });
            }
            if (valueMap.has('displayValue')) {
                return List.of({ displayValue: valueMap.get('displayValue'), value: valueMap.get('value') });
            }
            return valueMap.get('value');
        }

        return undefined;
    }

    static convertQueryDataToEditorData(
        data: Map<string, any>,
        updates?: Map<any, any>,
        idsNotToUpdate?: number[],
        fieldsNotToUpdate?: string[],
        encode = true
    ): Map<any, Map<string, any>> {
        return data
            .map((valueMap, id) => {
                const returnMap = valueMap.reduce((m, valueMap_, key) => {
                    const editorData = EditorModel.getEditorDataFromQueryValueMap(valueMap_);
                    if (editorData === undefined) {
                        return m;
                    }

                    // data maps have keys that are display names/captions. We need to convert to the
                    // encoded keys used in our filters to match up with values from the forms.
                    const key_ = encode ? encodePart(key) : key;
                    return m.set(key_, editorData);
                }, Map<any, any>());

                if (!updates) {
                    return returnMap;
                }

                if (!idsNotToUpdate || idsNotToUpdate.indexOf(parseInt(id, 10)) < 0 || !fieldsNotToUpdate) {
                    return returnMap.merge(updates);
                }

                let trimmedUpdates = Map<any, any>();
                updates.forEach((value, fieldKey) => {
                    if (fieldsNotToUpdate.indexOf(fieldKey.toLowerCase()) < 0) {
                        trimmedUpdates = trimmedUpdates.set(fieldKey, value);
                    }
                });
                return returnMap.merge(trimmedUpdates);
            })
            .toMap();
    }

    static convertQueryModelDataToGridResponse(model: QueryModel): GridResponse {
        const data = {};
        const dataIds = [];

        model.orderedRows.forEach(pk => {
            data[pk] = model.rows[pk];
            dataIds.push(pk);
        });

        return {
            data: EditorModel.convertQueryDataToEditorData(fromJS(data), undefined, undefined, undefined, false),
            dataIds: fromJS(dataIds),
        };
    }

    lastSelection(fieldKey: string, rowIdx: number): boolean {
        const cellKeys = this.isMultiSelect ? this.selectionCells : [this.selectionKey];
        return genCellKey(fieldKey, rowIdx) === cellKeys[cellKeys.length - 1];
    }
}

export interface GridResponse {
    data: Map<any, any>;
    dataIds: List<any>;
}

interface GridSelectionResponse {
    selectedIds: List<any>;
}

/**
 * TODO: GridLoader and EditableGridLoader are artifacts of QueryGridModel, this is why they return GridResponse, which
 * uses Immutable, despite the data loaded from EditableGridLoaders going into QueryModels, which end up converting the
 * data back to regular JS objects. We should revisit this class, and consider maybe using QueryModelLoaders instead, or
 * maybe something else altogether. Many cases of EditableGridLoader do not actually asynchronously fetch data, since
 * they get their data from existing QueryModels, we may be able to eliminate the need for async fetch altogether.
 *
 * Implementations that do not asynchronously load data:
 * - MoveSamplesGridLoader
 * - SingleStorageEditableGridLoader
 * - AssayWizardModelEditableGridLoader
 * - PlateSetCreateGridLoader
 * - PlateGridLoader
 * - EntityGridLoader
 * - MultiStorageGridLoader
 *
 * Implementations that do asynchronously load data:
 * - StorageEditableGridLoaderFromSelection (uses getSelectedData)
 * - EditableGridLoaderFromSelection (uses getSelectedData)
 */
export interface GridLoader {
    fetch: (model: QueryModel) => Promise<GridResponse>;
    fetchSelection?: (model: QueryModel) => Promise<GridSelectionResponse>;
}

export interface EditableGridLoader extends GridLoader {
    columns?: QueryColumn[];
    id: string;
    mode: EditorMode;
    omittedColumns?: string[];
    queryInfo: QueryInfo;
    requiredColumns?: string[];
}

export interface MessageAndValue {
    message?: CellMessage;
    valueDescriptor: ValueDescriptor;
}

// TODO: remove this
export interface EditableGridModels {
    dataModels: QueryModel[];
    editorModels: EditorModel[];
}
