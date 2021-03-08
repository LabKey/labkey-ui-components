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
import React, { createRef, ReactNode, RefObject } from 'react';
import ReactN from 'reactn';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { List, Map, OrderedMap, Set } from 'immutable';
import $ from 'jquery';

import {
    addRows,
    addRowsPerPivotValue,
    beginDrag,
    clearSelection,
    copyEvent,
    endDrag,
    inDrag,
    pasteEvent,
    removeRow,
    removeRows,
    select,
    updateGridFromBulkForm,
} from '../../actions';
import { getQueryGridModel } from '../../global';

import { headerSelectionCell } from '../../renderers';
import { QueryInfoForm, QueryInfoFormProps } from '../forms/QueryInfoForm';
import { GRID_CHECKBOX_OPTIONS, GRID_EDIT_INDEX, GRID_SELECTION_INDEX, MAX_EDITABLE_GRID_ROWS } from '../../constants';
import {
    Alert,
    BulkAddUpdateForm,
    DeleteIcon,
    Grid,
    GridColumn,
    LoadingSpinner,
    QueryColumn,
    QueryGridModel,
} from '../../..';

import { blurActiveElement, capitalizeFirstChar, caseInsensitive } from '../../util/utils';

import { EditorModel, ValueDescriptor } from '../../models';

import { AddRowsControl, AddRowsControlProps, PlacementType } from './Controls';
import { Cell } from './Cell';

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

// the column index for cell values and cell messages does not include either the selection
// column or the row number column, so we adjust the value passed to <Cell> to accommodate.
function inputCellFactory(
    model: QueryGridModel,
    editorModel: EditorModel,
    allowSelection?: boolean,
    hideCountCol?: boolean,
    columnMetadata?: EditableColumnMetadata,
    readonlyRows?: List<any>,
    onCellModify?: () => any
) {
    return (value: any, row: any, c: GridColumn, rn: number, cn: number) => {
        let colOffset = 0;
        if (allowSelection) colOffset += 1;
        if (!hideCountCol) colOffset += 1;

        const colIdx = cn - colOffset;

        const isReadonlyCol = columnMetadata ? columnMetadata.readOnly : false;
        let isReadonlyRow = false;

        if (!isReadonlyCol && model && readonlyRows) {
            const keyCols = model.getKeyColumns();
            if (keyCols.size == 1) {
                const key = caseInsensitive(row.toJS(), keyCols.get(0).fieldKey);
                isReadonlyRow = key && readonlyRows.contains(key);
            } else {
                console.warn(
                    'Setting readonly rows for models with ' + keyCols.size + ' keys is not currently supported.'
                );
            }
        }

        return (
            <Cell
                col={c.raw}
                colIdx={colIdx}
                key={inputCellKey(c.raw, row)}
                modelId={model.getId()}
                placeholder={columnMetadata ? columnMetadata.placeholder : undefined}
                readOnly={isReadonlyCol || isReadonlyRow}
                rowIdx={rn}
                focused={editorModel ? editorModel.isFocused(colIdx, rn) : false}
                message={editorModel ? editorModel.getMessage(colIdx, rn) : undefined}
                selected={editorModel ? editorModel.isSelected(colIdx, rn) : false}
                selection={editorModel ? editorModel.inSelection(colIdx, rn) : false}
                values={editorModel ? editorModel.getValue(colIdx, rn) : List<ValueDescriptor>()}
                onCellModify={onCellModify}
                filteredLookupValues={columnMetadata ? columnMetadata.filteredLookupValues : undefined}
                filteredLookupKeys={columnMetadata ? columnMetadata.filteredLookupKeys : undefined}
            />
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

export interface EditableColumnMetadata {
    placeholder?: string;
    readOnly?: boolean;
    toolTip?: ReactNode;
    filteredLookupValues?: List<string>;
    filteredLookupKeys?: List<any>;
}

export interface BulkAddData {
    pivotKey?: string;
    pivotValues?: string[];
    totalItems?: number;
    validationMsg?: ReactNode;
}

export interface EditableGridProps {
    allowAdd?: boolean;
    allowBulkAdd?: boolean;
    allowBulkRemove?: boolean;
    allowBulkUpdate?: boolean;
    allowFieldDisable?: boolean;
    bordered?: boolean;
    onBulkAdd?: (data: OrderedMap<string, any>) => BulkAddData;
    bulkAddProps?: Partial<QueryInfoFormProps>;
    bulkUpdateProps?: Partial<QueryInfoFormProps>;
    condensed?: boolean;
    addControlProps?: Partial<AddRowsControlProps>;
    allowRemove?: boolean;
    bulkAddText?: string;
    bulkRemoveText?: string;
    bulkUpdateText?: string;
    columnMetadata?: Map<string, EditableColumnMetadata>;
    disabled?: boolean;
    forUpdate?: boolean;
    readOnlyColumns?: List<string>;
    removeColumnTitle?: string;
    notDeletable?: List<any>; // list of key values that cannot be deleted.
    readonlyRows?: List<any>; // list of key values for rows that are readonly.
    striped?: boolean;
    initialEmptyRowCount?: number;
    model: QueryGridModel;
    isSubmitting?: boolean;
    onRowCountChange?: (rowCount?: number) => any;
    emptyGridMsg?: string;
    maxTotalRows?: number;
    hideCountCol?: boolean;
    rowNumColumn?: GridColumn;
    onCellModify?: () => any;
    getInsertColumns?: () => List<QueryColumn>;
}

export interface EditableGridState {
    selected: Set<string>;
    selectedState: GRID_CHECKBOX_OPTIONS;
    showBulkAdd: boolean;
    showBulkUpdate: boolean;
}

export class EditableGrid extends ReactN.PureComponent<EditableGridProps, EditableGridState> {
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
        initialEmptyRowCount: 1,
        striped: false,
        maxTotalRows: MAX_EDITABLE_GRID_ROWS,
        hideCountCol: false,
        rowNumColumn: COUNT_COL,
    };

    private maskDelay: number;
    private readonly table: RefObject<any>;
    private readonly wrapper: RefObject<any>;

    constructor(props: EditableGridProps) {
        // @ts-ignore // see https://github.com/CharlesStover/reactn/issues/126
        super(props);

        this.table = createRef();
        this.wrapper = createRef();

        this.state = {
            selected: Set<string>(),
            selectedState: GRID_CHECKBOX_OPTIONS.NONE,
            showBulkAdd: false,
            showBulkUpdate: false,
        };
    }

    UNSAFE_componentWillMount(): void {
        this.initModel(this.props);
    }

    UNSAFE_componentWillReceiveProps(nextProps: EditableGridProps): void {
        this.initModel(nextProps);
    }

    initModel = (props: EditableGridProps): void => {
        const { initialEmptyRowCount } = props;
        const model = this.getModel(props);

        if (model.isLoaded && !model.isError && model.data.size === 0 && this.props.initialEmptyRowCount > 0) {
            addRows(model, initialEmptyRowCount);
            this.onRowCountChange();
        }
    };

    onRowCountChange = (): void => {
        const { onRowCountChange } = this.props;
        if (onRowCountChange) {
            onRowCountChange();
        }
        const editorModel = this.getEditorModel();
        if (editorModel.rowCount === 0 && this.props.initialEmptyRowCount > 0) {
            addRows(this.getModel(this.props), this.props.initialEmptyRowCount);
        }
    };

    componentDidMount() {
        document.addEventListener('click', this.onDocumentClick);
        document.addEventListener('copy', this.onCopy);
        document.addEventListener('paste', this.onPaste);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.onDocumentClick);
        document.removeEventListener('copy', this.onCopy);
        document.removeEventListener('paste', this.onPaste);
    }

    select = (row: Map<string, any>, evt): void => {
        const key = row.get(GRID_EDIT_INDEX);
        let selected = this.state.selected;
        if (evt.currentTarget.checked) {
            selected = selected.add(key);
        } else {
            selected = selected.remove(key);
        }
        let selectedState;
        if (selected.size === 0) selectedState = GRID_CHECKBOX_OPTIONS.NONE;
        else if (this.getModel(this.props).dataIds.size === selected.size) selectedState = GRID_CHECKBOX_OPTIONS.ALL;
        else selectedState = GRID_CHECKBOX_OPTIONS.SOME;
        this.setState(() => {
            return {
                selected,
                selectedState,
            };
        });
    };

    selectAll = (evt): void => {
        const model = this.getModel(this.props);
        if (model) {
            const selected =
                evt.currentTarget.checked === true && this.state.selectedState !== GRID_CHECKBOX_OPTIONS.ALL;
            this.setState(() => {
                return {
                    selected: selected ? Set<string>(model.dataIds.toArray()) : Set<string>(),
                    selectedState: selected ? GRID_CHECKBOX_OPTIONS.ALL : GRID_CHECKBOX_OPTIONS.NONE,
                };
            });
        }
    };

    getColumns = (): List<QueryColumn> => {
        const model = this.getModel(this.props);
        if (this.props.forUpdate) {
            return model.getUpdateColumns(this.props.readOnlyColumns);
        } else {
            if (this.props.getInsertColumns) return this.props.getInsertColumns();
            return model.getInsertColumns();
        }
    };

    generateColumns = (): List<GridColumn> => {
        const {
            allowBulkRemove,
            allowBulkUpdate,
            allowRemove,
            columnMetadata,
            hideCountCol,
            rowNumColumn,
            readonlyRows,
            onCellModify,
        } = this.props;
        const model = this.getModel(this.props);
        const editorModel = this.getEditorModel();
        let gridColumns = List<GridColumn>();

        if (allowBulkRemove || allowBulkUpdate) {
            const selColumn = new GridColumn({
                index: GRID_SELECTION_INDEX,
                title: '&nbsp;',
                cell: (selected: boolean, row) => {
                    return (
                        <input
                            style={{ margin: '0 8px' }}
                            checked={this.state.selected.contains(row.get(GRID_EDIT_INDEX))}
                            type="checkbox"
                            onChange={this.select.bind(this, row)}
                        />
                    );
                },
            });
            gridColumns = gridColumns.push(selColumn);
        }
        if (!hideCountCol) gridColumns = gridColumns.push(rowNumColumn ? rowNumColumn : COUNT_COL);

        this.getColumns().forEach(qCol => {
            gridColumns = gridColumns.push(
                new GridColumn({
                    align: qCol.align,
                    cell: inputCellFactory(
                        model,
                        editorModel,
                        allowBulkRemove || allowBulkUpdate,
                        hideCountCol,
                        columnMetadata.get(qCol.fieldKey),
                        readonlyRows,
                        onCellModify
                    ),
                    index: qCol.fieldKey,
                    raw: qCol,
                    title: qCol.caption,
                    width: 100,
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
                        const keyCols = model.getKeyColumns();
                        let canDelete = true;
                        if (keyCols.size == 1) {
                            const key = caseInsensitive(row.toJS(), keyCols.get(0).fieldKey);
                            canDelete = !key || !this.props.notDeletable.contains(key);
                        } else {
                            console.warn(
                                'Preventing deletion for models with ' +
                                    keyCols.size +
                                    ' keys is not currently supported.'
                            );
                        }

                        return canDelete ? (
                            <td key={'delete' + rn}>
                                <DeleteIcon
                                    onDelete={event => {
                                        removeRow(model, d, rn);
                                        this.onRowCountChange();
                                    }}
                                />
                            </td>
                        ) : (
                            <td key={'delete' + rn}>&nbsp;</td>
                        );
                    },
                })
            );
        }

        return gridColumns;
    };

    renderColumnHeader = (col: GridColumn, metadataKey: string, required?: boolean): ReactNode => {
        const label = col.title;
        const metadata =
            this.props.columnMetadata && this.props.columnMetadata.has(metadataKey)
                ? this.props.columnMetadata.get(metadataKey)
                : undefined;
        const overlay =
            metadata && metadata.toolTip ? (
                <OverlayTrigger
                    placement="bottom"
                    overlay={
                        <Popover id={'popover-' + label} bsClass="popover">
                            {metadata.toolTip}
                        </Popover>
                    }
                >
                    <i className="fa fa-question-circle" />
                </OverlayTrigger>
            ) : undefined;
        return (
            <>
                {label}
                {required && <span className="required-symbol"> *</span>}
                {overlay && (
                    <>
                        &nbsp;
                        {overlay}
                    </>
                )}
            </>
        );
    };

    headerCell = (col: GridColumn): ReactNode => {
        const model = this.getModel(this.props);
        if (
            (this.props.allowBulkRemove || this.props.allowBulkUpdate) &&
            col.index.toLowerCase() == GRID_SELECTION_INDEX
        ) {
            return headerSelectionCell(this.selectAll, this.state.selectedState, false);
        }
        if (model.queryInfo && model.queryInfo.getColumn(col.index)) {
            const qColumn = model.queryInfo.getColumn(col.index);
            return this.renderColumnHeader(col, qColumn.fieldKey, qColumn.required);
        }
        if (col && col.showHeader) {
            return this.renderColumnHeader(col, col.title, false);
        }
    };

    hideMask = (): void => {
        clearTimeout(this.maskDelay);
        this.toggleMask(false);
    };

    onDocumentClick = (event: any): void => {
        const { disabled } = this.props;
        const model = this.getModel(this.props);

        if (
            !disabled &&
            this.table &&
            this.table.current &&
            !$.contains(this.table.current, event.target) &&
            !$(event.target).parent('.cell-lookup') &&
            !inDrag(model.getId())
        ) {
            clearSelection(model.getId());
        }
    };

    onCopy = (event: any): void => {
        if (!this.props.disabled) {
            copyEvent(this.props.model.getId(), event);
        }
    };

    onKeyDown = (event: any): void => {
        if (!this.props.disabled) {
            select(this.props.model.getId(), event);
        }
    };

    onMouseDown = (event: any): void => {
        if (!this.props.disabled) {
            beginDrag(this.props.model.getId(), event);
        }
    };

    onMouseUp = (event: any): void => {
        if (!this.props.disabled) {
            endDrag(this.props.model.getId(), event);
        }
    };

    onPaste = (event: any): void => {
        if (!this.props.disabled) {
            const modelId = this.props.model.getId();
            const beforeRowCount = this.getEditorModel().rowCount;
            pasteEvent(
                modelId,
                event,
                this.showMask,
                this.hideMask,
                this.props.columnMetadata,
                this.props.readonlyRows,
                !this.props.allowAdd
            );
            const afterRowCount = this.getEditorModel().rowCount;
            if (beforeRowCount !== afterRowCount) {
                this.onRowCountChange();
            }
            if (this.props.onCellModify) this.props.onCellModify();
        }
    };

    showMask = (): void => {
        clearTimeout(this.maskDelay);
        this.maskDelay = window.setTimeout(this.toggleMask.bind(this, true), 300);
    };

    toggleMask = (show: boolean): void => {
        if (this.wrapper && this.wrapper.current) {
            $(this.wrapper.current).toggleClass('loading-mask', show === true);
        }
    };

    onAddRows = (count: number): void => {
        const model = this.getModel(this.props);
        const editorModel = this.getEditorModel();
        let toAdd = count;
        if (this.props.maxTotalRows && count + editorModel.rowCount > this.props.maxTotalRows) {
            toAdd = this.props.maxTotalRows - editorModel.rowCount;
        }
        addRows(model, toAdd);
        this.onRowCountChange();
    };

    toggleBulkAdd = (): void => {
        this.setState(
            state => ({ showBulkAdd: !state.showBulkAdd }),
            // Issue 38420: Without this, the BulkUpdate button always retains focus after modal is shown
            blurActiveElement
        );
    };

    toggleBulkUpdate = () => {
        this.setState(
            state => ({ showBulkUpdate: !state.showBulkUpdate }),
            // Issue 38420: Without this, the BulkUpdate button always retains focus after modal is shown
            blurActiveElement
        );
    };

    renderError = (): ReactNode => {
        const model = this.getModel(this.props);
        if (model.isError) {
            return <Alert className="margin-top">{model.message ? model.message : 'Something went wrong.'}</Alert>;
        }
    };

    getModel(props: EditableGridProps): QueryGridModel {
        const { model } = props;
        return getQueryGridModel(model.getId());
    }

    getEditorModel = (): EditorModel => {
        const modelId = this.props.model.getId();
        return this.global.QueryGrid_editors.get(modelId);
    };

    getSelectedRowIndexes = (): List<number> => {
        const model = this.getModel(this.props);
        const { selected } = this.state;

        return model.data.reduce((indexes, dataMap, key) => {
            if (selected.has(key)) {
                return indexes.push(model.dataIds.indexOf(key));
            }
            return indexes;
        }, List<number>());
    };

    removeSelectedRows = (): void => {
        removeRows(this.getModel(this.props), this.getSelectedRowIndexes());
        this.setState(() => ({
            selected: Set<string>(),
            selectedState: GRID_CHECKBOX_OPTIONS.NONE,
        }));
        this.onRowCountChange();
    };

    getAddControlProps = (): Partial<AddRowsControlProps> => {
        const { addControlProps, maxTotalRows } = this.props;
        const editorModel = this.getEditorModel();
        if (maxTotalRows && editorModel.rowCount + addControlProps.maxCount > maxTotalRows) {
            return { ...addControlProps, maxTotalCount: maxTotalRows, maxCount: maxTotalRows - editorModel.rowCount };
        } else {
            return { ...addControlProps, maxTotalCount: maxTotalRows };
        }
    };

    renderAddRowsControl = (placement: PlacementType): ReactNode => {
        const { isSubmitting } = this.props;
        return (
            <AddRowsControl
                {...this.getAddControlProps()}
                placement={placement}
                disable={
                    isSubmitting ||
                    (this.props.maxTotalRows && this.getEditorModel().rowCount >= this.props.maxTotalRows)
                }
                onAdd={this.onAddRows}
            />
        );
    };

    renderTopControls = (): ReactNode => {
        const {
            allowAdd,
            allowBulkAdd,
            allowBulkRemove,
            allowBulkUpdate,
            bulkAddText,
            bulkRemoveText,
            bulkUpdateText,
            initialEmptyRowCount,
            isSubmitting,
            addControlProps,
        } = this.props;
        const nounPlural = addControlProps ? addControlProps.nounPlural : 'rows';
        const editorModel = this.getEditorModel();
        const showAddOnTop = allowAdd && this.getControlsPlacement() !== 'bottom';
        const noValidSelection =
            this.state.selected.size === 0 ||
            (initialEmptyRowCount === 1 && editorModel.rowCount === 1 && !editorModel.hasData());
        const model = this.getModel(this.props);
        const canAddRows = !isSubmitting && model.data && model.data.size < this.props.maxTotalRows;

        const removeBtn = (
            <Button className="control-right" disabled={noValidSelection} onClick={this.removeSelectedRows}>
                {bulkRemoveText}
            </Button>
        );

        const addBtn = (
            <Button
                title={
                    canAddRows
                        ? 'Add multiple ' + nounPlural + ' with the same values'
                        : 'The grid contains the maximum number of ' + nounPlural + '.'
                }
                disabled={!canAddRows}
                onClick={this.toggleBulkAdd}
            >
                {bulkAddText}
            </Button>
        );

        const updateBtn = (
            <Button className="control-right" disabled={noValidSelection} onClick={this.toggleBulkUpdate}>
                {bulkUpdateText}
            </Button>
        );

        return (
            <div className="row QueryGrid-bottom-spacing">
                {showAddOnTop && <div className="col-sm-3">{this.renderAddRowsControl('top')}</div>}
                <div className={showAddOnTop ? 'col-sm-9' : 'col-sm-12'}>
                    {allowBulkAdd && <span className="control-right">{addBtn}</span>}
                    {allowBulkUpdate && <span className="control-right">{updateBtn}</span>}
                    {allowBulkRemove && <span className="control-right">{removeBtn}</span>}
                </div>
            </div>
        );
    };

    renderBulkCreationHeader(): ReactNode {
        const { bulkAddProps } = this.props;

        if (bulkAddProps && bulkAddProps.header) {
            return <div className="editable-grid__bulk-header">{bulkAddProps.header}</div>;
        }
    }

    restoreBulkInsertData(model: QueryGridModel, data: Map<string, any>): Map<string, any> {
        const allInsertCols = OrderedMap<string, any>().asMutable();
        model.getInsertColumns().forEach(col => allInsertCols.set(col.name, undefined));
        return allInsertCols.merge(data).asImmutable();
    }

    bulkAdd = (data: OrderedMap<string, any>): Promise<any> => {
        const { addControlProps, bulkAddProps, onBulkAdd } = this.props;
        const { nounSingular, nounPlural } = addControlProps;
        const model = this.getModel(this.props);

        const numItems = data.get('numItems');

        if (!numItems) {
            return new Promise((resolve, reject) => {
                reject({
                    exception: 'Quantity unknown.  No ' + nounPlural + ' added.',
                });
            });
        }

        let bulkAddData;
        let totalItems = 0;
        if (onBulkAdd) {
            bulkAddData = onBulkAdd(data);
            if (bulkAddData.validationMsg) {
                return new Promise((resolve, reject) => {
                    reject({
                        exception: bulkAddData.validationMsg,
                    });
                });
            }
            totalItems = bulkAddData.totalItems;
        }

        let updatedData = data.delete('numItems').delete('creationType');

        if (totalItems === 0) totalItems = numItems;

        if (bulkAddProps.columnFilter) {
            updatedData = this.restoreBulkInsertData(model, updatedData);
        }
        if (bulkAddData?.pivotKey && bulkAddData?.pivotValues?.length > 0) {
            addRowsPerPivotValue(model, numItems, bulkAddData?.pivotKey, bulkAddData?.pivotValues, updatedData);
        } else {
            addRows(model, numItems, updatedData);
        }
        this.onRowCountChange();
        return new Promise(resolve => {
            resolve({
                success: true,
                message: 'Added ' + totalItems + ' ' + (totalItems > 1 ? nounPlural : nounSingular),
            });
        });
    };

    renderBulkAdd = (): ReactNode => {
        const { showBulkAdd } = this.state;
        const { bulkAddProps } = this.props;
        const model = this.getModel(this.props);
        const maxToAdd =
            this.props.maxTotalRows && this.props.maxTotalRows - model.data.size < MAX_EDITABLE_GRID_ROWS
                ? this.props.maxTotalRows - model.data.size
                : MAX_EDITABLE_GRID_ROWS;
        return (
            showBulkAdd && (
                <QueryInfoForm
                    allowFieldDisable={this.props.allowFieldDisable}
                    onSubmitForEdit={this.bulkAdd}
                    asModal={true}
                    checkRequiredFields={false}
                    showLabelAsterisk={true}
                    submitForEditText={`Add ${capitalizeFirstChar(this.props.addControlProps.nounPlural)} to Grid`}
                    maxCount={maxToAdd}
                    onHide={this.toggleBulkAdd}
                    onCancel={this.toggleBulkAdd}
                    onSuccess={this.toggleBulkAdd}
                    queryInfo={model.queryInfo}
                    schemaQuery={model.queryInfo.schemaQuery}
                    header={this.renderBulkCreationHeader()}
                    fieldValues={bulkAddProps?.fieldValues}
                    columnFilter={bulkAddProps?.columnFilter}
                    title={bulkAddProps?.title}
                    countText={bulkAddProps?.countText}
                    creationTypeOptions={bulkAddProps?.creationTypeOptions}
                />
            )
        );
    };

    renderBulkUpdate = (): ReactNode => {
        const { showBulkUpdate } = this.state;
        const model = this.getModel(this.props);

        return (
            showBulkUpdate && (
                <BulkAddUpdateForm
                    selectedRowIndexes={this.getSelectedRowIndexes()}
                    singularNoun={this.props.addControlProps.nounSingular}
                    pluralNoun={this.props.addControlProps.nounPlural}
                    model={model}
                    columnFilter={this.props.bulkUpdateProps ? this.props.bulkUpdateProps.columnFilter : null}
                    onCancel={this.toggleBulkUpdate}
                    onComplete={this.toggleBulkUpdate}
                    onSubmitForEdit={this.editSelectionInGrid}
                />
            )
        );
    };

    editSelectionInGrid = (updatedData: OrderedMap<string, any>): Promise<any> => {
        const model = this.getModel(this.props);

        return new Promise(resolve => {
            const updatedGrid = updateGridFromBulkForm(model, updatedData, this.getSelectedRowIndexes());
            resolve({
                success: true,
                updatedGrid,
            });
        });
    };

    getControlsPlacement = (): PlacementType => {
        const { addControlProps } = this.props;

        if (!addControlProps || !addControlProps.placement) {
            return 'bottom';
        }
        return addControlProps.placement;
    };

    render() {
        const { allowAdd, bordered, condensed, emptyGridMsg, striped } = this.props;
        const model = this.getModel(this.props);

        if (!model || !model.isLoaded) {
            return <LoadingSpinner />;
        } else if (model.isLoaded) {
            return (
                <div>
                    {this.renderTopControls()}
                    <div
                        className="editable-grid__container"
                        onKeyDown={this.onKeyDown}
                        onMouseDown={this.onMouseDown}
                        onMouseUp={this.onMouseUp}
                        ref={this.wrapper}
                    >
                        <Grid
                            bordered={bordered}
                            calcWidths={true}
                            cellular={true}
                            columns={this.generateColumns()}
                            condensed={condensed}
                            data={model.getDataEdit()}
                            emptyText={emptyGridMsg}
                            headerCell={this.headerCell}
                            responsive={false}
                            rowKey={GRID_EDIT_INDEX}
                            striped={striped}
                            tableRef={this.table}
                        />
                    </div>
                    {allowAdd && this.getControlsPlacement() != 'top' && this.renderAddRowsControl('bottom')}
                    {this.renderError()}
                    {this.renderBulkAdd()}
                    {this.renderBulkUpdate()}
                </div>
            );
        }

        return null;
    }
}
