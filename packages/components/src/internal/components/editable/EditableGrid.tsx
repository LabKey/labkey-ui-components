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
import { Query, Utils } from '@labkey/api';
import classNames from 'classnames';
import { List, Map, OrderedMap, Set } from 'immutable';
import React, { ChangeEvent, PureComponent, ReactNode } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import { Operation, QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';

import { EditableGridExportMenu, ExportOption } from '../../../public/QueryModel/ExportMenu';
import { SelectionPivot } from '../../../public/QueryModel/QueryModel';
import { Key } from '../../../public/useEnterEscape';

import { incrementClientSideMetricCount } from '../../actions';
import {
    CELL_SELECTION_HANDLE_CLASSNAME,
    GRID_CHECKBOX_OPTIONS,
    GRID_EDIT_INDEX,
    GRID_SELECTION_INDEX,
    MAX_EDITABLE_GRID_ROWS,
} from '../../constants';
import { cancelEvent, isCtrlOrMetaKey } from '../../events';

import { headerSelectionCell } from '../../renderers';
import { blurActiveElement, capitalizeFirstChar, caseInsensitive, not } from '../../util/utils';
import { Alert } from '../base/Alert';
import { DeleteIcon } from '../base/DeleteIcon';
import { Grid } from '../base/Grid';

import { GridColumn, GridColumnCellRenderer } from '../base/models/GridColumn';

import { BulkAddUpdateForm } from '../forms/BulkAddUpdateForm';
import { QueryInfoForm, QueryInfoFormProps } from '../forms/QueryInfoForm';

import { Tab, Tabs } from '../../Tabs';

import {
    addRows,
    addRowsPerPivotValue,
    checkCellReadStatus,
    copyEvent,
    dragFillEvent,
    pasteEvent,
    updateGridFromBulkForm,
} from './actions';
import { BorderMask, Cell } from './Cell';

import {
    CellActions,
    CellCoordinates,
    EDITABLE_GRID_CONTAINER_CLS,
    EditableGridEvent,
    MODIFICATION_TYPES,
    SELECTION_TYPES,
} from './constants';
import { AddRowsControl, AddRowsControlProps, PlacementType } from './Controls';

import { CellMessage, EditableColumnMetadata, EditorModel, EditorModelProps, ValueDescriptor } from './models';
import { computeRangeChange, genCellKey, parseCellKey } from './utils';

function isCellEmpty(values: List<ValueDescriptor>): boolean {
    return !values || values.isEmpty() || values.some(v => v.raw === undefined || v.raw === null || v.raw === '');
}

function moveDown(colIdx: number, rowIdx: number): CellCoordinates {
    return { colIdx, rowIdx: rowIdx + 1 };
}

function moveLeft(colIdx: number, rowIdx: number): CellCoordinates {
    return { colIdx: colIdx - 1, rowIdx };
}

function moveRight(colIdx: number, rowIdx: number): CellCoordinates {
    return { colIdx: colIdx + 1, rowIdx };
}

function moveUp(colIdx: number, rowIdx: number): CellCoordinates {
    return { colIdx, rowIdx: rowIdx - 1 };
}

function hasCellWidthOverride(metadata: EditableColumnMetadata): boolean {
    return !!metadata?.minWidth || !!metadata?.width;
}

function computeSelectionCellKeys(
    minColIdx: number,
    minRowIdx: number,
    maxColIdx: number,
    maxRowIdx: number
): string[] {
    const selectionCells = [];

    for (let c = minColIdx; c <= maxColIdx; c++) {
        for (let r = minRowIdx; r <= maxRowIdx; r++) {
            selectionCells.push(genCellKey(c, r));
        }
    }

    return selectionCells;
}

function computeBorderMask(
    minCol: number,
    maxCol: number,
    minRow: number,
    maxRow: number,
    colIdx: number,
    rowIdx: number,
    currentMask: BorderMask
): BorderMask {
    const borderMask: BorderMask = [...currentMask];
    const betweenColumns = colIdx >= minCol && colIdx <= maxCol;
    const betweenRows = rowIdx >= minRow && rowIdx <= maxRow;
    if (minRow === rowIdx && betweenColumns) borderMask[0] = true;
    if (maxCol === colIdx && betweenRows) borderMask[1] = true;
    if (maxRow === rowIdx && betweenColumns) borderMask[2] = true;
    if (minCol === colIdx && betweenRows) borderMask[3] = true;
    return borderMask;
}

const COUNT_COL = new GridColumn({
    index: GRID_EDIT_INDEX,
    tableCell: true,
    title: 'Row',
    width: 45,
    // style cast to "any" type due to @types/react@16.3.14 switch to csstype package usage which does not declare
    // "textAlign" property correctly for <td> elements.
    cell: (d, r, c, rn) => (
        <td className="cellular-count" key={c.index} style={{ textAlign: c.align || 'left' } as any}>
            <div className="cellular-count-static-content">{rn + 1}</div>
        </td>
    ),
});

type GridMouseEvent = React.MouseEvent<HTMLDivElement> | MouseEvent;

// the column index for cell values and cell messages does not include either the selection
// column or the row number column, so we adjust the value passed to <Cell> to accommodate.
function inputCellFactory(
    queryInfo: QueryInfo,
    editorModel: EditorModel,
    allowSelection: boolean,
    hideCountCol: boolean,
    columnMetadata: EditableColumnMetadata,
    readonlyRows: string[],
    lockedRows: string[],
    cellActions: CellActions,
    containerFilter: Query.ContainerFilter,
    forUpdate: boolean,
    initialSelection: string[]
): GridColumnCellRenderer {
    return (value, row, c, rn, cn) => {
        let colOffset = 0;
        if (allowSelection) colOffset += 1;
        if (!hideCountCol) colOffset += 1;

        const colIdx = cn - colOffset;
        const isReadonlyCol = columnMetadata ? columnMetadata.readOnly : false;
        const { isReadonlyCell, isReadonlyRow, isLockedRow } = checkCellReadStatus(
            row,
            queryInfo,
            columnMetadata,
            readonlyRows,
            lockedRows
        );

        let linkedValues;
        if (columnMetadata?.getFilteredLookupKeys) {
            linkedValues = editorModel
                .getValue(columnMetadata.linkedColInd, rn)
                .map(vd => vd.raw)
                .toArray();
        }

        const { isSparseSelection, selectionCells } = editorModel;
        const renderDragHandle = !isSparseSelection && editorModel.lastSelection(colIdx, rn);
        let inSelection = editorModel.inSelection(colIdx, rn);
        let borderMask: BorderMask = [false, false, false, false];

        if (!isSparseSelection && selectionCells.length) {
            const minCell = parseCellKey(selectionCells[0]);
            const maxCell = parseCellKey(selectionCells[selectionCells.length - 1]);
            borderMask = computeBorderMask(
                minCell.colIdx,
                maxCell.colIdx,
                minCell.rowIdx,
                maxCell.rowIdx,
                colIdx,
                rn,
                borderMask
            );
        }

        if (!isSparseSelection && initialSelection?.length) {
            const minCell = parseCellKey(initialSelection[0]);
            const maxCell = parseCellKey(initialSelection[initialSelection.length - 1]);
            borderMask = computeBorderMask(
                minCell.colIdx,
                maxCell.colIdx,
                minCell.rowIdx,
                maxCell.rowIdx,
                colIdx,
                rn,
                borderMask
            );
            inSelection = initialSelection.includes(genCellKey(colIdx, rn));
        }

        const focused = editorModel.isFocused(colIdx, rn);
        const className = classNames({ 'grid-col-with-width': hasCellWidthOverride(columnMetadata) });

        return (
            <td className={className} key={inputCellKey(c.raw, row)} style={{ textAlign: c.align || 'left' } as any}>
                <Cell
                    borderMaskTop={borderMask[0]}
                    borderMaskRight={borderMask[1]}
                    borderMaskBottom={borderMask[2]}
                    borderMaskLeft={borderMask[3]}
                    cellActions={cellActions}
                    col={c.raw}
                    colIdx={colIdx}
                    row={focused ? row : undefined}
                    containerFilter={containerFilter}
                    placeholder={columnMetadata?.placeholder}
                    readOnly={isReadonlyCol || isReadonlyRow || isReadonlyCell}
                    locked={isLockedRow}
                    rowIdx={rn}
                    focused={focused}
                    forUpdate={forUpdate}
                    message={editorModel.getMessage(colIdx, rn)}
                    selected={editorModel.isSelected(colIdx, rn)}
                    selection={inSelection}
                    renderDragHandle={renderDragHandle}
                    values={editorModel.getValue(colIdx, rn)}
                    lookupValueFilters={columnMetadata?.lookupValueFilters}
                    filteredLookupValues={columnMetadata?.filteredLookupValues}
                    filteredLookupKeys={columnMetadata?.filteredLookupKeys}
                    getFilteredLookupKeys={columnMetadata?.getFilteredLookupKeys}
                    linkedValues={linkedValues}
                />
            </td>
        );
    };
}

function inputCellKey(col: QueryColumn, row: any): string {
    const indexKey = row.get(GRID_EDIT_INDEX);

    if (indexKey === undefined || indexKey === null) {
        throw new Error(`QueryFormInputs.encodeName: Unable to encode name for field "${col.fieldKey}".`);
    }

    return [col.fieldKey, indexKey].join('_$Cell$_');
}

export interface BulkAddData {
    pivotKey?: string;
    pivotValues?: string[];
    totalItems?: number;
    validationMsg?: ReactNode;
}

export interface BulkUpdateQueryInfoFormProps extends QueryInfoFormProps {
    applyBulkUpdateBtnText?: string;
    excludeRowIdx?: number[]; // the row ind to exclude for bulk update, row might be readonly or locked
    onBulkUpdateFormDataChange?: (pendingBulkFormData?: any) => void;
    onClickBulkUpdate?: (selected: Set<number>) => Promise<boolean>;
    warning?: string;
}

export interface SharedEditableGridProps {
    activeEditTab?: EditableGridTabs;
    addControlProps?: Partial<AddRowsControlProps>;
    allowAdd?: boolean;
    allowBulkAdd?: boolean;
    allowBulkRemove?: boolean;
    allowBulkUpdate?: boolean;
    allowFieldDisable?: boolean;
    allowRemove?: boolean;
    bordered?: boolean;
    bulkAddProps?: Partial<QueryInfoFormProps>;
    bulkAddText?: string;
    bulkRemoveText?: string;
    bulkUpdateProps?: Partial<BulkUpdateQueryInfoFormProps>;
    bulkUpdateText?: string;
    columnMetadata?: Map<string, EditableColumnMetadata>;
    condensed?: boolean;
    containerFilter?: Query.ContainerFilter;
    disabled?: boolean;
    emptyGridMsg?: string;
    exportColFilter?: (col: QueryColumn) => boolean;
    extraExportColumns?: Array<Partial<QueryColumn>>;
    forUpdate?: boolean;
    hideCountCol?: boolean;
    hideTopControls?: boolean;
    insertColumns?: QueryColumn[];
    isSubmitting?: boolean;
    lockedRows?: string[]; // list of key values for rows that are locked. locked rows are readonly but might have a different display from readonly rows
    maxRows?: number;
    metricFeatureArea?: string;
    notDeletable?: List<any>; // list of key values that cannot be deleted.
    primaryBtnProps?: EditableGridBtnProps;
    processBulkData?: (data: OrderedMap<string, any>) => BulkAddData;
    readOnlyColumns?: string[];
    readonlyRows?: string[]; // list of key values for rows that are readonly.
    removeColumnTitle?: string;
    rowNumColumn?: GridColumn;
    showAsTab?: boolean; // Toggle "Edit in Grid" and "Edit in Bulk" as tabs
    showBulkTabOnLoad?: boolean;
    striped?: boolean;
    tabAdditionalBtn?: ReactNode;
    tabBtnProps?: EditableGridBtnProps;
    tabContainerCls?: string;
    updateColumns?: QueryColumn[];
}

export interface EditableGridBtnProps {
    caption?: string;
    cls?: string;
    disabled?: boolean;
    onClick?: (pendingBulkFormData?: OrderedMap<string, any>, editorModelChanges?: Partial<EditorModelProps>) => void;
    placement?: PlacementType;
    show?: boolean;
}

export interface SharedEditableGridPanelProps extends SharedEditableGridProps {
    activeTab?: number;
    bsStyle?: any;
    className?: string;
    getColumnMetadata?: (tabId?: number) => Map<string, EditableColumnMetadata>;
    getReadOnlyRows?: (tabId?: number) => string[];
    getTabHeader?: (tabId?: number) => ReactNode;
    getTabTitle?: (tabId?: number) => string;
    getUpdateColumns?: (tabId?: number) => QueryColumn[];
    title?: string;
}

export type EditableGridChange = (
    event: EditableGridEvent,
    editorModelChanges: Partial<EditorModelProps>,
    dataKeys?: List<any>,
    data?: Map<any, Map<string, any>>,
    index?: number
) => void;

export interface EditableGridProps extends SharedEditableGridProps {
    data?: Map<any, Map<string, any>>;
    dataKeys?: List<any>;
    editorModel: EditorModel;
    error: string;
    exportHandler?: (option: ExportOption) => void;
    onChange: EditableGridChange;
    queryInfo: QueryInfo;
}

export interface EditableGridState {
    activeEditTab?: EditableGridTabs;
    inDrag: boolean;
    initialSelection: string[];
    pendingBulkFormData?: any;
    selected: Set<number>;
    selectedState: GRID_CHECKBOX_OPTIONS;
    selectionPivot?: SelectionPivot;
    showBulkAdd: boolean;
    showBulkUpdate: boolean;
    showMask: boolean;
}

export enum EditableGridTabs {
    BulkAdd = 'BulkAdd',
    BulkUpdate = 'BulkUpdate',
    Grid = 'Grid',
}

export class EditableGrid extends PureComponent<EditableGridProps, EditableGridState> {
    static defaultProps = {
        allowAdd: true,
        allowBulkAdd: false,
        allowBulkRemove: false,
        allowBulkUpdate: false,
        allowRemove: false,
        removeColumnTitle: 'Delete',
        addControlProps: {
            nounPlural: 'Rows',
            nounSingular: 'Row',
        },
        bordered: false,
        bulkAddText: 'Bulk Add',
        bulkRemoveText: 'Delete Rows',
        bulkUpdateText: 'Bulk Update',
        columnMetadata: Map<string, EditableColumnMetadata>(),
        notDeletable: List<any>(),
        condensed: false,
        disabled: false,
        isSubmitting: false,
        striped: false,
        maxRows: MAX_EDITABLE_GRID_ROWS,
        hideCountCol: false,
        hideTopControls: false,
        rowNumColumn: COUNT_COL,
    };

    private dragDelay: number;
    private maskDelay: number;

    cellActions: CellActions;

    constructor(props: EditableGridProps) {
        super(props);
        this.cellActions = {
            clearSelection: this.clearSelection,
            focusCell: this.focusCell,
            fillDown: this.fillDown,
            inDrag: this.inDrag,
            modifyCell: this.modifyCell,
            selectCell: this.selectCell,
        };

        let selectionCells = Set<number>();
        let selectedState = GRID_CHECKBOX_OPTIONS.NONE;
        if (props.activeEditTab === EditableGridTabs.BulkUpdate) {
            selectionCells = Set<number>(props.dataKeys.map((v, i) => i, Set<number>()));
            selectedState = GRID_CHECKBOX_OPTIONS.ALL;
        }

        this.state = {
            activeEditTab: props.activeEditTab ? props.activeEditTab : EditableGridTabs.Grid,
            inDrag: false,
            initialSelection: undefined,
            selected: selectionCells,
            selectedState,
            selectionPivot: undefined,
            showBulkAdd: false,
            showBulkUpdate: false,
            showMask: false,
        };
    }

    componentDidMount(): void {
        document.addEventListener('copy', this.onCopy);
        document.addEventListener('cut', this.onCut);
        document.addEventListener('paste', this.onPaste);
    }

    componentWillUnmount(): void {
        document.removeEventListener('copy', this.onCopy);
        document.removeEventListener('cut', this.onCut);
        document.removeEventListener('paste', this.onPaste);
    }

    select = (row: Map<string, any>, event: ChangeEvent<HTMLInputElement>): void => {
        const checked = event.currentTarget.checked;
        // Look through to the nativeEvent to determine if the shift key is engaged.
        const isShiftSelect = (event.nativeEvent as any).shiftKey ?? false;

        this.setState(state => {
            const { dataKeys } = this.props;
            const { selectionPivot } = state;
            let { selected } = state;
            const key = row.get(GRID_EDIT_INDEX);

            if (isShiftSelect && selectionPivot) {
                const pivotIdx = parseInt(selectionPivot.selection, 10);
                const beginIdx = Math.min(key, pivotIdx);
                const endIdx = Math.max(key, pivotIdx);
                for (let i = beginIdx; i <= endIdx; i++) {
                    if (selectionPivot.checked) {
                        selected = selected.add(i);
                    } else {
                        selected = selected.remove(i);
                    }
                }
            } else if (checked) {
                selected = selected.add(key);
            } else {
                selected = selected.remove(key);
            }

            let selectedState: GRID_CHECKBOX_OPTIONS;
            if (selected.size === 0) {
                selectedState = GRID_CHECKBOX_OPTIONS.NONE;
            } else if (dataKeys.size === selected.size) {
                selectedState = GRID_CHECKBOX_OPTIONS.ALL;
            } else {
                selectedState = GRID_CHECKBOX_OPTIONS.SOME;
            }

            const nextState: any /* Partial<EditableGridState> */ = { selected, selectedState };

            if (!isShiftSelect) {
                nextState.selectionPivot = { checked, selection: key.toString() };
            }

            return nextState;
        });
    };

    selectAll = (evt: ChangeEvent<HTMLInputElement>): void => {
        const { dataKeys } = this.props;
        const checked = evt.currentTarget.checked === true;

        this.setState(state => {
            const selected = checked && state.selectedState !== GRID_CHECKBOX_OPTIONS.ALL;
            return {
                selected: selected ? Set<number>(dataKeys.map((v, i) => i, Set<number>())) : Set<number>(),
                selectedState: selected ? GRID_CHECKBOX_OPTIONS.ALL : GRID_CHECKBOX_OPTIONS.NONE,
                selectionPivot: undefined,
            };
        });
    };

    getColumns = (): QueryColumn[] => {
        const { editorModel, forUpdate, insertColumns, queryInfo, readOnlyColumns, updateColumns } = this.props;
        return editorModel.getColumns(queryInfo, forUpdate, readOnlyColumns, insertColumns, updateColumns);
    };

    focusCell = (colIdx: number, rowIdx: number, clearValue?: boolean): void => {
        const { editorModel, onChange } = this.props;
        const cellKey = genCellKey(colIdx, rowIdx);
        const changes: Partial<EditorModelProps> = {
            cellMessages: editorModel.cellMessages.remove(cellKey),
            focusColIdx: colIdx,
            focusRowIdx: rowIdx,
            focusValue: editorModel.getIn(['cellValues', cellKey]),
            selectedColIdx: colIdx,
            selectedRowIdx: rowIdx,
        };

        if (clearValue) {
            changes.cellValues = editorModel.cellValues.set(cellKey, List<ValueDescriptor>());
        }

        onChange(EditableGridEvent.FOCUS_CELL, changes);
    };

    clearSelection = (): void => {
        const { onChange } = this.props;
        onChange(EditableGridEvent.CLEAR_SELECTION, {
            selectedColIdx: -1,
            selectedRowIdx: -1,
            focusColIdx: -1,
            focusRowIdx: -1,
        });
    };

    applySelection = (colIdx: number, rowIdx: number, selection?: SELECTION_TYPES): Partial<EditorModel> => {
        const { initialSelection } = this.state;
        const { editorModel } = this.props;
        const { rowCount } = editorModel;
        let selectionCells: string[] = [];
        const hasSelection = editorModel.hasSelection;
        let selectedColIdx = colIdx;
        let selectedRowIdx = rowIdx;

        switch (selection) {
            case SELECTION_TYPES.ALL:
                for (let c = 0; c < editorModel.columns.size; c++) {
                    for (let r = 0; r < rowCount; r++) {
                        selectionCells.push(genCellKey(c, r));
                    }
                }
                break;
            case SELECTION_TYPES.AREA:
                selectedColIdx = editorModel.selectedColIdx;
                selectedRowIdx = editorModel.selectedRowIdx;

                if (hasSelection) {
                    let minColIdx = Math.min(selectedColIdx, colIdx);
                    let maxColIdx = Math.max(selectedColIdx, colIdx);
                    let minRowIdx = Math.min(selectedRowIdx, rowIdx);
                    let maxRowIdx = Math.max(selectedRowIdx, rowIdx);

                    if (initialSelection !== undefined) {
                        // If we have an initialSelection we want to prevent the user from changing the number of
                        // columns, or from shrinking the initially selected state. Functionally this means a user can
                        // only expand a selection upwards or downwards, just like in Excel/Sheets.
                        const minInitialCell = parseCellKey(initialSelection[0]);
                        const maxInitialCell = parseCellKey(initialSelection[initialSelection.length - 1]);
                        minColIdx = minInitialCell.colIdx;
                        maxColIdx = maxInitialCell.colIdx;
                        minRowIdx = Math.min(minRowIdx, minInitialCell.rowIdx);
                        maxRowIdx = Math.max(maxRowIdx, maxInitialCell.rowIdx);
                    }

                    selectionCells = computeSelectionCellKeys(minColIdx, minRowIdx, maxColIdx, maxRowIdx);
                }
                break;
            case SELECTION_TYPES.AREA_CHANGE: {
                selectedColIdx = editorModel.selectedColIdx;
                selectedRowIdx = editorModel.selectedRowIdx;
                const colDir = colIdx - selectedColIdx;
                const rowDir = rowIdx - selectedRowIdx;
                let start: CellCoordinates;
                let end: CellCoordinates;

                if (editorModel.selectionCells && editorModel.selectionCells.length > 0) {
                    start = parseCellKey(editorModel.selectionCells[0]);
                    end = parseCellKey(editorModel.selectionCells[editorModel.selectionCells.length - 1]);
                } else {
                    start = { colIdx: selectedColIdx, rowIdx: selectedRowIdx };
                    end = start;
                }

                const [minColIdx, maxColIdx] = computeRangeChange(selectedColIdx, start.colIdx, end.colIdx, colDir);
                const [minRowIdx, maxRowIdx] = computeRangeChange(selectedRowIdx, start.rowIdx, end.rowIdx, rowDir);

                selectionCells = computeSelectionCellKeys(minColIdx, minRowIdx, maxColIdx, maxRowIdx);
                break;
            }
            case SELECTION_TYPES.SINGLE:
                selectionCells = [...editorModel.selectionCells];
                selectionCells.push(genCellKey(colIdx, rowIdx));
                break;
        }

        if (selectionCells.length > 0) {
            // if a cell was previously selected and there are remaining selectionCells then mark the previously
            // selected cell as in "selection"
            if (hasSelection) {
                selectionCells.push(genCellKey(editorModel.selectedColIdx, editorModel.selectedRowIdx));
            }
        }

        return { selectedColIdx, selectedRowIdx, selectionCells };
    };

    selectCell = (colIdx: number, rowIdx: number, selection?: SELECTION_TYPES, resetValue = false): void => {
        const { editorModel, onChange } = this.props;
        const { cellValues, focusValue, rowCount } = editorModel;

        if (colIdx < 0 || rowIdx < 0 || colIdx >= editorModel.columns.size) {
            // out of bounds, do nothing
            return;
        }

        // Issue 33855: select last row
        if (rowIdx === rowCount) {
            rowIdx = rowIdx - 1;
        }

        if (rowIdx < rowCount) {
            const changes: Partial<EditorModel> = {
                focusColIdx: -1,
                focusRowIdx: -1,
                ...this.applySelection(colIdx, rowIdx, selection),
            };

            if (resetValue) {
                changes.focusValue = undefined;
                changes.cellValues = cellValues.set(genCellKey(colIdx, rowIdx), focusValue);
            }

            onChange(EditableGridEvent.SELECT_CELL, changes);

            if (this.state.selectionPivot) {
                this.setState({ selectionPivot: undefined });
            }
        }
    };

    modifyCell = (colIdx: number, rowIdx: number, newValues: ValueDescriptor[], mod: MODIFICATION_TYPES): void => {
        const { editorModel, onChange } = this.props;
        const { cellMessages, cellValues } = editorModel;
        const cellKey = genCellKey(colIdx, rowIdx);
        const keyPath = ['cellValues', cellKey];
        const changes: Partial<EditorModel> = { cellMessages: cellMessages.delete(cellKey) };

        if (mod === MODIFICATION_TYPES.ADD) {
            const values: List<ValueDescriptor> = editorModel.getIn(keyPath);

            if (values !== undefined) {
                changes.cellValues = cellValues.set(cellKey, values.push(...newValues));
            } else {
                changes.cellValues = cellValues.set(cellKey, List(newValues));
            }
        } else if (mod === MODIFICATION_TYPES.REPLACE) {
            changes.cellValues = cellValues.set(cellKey, List(newValues));
        } else if (mod === MODIFICATION_TYPES.REMOVE) {
            let values: List<ValueDescriptor> = editorModel.getIn(keyPath);

            for (let v = 0; v < newValues.length; v++) {
                const idx = values.findIndex(vd => vd.display === newValues[v].display && vd.raw === newValues[v].raw);

                if (idx > -1) {
                    values = values.remove(idx);
                }
            }

            changes.cellValues = cellValues.set(cellKey, values);
        } else if (mod === MODIFICATION_TYPES.REMOVE_ALL) {
            if (editorModel.selectionCells.length > 0) {
                // Remove all values and messages for the selected cells
                changes.cellValues = editorModel.cellValues.reduce((result, value, key) => {
                    if (editorModel.selectionCells.find(_key => _key === key)) {
                        return result.set(key, List());
                    }
                    return result.set(key, value);
                }, Map<string, List<ValueDescriptor>>());
                changes.cellMessages = editorModel.cellMessages.reduce((result, value, key) => {
                    if (editorModel.selectionCells.find(_key => _key === key)) {
                        return result.remove(key);
                    }
                    return result.set(key, value);
                }, Map<string, CellMessage>());
            } else {
                changes.cellValues = cellValues.set(cellKey, List());
            }
        }

        onChange(EditableGridEvent.MODIFY_CELL, changes);
    };

    removeRows = (dataIdIndexes: Set<number>): void => {
        const { dataKeys, editorModel, onChange } = this.props;
        let deletedIds = Set<number>();
        const updatedKeys = this.props.dataKeys.filter((_, i) => !dataIdIndexes.has(i)).toList();
        const updatedData = this.props.data.reduce((result, value, key) => {
            if (updatedKeys.has(key)) {
                return result.set(key, value);
            }

            deletedIds = deletedIds.add(key);
            return result;
        }, Map<any, Map<string, any>>());
        const cellReducer = (result, value, cellKey) => {
            const [colIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));

            // If this value is part of a deleted row don't include it in the result.
            if (dataIdIndexes.has(oldRowIdx)) return result;

            const key = dataKeys.get(oldRowIdx);
            const newRowIdx = updatedKeys.indexOf(key);
            return result.set(genCellKey(colIdx, newRowIdx), value);
        };
        const cellMessages = editorModel.cellMessages.reduce(cellReducer, Map<string, CellMessage>());
        const cellValues = editorModel.cellValues.reduce(cellReducer, Map<string, ValueDescriptor>());
        const editorModelChanges = {
            deletedIds: editorModel.deletedIds.merge(deletedIds),
            focusColIdx: -1,
            focusRowIdx: -1,
            rowCount: editorModel.rowCount - dataIdIndexes.size,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: [],
            cellMessages,
            cellValues,
        };

        onChange(EditableGridEvent.REMOVE_ROWS, editorModelChanges, updatedKeys, updatedData);

        this.setState({
            selected: Set<number>(),
            selectedState: GRID_CHECKBOX_OPTIONS.NONE,
            selectionPivot: undefined,
        });
    };

    removeSelected = (): void => {
        const { metricFeatureArea } = this.props;
        this.removeRows(this.state.selected);
        if (metricFeatureArea) {
            incrementClientSideMetricCount(metricFeatureArea, 'removeRows');
        }
    };

    getLoweredColumnMetadata = (): Record<string, EditableColumnMetadata> =>
        this.props.columnMetadata?.reduce((result, value, key) => {
            result[key.toLowerCase()] = value;
            return result;
        }, {});

    generateColumns = (): List<GridColumn> => {
        const {
            allowBulkRemove,
            allowBulkUpdate,
            allowRemove,
            containerFilter,
            editorModel,
            forUpdate,
            hideCountCol,
            queryInfo,
            rowNumColumn,
            readonlyRows,
            lockedRows,
        } = this.props;

        let gridColumns = List<GridColumn>();

        if (allowBulkRemove || allowBulkUpdate) {
            const selColumn = new GridColumn({
                index: GRID_SELECTION_INDEX,
                title: '&nbsp;',
                cell: (selected: boolean, row) => (
                    <input
                        style={{ margin: '0 8px' }}
                        checked={this.state.selected.contains(row.get(GRID_EDIT_INDEX))}
                        type="checkbox"
                        onChange={this.select.bind(this, row)}
                    />
                ),
            });
            gridColumns = gridColumns.push(selColumn);
        }
        if (!hideCountCol) gridColumns = gridColumns.push(rowNumColumn ? rowNumColumn : COUNT_COL);

        const loweredColumnMetadata = this.getLoweredColumnMetadata();

        this.getColumns().forEach(qCol => {
            const metadata = loweredColumnMetadata[qCol.fieldKey.toLowerCase()];

            let width = 100;
            let fixedWidth;
            if (hasCellWidthOverride(metadata)) {
                fixedWidth = metadata.width;
                if (!fixedWidth) {
                    width = metadata.minWidth;
                }
            }

            gridColumns = gridColumns.push(
                new GridColumn({
                    align: qCol.align,
                    cell: inputCellFactory(
                        queryInfo,
                        editorModel,
                        allowBulkRemove || allowBulkUpdate,
                        hideCountCol,
                        metadata,
                        readonlyRows,
                        lockedRows,
                        this.cellActions,
                        metadata?.containerFilter ?? containerFilter,
                        forUpdate,
                        this.state.initialSelection
                    ),
                    index: qCol.fieldKey,
                    fixedWidth,
                    raw: qCol,
                    title: metadata?.caption ?? qCol.caption,
                    width,
                    hideTooltip: metadata?.hideTitleTooltip,
                    tableCell: true,
                })
            );
        });
        if (allowRemove) {
            gridColumns = gridColumns.push(
                new GridColumn({
                    index: GRID_EDIT_INDEX,
                    tableCell: true,
                    title: this.props.removeColumnTitle,
                    width: 45,
                    cell: (d, row: Map<string, any>, c, rn) => {
                        const keyCols = queryInfo.getPkCols();
                        const size = keyCols.length;
                        let canDelete = true;

                        if (size === 1) {
                            const key = caseInsensitive(row.toJS(), keyCols[0].fieldKey);
                            canDelete = !key || !this.props.notDeletable.contains(key);
                        } else {
                            console.warn(
                                `Preventing deletion for models with ${size} keys is not currently supported.`
                            );
                        }

                        return (
                            <td key={'delete' + rn}>
                                {canDelete && <DeleteIcon onDelete={() => this.removeRows(Set([rn]))} />}
                                {!canDelete && <>&nbsp;</>}
                            </td>
                        );
                    },
                })
            );
        }

        return gridColumns;
    };

    renderColumnHeader = (col: GridColumn, metadataKey: string, required?: boolean, format?: string): ReactNode => {
        const label = col.title;
        const loweredColumnMetadata = this.getLoweredColumnMetadata();
        const metadata = loweredColumnMetadata?.[metadataKey.toLowerCase()];
        const showOverlay = metadata?.toolTip || format;
        return (
            <>
                {label}
                {required && <span className="required-symbol"> *</span>}
                {showOverlay && (
                    <>
                        &nbsp;
                        <OverlayTrigger
                            placement="bottom"
                            overlay={
                                <Popover
                                    id={'popover-' + label}
                                    bsClass="popover"
                                    className={metadata?.popoverClassName}
                                >
                                    {metadata?.toolTip}
                                    {format && <div>Display Format: {format}</div>}
                                </Popover>
                            }
                        >
                            <i className="fa fa-question-circle" />
                        </OverlayTrigger>
                    </>
                )}
            </>
        );
    };

    headerCell = (col: GridColumn): ReactNode => {
        const { allowBulkRemove, allowBulkUpdate, queryInfo } = this.props;

        if ((allowBulkRemove || allowBulkUpdate) && col.index.toLowerCase() === GRID_SELECTION_INDEX) {
            return headerSelectionCell(this.selectAll, this.state.selectedState, false);
        }

        if (queryInfo.getColumn(col.index)) {
            const qColumn = queryInfo.getColumn(col.index);
            return this.renderColumnHeader(col, qColumn.fieldKey, qColumn.required, qColumn.format);
        }

        if (col && col.showHeader) {
            return this.renderColumnHeader(col, col.title, false);
        }

        return null;
    };

    hideMask = (): void => {
        clearTimeout(this.maskDelay);
        this.toggleMask(false);
    };

    handleDrag = (event: GridMouseEvent): boolean => {
        if (!this.props.editorModel.hasFocus) {
            event.preventDefault();
            return true;
        }

        return false;
    };

    beginDrag = (event: GridMouseEvent): void => {
        const { disabled, editorModel } = this.props;
        if (this.handleDrag(event) && !disabled) {
            clearTimeout(this.dragDelay);
            const target = event.target as Element;
            const isDragHandleAction = target.className?.indexOf(CELL_SELECTION_HANDLE_CLASSNAME) > -1;

            // NK: Here we slightly delay the drag event in case the user is just clicking on the cell
            // rather than performing a drag action. If they are simply clicking then the endDrag() will cancel
            // this update prior to the timeout.
            this.dragDelay = window.setTimeout(() => {
                this.dragDelay = undefined;
                const nextState: Partial<EditableGridState> = { inDrag: true };
                if (isDragHandleAction) {
                    const initialSelection = [...editorModel.selectionCells];
                    if (!initialSelection.length) initialSelection.push(editorModel.selectionKey);
                    nextState.initialSelection = initialSelection;
                }
                this.setState(nextState as EditableGridState);
                document.addEventListener('mouseup', this.onDocumentMouseUp);
            }, 150);
        }
    };

    inDrag = (): boolean => this.state.inDrag;

    endDrag = (event: GridMouseEvent): void => {
        if (this.handleDrag(event)) {
            if (this.dragDelay) {
                clearTimeout(this.dragDelay);
                this.dragDelay = undefined;
            } else {
                document.removeEventListener('mouseup', this.onDocumentMouseUp);
                this.setState({ inDrag: false });
            }
        }
    };

    onCopy = (event: ClipboardEvent): void => {
        const { disabled, editorModel } = this.props;
        if (!disabled) {
            copyEvent(editorModel, this.getColumns(), event);
        }
    };

    onCut = (event: ClipboardEvent): void => {
        const { disabled, editorModel } = this.props;

        if (!disabled && copyEvent(editorModel, this.getColumns(), event)) {
            this.modifyCell(
                editorModel.selectedColIdx,
                editorModel.selectedRowIdx,
                undefined,
                MODIFICATION_TYPES.REMOVE_ALL
            );
        }
    };

    onKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
        const { disabled, editorModel } = this.props;

        if (disabled || editorModel.hasFocus) {
            return;
        }

        const isMeta = isCtrlOrMetaKey(event);
        const isShift = event.shiftKey;
        const colIdx = editorModel.selectedColIdx;
        const rowIdx = editorModel.selectedRowIdx;
        let nextCol: number;
        let nextRow: number;

        switch (event.key) {
            case Key.ARROW_LEFT:
                if (isMeta) {
                    const found = editorModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveLeft);
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

            case Key.ARROW_UP:
                if (isMeta) {
                    const found = editorModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveUp);
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

            case Key.ARROW_RIGHT:
                if (isMeta) {
                    const found = editorModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveRight);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = editorModel.columns.size - 1;
                        nextRow = rowIdx;
                    }
                } else {
                    nextCol = colIdx + 1;
                    nextRow = rowIdx;
                }
                break;

            case Key.ARROW_DOWN:
                if (isMeta) {
                    const found = editorModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveDown);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = colIdx;
                        nextRow = editorModel.rowCount - 1;
                    }
                } else {
                    nextCol = colIdx;
                    nextRow = rowIdx + 1;
                }
                break;

            case Key.HOME:
                nextCol = 0;
                nextRow = rowIdx;
                break;

            case Key.END:
                nextCol = editorModel.columns.size - 1;
                nextRow = rowIdx;
                break;

            default:
                // Ignore all other keys
                break;
        }

        if (nextCol !== undefined && nextRow !== undefined) {
            cancelEvent(event);
            this.selectCell(nextCol, nextRow, isShift ? SELECTION_TYPES.AREA_CHANGE : undefined);
        }
    };

    _dragFill = async (initialSelection: string[]): Promise<void> => {
        const { editorModel, onChange, data, dataKeys, queryInfo, readonlyRows, lockedRows } = this.props;

        if (editorModel.isMultiSelect) {
            const loweredColumnMetadata = this.getLoweredColumnMetadata();
            const columns = this.getColumns();
            const columnMetadata = columns.map(col => loweredColumnMetadata[col.fieldKey.toLowerCase()]);
            const { cellMessages, cellValues } = await dragFillEvent(
                editorModel,
                initialSelection,
                dataKeys,
                data,
                queryInfo,
                columns,
                columnMetadata,
                readonlyRows,
                lockedRows
            );
            onChange(EditableGridEvent.DRAG_FILL, { cellMessages, cellValues });
            this.setState({ initialSelection: undefined });
        }
    };

    onMouseUp = (event: GridMouseEvent): void => {
        if (this.props.disabled) return;
        this.endDrag(event);
        const initialSelection = this.state.initialSelection;
        if (initialSelection?.length > 0) this._dragFill(initialSelection);
    };

    // Issue 49612: Handle ending drag action "mouse up" outside the editable grid
    onDocumentMouseUp = (event: MouseEvent): void => {
        this.onMouseUp(event);
    };

    fillDown = (): void => {
        const { disabled, editorModel } = this.props;
        const { isSparseSelection, selectionCells } = editorModel;

        if (disabled || isSparseSelection) return;

        const firstRowIdx = parseCellKey(selectionCells[0]).rowIdx;
        const firstRowCellKeys = selectionCells.filter(cellKey => parseCellKey(cellKey).rowIdx === firstRowIdx);
        this._dragFill(firstRowCellKeys);
    };

    onPaste = async (event: ClipboardEvent): Promise<void> => {
        const {
            allowAdd,
            columnMetadata,
            data,
            dataKeys,
            disabled,
            editorModel,
            onChange,
            queryInfo,
            readonlyRows,
            lockedRows,
        } = this.props;

        if (disabled) return;

        this.showMask();
        const changes = await pasteEvent(
            editorModel,
            dataKeys,
            data,
            queryInfo,
            this.getColumns(),
            event,
            columnMetadata,
            readonlyRows,
            lockedRows,
            !allowAdd
        );
        this.hideMask();

        onChange(EditableGridEvent.PASTE, changes.editorModel, changes.dataKeys, changes.data);
    };

    showMask = (): void => {
        clearTimeout(this.maskDelay);
        this.maskDelay = window.setTimeout(this.toggleMask.bind(this, true), 300);
    };

    toggleMask = (showMask: boolean): void => {
        this.setState({ showMask });
    };

    toggleBulkAdd = (): void => {
        this.setState(
            state => ({ showBulkAdd: !state.showBulkAdd }),
            // Issue 38420: Without this, the BulkUpdate button always retains focus after modal is shown
            blurActiveElement
        );
    };

    toggleBulkUpdate = (): void => {
        const { bulkUpdateProps } = this.props;
        if (bulkUpdateProps?.onClickBulkUpdate) {
            bulkUpdateProps
                .onClickBulkUpdate(this.state.selected)
                .then(canEdit => {
                    // the selected rows might not be updatable, for examples, all selected are readonly
                    if (!canEdit) return;

                    this.setState(
                        state => ({ showBulkUpdate: !state.showBulkUpdate }),
                        // Issue 38420: Without this, the BulkUpdate button always retains focus after modal is shown
                        blurActiveElement
                    );
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            this.setState(
                state => ({ showBulkUpdate: !state.showBulkUpdate }),
                // Issue 38420: Without this, the BulkUpdate button always retains focus after modal is shown
                blurActiveElement
            );
        }
    };

    getSelectedRowIndices = (): List<number> => {
        return this.state.selected.toList();
    };

    restoreBulkInsertData = (data: Map<string, any>): Map<string, any> => {
        const allInsertCols = OrderedMap<string, any>().asMutable();
        this.props.queryInfo
            .getInsertColumns(this.props.bulkAddProps.isIncludedColumn)
            .forEach(col => allInsertCols.set(col.name, undefined));
        return allInsertCols.merge(data).asImmutable();
    };

    bulkAdd = async (bulkData: OrderedMap<string, any>): Promise<void> => {
        const {
            addControlProps,
            bulkAddProps,
            editorModel,
            data,
            dataKeys,
            metricFeatureArea,
            onChange,
            processBulkData,
            queryInfo,
        } = this.props;
        const nounPlural = addControlProps?.nounPlural;
        // numItems is a string because we rely on Formsy to grab the value for us (See QueryInfoForm for details). We
        // need to parseInt the value because we add this variable to other numbers, if it's a string we'll add more
        // rows than we want because 1 + "1" is "11" in JavaScript.
        const numItems = parseInt(bulkData.get('numItems'), 10);
        let pivotKey;
        let pivotValues;

        if (!numItems) {
            return Promise.reject({ exception: 'Quantity unknown.  No ' + nounPlural + ' added.' });
        }

        if (processBulkData) {
            const processedData = processBulkData(bulkData);
            if (processedData.validationMsg) {
                return Promise.reject({ exception: processedData.validationMsg });
            }
            pivotKey = processedData.pivotKey;
            pivotValues = processedData.pivotValues;
        }

        bulkData = bulkData.delete('numItems').delete('creationType');

        if (bulkAddProps.columnFilter) {
            bulkData = this.restoreBulkInsertData(bulkData);
        }

        if (pivotKey && pivotValues?.length > 0) {
            const changes = await addRowsPerPivotValue(
                editorModel,
                dataKeys,
                data,
                List(queryInfo.getInsertColumns()),
                numItems,
                pivotKey,
                pivotValues,
                bulkData
            );
            onChange(EditableGridEvent.BULK_ADD, changes.editorModel, changes.dataKeys, changes.data);
        } else {
            const changes = await addRows(
                editorModel,
                dataKeys,
                data,
                List(queryInfo.getInsertColumns()),
                numItems,
                bulkData
            );
            onChange(EditableGridEvent.BULK_ADD, changes.editorModel, changes.dataKeys, changes.data);
        }

        if (metricFeatureArea) {
            incrementClientSideMetricCount(metricFeatureArea, 'bulkAdd');
        }

        // Result of this promise passed to toggleBulkAdd, which doesn't expect anything to be passed
        return Promise.resolve();
    };

    bulkUpdate = async (updatedData: OrderedMap<string, any>): Promise<Partial<EditorModelProps>> => {
        const { editorModel, queryInfo, onChange, bulkUpdateProps, metricFeatureArea } = this.props;
        if (!updatedData) return Promise.resolve(undefined);

        const selectedIndices = this.getSelectedRowIndices();
        const editorModelChanges = await updateGridFromBulkForm(
            editorModel,
            queryInfo,
            updatedData,
            selectedIndices,
            bulkUpdateProps?.excludeRowIdx,
            bulkUpdateProps?.isIncludedColumn
        );
        onChange(EditableGridEvent.BULK_UPDATE, editorModelChanges);

        if (metricFeatureArea) {
            incrementClientSideMetricCount(metricFeatureArea, 'bulkUpdate');
        }

        // The result of this promise is used by toggleBulkUpdate, which doesn't expect anything to be passed
        return Promise.resolve(editorModelChanges);
    };

    addRows = async (count: number): Promise<void> => {
        const { data, dataKeys, editorModel, onChange, queryInfo } = this.props;
        const changes = await addRows(editorModel, dataKeys, data, List(queryInfo.getInsertColumns()), count);
        onChange(EditableGridEvent.ADD_ROWS, changes.editorModel, changes.dataKeys, changes.data);
    };

    renderAddRowsControl = (placement: PlacementType): ReactNode => {
        const { addControlProps, editorModel, isSubmitting, maxRows } = this.props;
        let maxCount = addControlProps?.maxCount;

        if (maxRows && editorModel.rowCount + (addControlProps?.maxCount ?? 0) > maxRows) {
            maxCount = maxRows - editorModel.rowCount;
        }

        return (
            <AddRowsControl
                {...addControlProps}
                disable={isSubmitting || (maxRows && editorModel.rowCount >= maxRows)}
                maxCount={maxCount}
                maxTotalCount={maxRows}
                onAdd={this.addRows}
                placement={placement}
            />
        );
    };

    renderTopControls = (): ReactNode => {
        const {
            addControlProps,
            allowAdd,
            allowBulkAdd,
            allowBulkRemove,
            allowBulkUpdate,
            bulkAddText,
            bulkRemoveText,
            bulkUpdateText,
            data,
            isSubmitting,
            maxRows,
            editorModel,
            exportHandler,
            showAsTab,
        } = this.props;
        const nounPlural = addControlProps?.nounPlural ?? 'rows';
        const showAddOnTop = allowAdd && this.getControlsPlacement() !== 'bottom';
        const invalidSel = this.state.selected.size === 0;
        const canAddRows = !isSubmitting && data.size < maxRows;
        const addTitle = canAddRows
            ? 'Add multiple ' + nounPlural + ' with the same values'
            : 'The grid contains the maximum number of ' + nounPlural + '.';

        const allowExport = !!exportHandler;
        const actionButtonClassNames = classNames('editable-grid-buttons__action-buttons', {
            'col-sm-9': showAddOnTop,
            'col-sm-12': !showAddOnTop,
        });

        return (
            <div className="row editable-grid-buttons">
                {showAddOnTop && <div className="col-sm-3">{this.renderAddRowsControl('top')}</div>}
                <div className={actionButtonClassNames}>
                    {!showAsTab && allowBulkAdd && (
                        <button
                            className="bulk-add-button btn btn-default"
                            disabled={!canAddRows}
                            onClick={this.toggleBulkAdd}
                            title={addTitle}
                            type="button"
                        >
                            {bulkAddText}
                        </button>
                    )}
                    {!showAsTab && allowBulkUpdate && (
                        <button
                            className="bulk-update-button btn btn-default"
                            disabled={invalidSel}
                            onClick={this.toggleBulkUpdate}
                            type="button"
                        >
                            {bulkUpdateText}
                        </button>
                    )}
                    {allowBulkRemove && (
                        <button
                            className="bulk-remove-button btn btn-default"
                            disabled={invalidSel}
                            onClick={this.removeSelected}
                            type="button"
                        >
                            {bulkRemoveText}
                        </button>
                    )}
                    {allowExport && (
                        <span className="pull-right">
                            <EditableGridExportMenu id={editorModel.id} hasData exportHandler={exportHandler} />
                        </span>
                    )}
                </div>
            </div>
        );
    };

    renderBulkAdd = (): ReactNode => {
        const { addControlProps, allowFieldDisable, bulkAddProps, data, forUpdate, maxRows, queryInfo } = this.props;
        const maxToAdd =
            maxRows && maxRows - data.size < MAX_EDITABLE_GRID_ROWS ? maxRows - data.size : MAX_EDITABLE_GRID_ROWS;
        return (
            <QueryInfoForm
                allowFieldDisable={allowFieldDisable}
                onSubmitForEdit={this.bulkAdd}
                asModal
                checkRequiredFields={false}
                showLabelAsterisk
                submitForEditText={`Add ${capitalizeFirstChar(addControlProps?.nounPlural)} to Grid`}
                maxCount={maxToAdd}
                onHide={this.toggleBulkAdd}
                operation={forUpdate ? Operation.update : Operation.insert}
                onSuccess={this.toggleBulkAdd}
                queryInfo={queryInfo.getInsertQueryInfo()}
                header={
                    !!bulkAddProps?.header && <div className="editable-grid__bulk-header">{bulkAddProps.header}</div>
                }
                fieldValues={bulkAddProps?.fieldValues}
                columnFilter={bulkAddProps?.columnFilter}
                title={bulkAddProps?.title}
                countText={bulkAddProps?.countText}
                creationTypeOptions={bulkAddProps?.creationTypeOptions}
            />
        );
    };

    getControlsPlacement = (): PlacementType => {
        return this.props.addControlProps?.placement ?? 'bottom';
    };

    getGridData(): List<Map<string, any>> {
        const { data, dataKeys } = this.props;
        return dataKeys
            .map((key, index) => {
                const rowIndexData = { [GRID_EDIT_INDEX]: index };
                return data.get(key)?.merge(rowIndexData) ?? Map<string, any>(rowIndexData);
            })
            .toList();
    }

    onBulkUpdateFormDataChange = (pendingBulkFormData?: any): void => {
        const { showAsTab, bulkUpdateProps } = this.props;

        bulkUpdateProps?.onBulkUpdateFormDataChange?.(pendingBulkFormData);

        if (showAsTab) {
            this.setState({ pendingBulkFormData });
        }
    };

    applyPendingBulkFormData = (): void => {
        const { pendingBulkFormData } = this.state;
        this.bulkUpdate(pendingBulkFormData).then(() => {
            this.setState({
                pendingBulkFormData: undefined,
                activeEditTab: EditableGridTabs.Grid,
            });
        });
    };

    onTabChange = (newTabKey: string): void => {
        const { bulkUpdateProps } = this.props;
        const { activeEditTab } = this.state;

        if (newTabKey === EditableGridTabs.Grid && activeEditTab === EditableGridTabs.BulkUpdate) {
            this.applyPendingBulkFormData();
        } else if (newTabKey === EditableGridTabs.BulkUpdate && activeEditTab === EditableGridTabs.Grid) {
            if (bulkUpdateProps?.onClickBulkUpdate) {
                bulkUpdateProps
                    .onClickBulkUpdate(this.state.selected)
                    .then(canEdit => {
                        if (!canEdit) return;

                        this.setState({ activeEditTab: newTabKey });
                    })
                    .catch(error => {
                        console.error(error);
                    });
            } else {
                this.setState({ activeEditTab: newTabKey });
            }
        }
    };

    onSaveClick = (): void => {
        const { primaryBtnProps, editorModel, maxRows } = this.props;
        const { pendingBulkFormData } = this.state;

        if (editorModel.rowCount > maxRows) {
            // only bulk edit is supported
            primaryBtnProps?.onClick?.(pendingBulkFormData);
            this.setState({ pendingBulkFormData: undefined });
            return;
        }

        this.bulkUpdate(pendingBulkFormData).then(updates => {
            this.setState({ pendingBulkFormData: undefined });
            primaryBtnProps?.onClick?.(undefined, updates); // send back the updates in case caller uses useState to update EditorModel, which is async without cb
        });
    };

    renderButtons = (): ReactNode => {
        const { primaryBtnProps, tabAdditionalBtn, tabBtnProps } = this.props;
        if (!tabBtnProps?.show) return null;

        const btnClass = primaryBtnProps.cls ?? 'btn';
        return (
            <div className={tabBtnProps?.cls}>
                {tabAdditionalBtn}
                <button
                    className={`${btnClass} ${btnClass}-primary`}
                    disabled={primaryBtnProps.disabled}
                    onClick={this.onSaveClick}
                    type="button"
                >
                    {primaryBtnProps.caption ?? 'Save'}
                </button>
            </div>
        );
    };

    renderBulkUpdate = (): ReactNode => {
        const { addControlProps, bulkUpdateProps, data, dataKeys, editorModel, forUpdate, queryInfo, showAsTab } =
            this.props;
        const { pendingBulkFormData } = this.state;

        return (
            <>
                {bulkUpdateProps?.applyBulkUpdateBtnText && (
                    <button
                        className="btn btn-primary"
                        disabled={Utils.isEmptyObj(pendingBulkFormData?.toJS())}
                        onClick={this.applyPendingBulkFormData}
                        type="button"
                    >
                        {bulkUpdateProps.applyBulkUpdateBtnText}
                    </button>
                )}
                <BulkAddUpdateForm
                    asModal={!showAsTab}
                    data={data}
                    dataKeys={dataKeys}
                    editorModel={editorModel}
                    columnFilter={bulkUpdateProps?.columnFilter}
                    queryFilters={bulkUpdateProps?.queryFilters}
                    onFormChangeWithData={showAsTab ? this.onBulkUpdateFormDataChange : undefined}
                    onHide={this.toggleBulkUpdate}
                    operation={forUpdate ? Operation.update : Operation.insert}
                    onSubmitForEdit={this.bulkUpdate}
                    onSuccess={this.toggleBulkUpdate}
                    pluralNoun={addControlProps?.nounPlural}
                    queryInfo={queryInfo}
                    selectedRowIndexes={this.getSelectedRowIndices()}
                    singularNoun={addControlProps?.nounSingular}
                    warning={bulkUpdateProps?.warning}
                />
            </>
        );
    };

    render(): ReactNode {
        const {
            allowAdd,
            editorModel,
            error,
            bordered,
            condensed,
            emptyGridMsg,
            striped,
            allowBulkUpdate,
            showAsTab,
            tabBtnProps,
            maxRows,
            hideTopControls,
            tabContainerCls,
        } = this.props;
        const { showBulkAdd, showBulkUpdate, showMask, activeEditTab, selected } = this.state;

        const gridContent = (
            <>
                {!hideTopControls && this.renderTopControls()}
                <div
                    className={classNames(EDITABLE_GRID_CONTAINER_CLS, { 'loading-mask': showMask })}
                    onKeyDown={this.onKeyDown}
                    onMouseDown={this.beginDrag}
                    onMouseUp={this.onMouseUp}
                >
                    <Grid
                        bordered={bordered}
                        calcWidths
                        cellular
                        columns={this.generateColumns()}
                        condensed={condensed}
                        data={this.getGridData()}
                        emptyText={emptyGridMsg}
                        headerCell={this.headerCell}
                        responsive={false}
                        rowKey={GRID_EDIT_INDEX}
                        striped={striped}
                    />
                </div>
                {allowAdd && this.getControlsPlacement() !== 'top' && this.renderAddRowsControl('bottom')}
            </>
        );

        if (showAsTab) {
            const bulkDisabled = selected.size === 0;
            const showGrid = editorModel.rowCount <= maxRows;

            return (
                <>
                    {tabBtnProps?.placement === 'top' && this.renderButtons()}
                    <Tabs activeKey={activeEditTab} className={tabContainerCls} onSelect={this.onTabChange}>
                        {/* TODO: tabbed bulk add note yet supported */}
                        {allowBulkUpdate && (
                            <Tab
                                className="top-spacing"
                                disabled={bulkDisabled}
                                eventKey={EditableGridTabs.BulkUpdate}
                                title="Edit in Bulk"
                            >
                                <Alert>{error}</Alert>
                                {this.renderBulkUpdate()}
                            </Tab>
                        )}
                        {showGrid && (
                            <Tab className="top-spacing" eventKey={EditableGridTabs.Grid} title="Edit Individually">
                                <Alert>{error}</Alert>
                                {gridContent}
                            </Tab>
                        )}
                    </Tabs>
                    {tabBtnProps?.placement === 'bottom' && this.renderButtons()}
                </>
            );
        }

        return (
            <div>
                {tabBtnProps?.placement === 'top' && this.renderButtons()}
                {gridContent}
                {error && <Alert className="margin-top">{error}</Alert>}
                {tabBtnProps?.placement === 'bottom' && this.renderButtons()}
                {showBulkAdd && this.renderBulkAdd()}
                {showBulkUpdate && this.renderBulkUpdate()}
            </div>
        );
    }
}
