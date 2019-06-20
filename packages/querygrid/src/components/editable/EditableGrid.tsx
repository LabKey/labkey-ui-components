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
import * as OrigReact from 'react'
import { ReactNode } from 'react'
import React from 'reactn'
import { Button, Dropdown, MenuItem } from 'react-bootstrap'
import { List, Map, Set } from 'immutable'
import $ from 'jquery'
import {
    Alert,
    Grid,
    GRID_CHECKBOX_OPTIONS,
    GRID_EDIT_INDEX,
    GRID_SELECTION_INDEX,
    GridColumn,
    LoadingSpinner,
    QueryColumn,
    QueryGridModel,
    capitalizeFirstChar
} from '@glass/base'

import {
    addRows,
    beginDrag,
    clearSelection,
    copyEvent,
    endDrag,
    inDrag,
    pasteEvent,
    removeRow,
    removeRows,
    select
} from '../../actions'
import { getEditorModel, getQueryGridModel } from "../../global";
import { Cell } from './Cell'
import { AddRowsControl, AddRowsControlProps, RightClickToggle } from './Controls'
import { headerSelectionCell } from "../../renderers";
import { QueryInfoForm, QueryInfoFormProps } from "../forms/QueryInfoForm";
import { MAX_ADDED_EDITABLE_GRID_ROWS } from "../../constants";

const COUNT_COL = new GridColumn({
    index: GRID_EDIT_INDEX,
    showHeader: false,
    tableCell: true,
    title: '',
    width: 45,
    // style cast to "any" type due to @types/react@16.3.14 switch to csstype package usage which does not declare
    // "textAlign" property correctly for <td> elements.
    cell: (d,r,c,rn) => (
        <td className="cellular-count" key={c.index} style={{textAlign: c.align || 'left'} as any}>
            <div className="cellular-count-content">{rn+1}</div>
        </td>
    )
});

// the column index for cell values and cell messages does not include either the selection
// column or the row number column, so we adjust the value passed to <Cell> to accommodate.
function inputCellFactory(modelId: string, allowSelection?: boolean, columnMetadata?: EditableColumnMetadata) {
    return (value: any, row: any, c: GridColumn, rn: number, cn: number) => (
        <Cell
            col={c.raw}
            colIdx={cn-(allowSelection ? 2 : 1)}
            key={inputCellKey(c.raw, row)}
            modelId={modelId}
            placeholder={columnMetadata ? columnMetadata.placeholder: undefined}
            readOnly={ columnMetadata ? columnMetadata.readOnly : false}
            row={row}
            rowIdx={rn}/>
    );
}

function inputCellKey(col: QueryColumn, row: any): string {
    const indexKey = row.get(GRID_EDIT_INDEX);

    if (indexKey === undefined || indexKey === null) {
        throw new Error(`QueryFormInputs.encodeName: Unable to encode name for field "${col.fieldKey}".`);
    }

    return [col.fieldKey, indexKey].join('_$Cell$_');
}

export interface EditableColumnMetadata {
    placeholder?: string,
    readOnly?: boolean
}

export interface EditableGridProps {
    allowAdd?: boolean
    allowBulkUpdate?: boolean
    allowBulkRemove?: boolean
    allowFieldDisable?: boolean
    bordered?: boolean
    bulkUpdateProps?: Partial<QueryInfoFormProps>
    condensed?: boolean
    addControlProps?: Partial<AddRowsControlProps>
    allowRemove?: boolean
    bulkUpdateText?: string
    columnMetadata?: Map<string, EditableColumnMetadata>
    disabled?: boolean
    forUpdate?: boolean
    readOnlyColumns?: List<string>
    striped?: boolean
    initialEmptyRowCount?: number
    model: QueryGridModel
    isSubmitting?: boolean
    onRowCountChange?: (rowCount?: number) => any
}

export interface EditableGridState {
    selected: Set<string>
    selectedState: GRID_CHECKBOX_OPTIONS
    showBulkUpdate: boolean
}

export class EditableGrid extends React.Component<EditableGridProps, EditableGridState> {

    static defaultProps = {
        allowAdd: true,
        allowBulkUpdate: false,
        allowBulkRemove: false,
        allowRemove: true,
        addControlProps: {
            nounPlural: "Rows",
            nounSingular: "Row"
        },
        bordered: false,
        bulkUpdateText: "Bulk Update",
        columnMetadata: Map<string, EditableColumnMetadata>(),
        condensed: false,
        disabled: false,
        isSubmitting: false,
        initialEmptyRowCount: 1,
        striped: false
    };

    private maskDelay: number;
    private readonly table: React.RefObject<any>;
    private readonly wrapper: React.RefObject<any>;

    constructor(props: EditableGridProps) {
        super(props);

        this.onAddRows = this.onAddRows.bind(this);
        this.toggleBulkUpdate = this.toggleBulkUpdate.bind(this);
        this.generateColumns = this.generateColumns.bind(this);
        this.headerCell = this.headerCell.bind(this);
        this.hideMask = this.hideMask.bind(this);
        this.onDocumentClick = this.onDocumentClick.bind(this);
        this.onCopy = this.onCopy.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onPaste = this.onPaste.bind(this);
        this.showMask = this.showMask.bind(this);
        this.toggleMask = this.toggleMask.bind(this);
        this.select = this.select.bind(this);
        this.selectAll = this.selectAll.bind(this);
        this.bulkAdd = this.bulkAdd.bind(this);
        this.removeSelectedRows = this.removeSelectedRows.bind(this);
        this.onRowCountChange = this.onRowCountChange.bind(this);

        this.table = OrigReact.createRef();
        this.wrapper = OrigReact.createRef();

        this.state = {
            selected: Set<string>(),
            selectedState: GRID_CHECKBOX_OPTIONS.NONE,
            showBulkUpdate: false
        }
    }

    componentWillMount() {
        this.initModel(this.props);
    }

    componentWillReceiveProps(nextProps: EditableGridProps) {
        this.initModel(nextProps);
    }

    initModel(props: EditableGridProps) {
        const { initialEmptyRowCount } = props;
        const model = this.getModel(props);

        if (model.isLoaded && !model.isError && model.data.size === 0) {
            addRows(model, initialEmptyRowCount);
            this.onRowCountChange();
        }
    }

    onRowCountChange() {
        const { onRowCountChange } = this.props;
        if (onRowCountChange) {
            onRowCountChange();
        }
        const editorModel = this.getEditorModel();
        if (editorModel.rowCount === 0) {
            addRows(this.getModel(this.props), this.props.initialEmptyRowCount);
        }
    }

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

    select(row: Map<string, any>, evt) {
        const key = row.get(GRID_EDIT_INDEX);
        let selected = this.state.selected;
        if (evt.currentTarget.checked) {
            selected = selected.add(key);
        }
        else {
            selected = selected.remove(key);
        }
        let selectedState;
        if (selected.size === 0)
            selectedState = GRID_CHECKBOX_OPTIONS.NONE;
        else if (this.getModel(this.props).dataIds.size === selected.size)
            selectedState = GRID_CHECKBOX_OPTIONS.ALL;
        else
            selectedState = GRID_CHECKBOX_OPTIONS.SOME;
        this.setState(() => {
            return {
                selected,
                selectedState
            };
        });
    }

    selectAll(evt) {
        const model = this.getModel(this.props);
        if (model) {
            const selected = evt.currentTarget.checked === true && this.state.selectedState !== GRID_CHECKBOX_OPTIONS.ALL;
            this.setState(() => {
                return {
                    selected: selected ? Set<string>(model.dataIds.toArray()) : Set<string>(),
                    selectedState: selected ? GRID_CHECKBOX_OPTIONS.ALL : GRID_CHECKBOX_OPTIONS.NONE
                };
            })
        }
    }

    getColumns() : List<QueryColumn> {
        const model = this.getModel(this.props);
        if (this.props.forUpdate) {
            return model.getUpdateColumns(this.props.readOnlyColumns);
        }
        else {
            return model.getInsertColumns();
        }
    }

    generateColumns(): List<GridColumn> {
        const { allowBulkRemove, allowRemove, columnMetadata } = this.props;
        const model = this.getModel(this.props);
        let gridColumns = List<GridColumn>();

        if (allowBulkRemove) {
            const selColumn = new GridColumn({
                index: GRID_SELECTION_INDEX,
                title: '&nbsp;',
                cell: (selected: boolean, row) => {
                    return <input
                        style={{margin: "0 8px"}}
                        checked={this.state.selected.contains(row.get(GRID_EDIT_INDEX))}
                        type="checkbox"
                        onChange={this.select.bind(this, row)}/>;
                }
            });
            gridColumns = gridColumns.push(selColumn);
        }
        gridColumns = gridColumns.push(
            allowBulkRemove || allowRemove ? new GridColumn({
                index: GRID_EDIT_INDEX,
                tableCell: true,
                title: 'Row',
                width: 45,
                cell: (d,r,c,rn) => (
                    <Dropdown key={c.index} id={`row-context-${rn}`} className="cellular-count" componentClass="td">
                        <RightClickToggle bsRole="toggle">
                            {rn+1}
                        </RightClickToggle>
                        <Dropdown.Menu>
                            <MenuItem onSelect={() => {
                                removeRow(model, d, rn);
                                this.onRowCountChange();
                            }}>Delete Row</MenuItem>
                        </Dropdown.Menu>
                    </Dropdown>
                )
            }) : COUNT_COL
        );

        this.getColumns().forEach(qCol => {
            gridColumns = gridColumns.push(new GridColumn({
                align: qCol.align,
                cell: inputCellFactory(model.getId(), allowBulkRemove, columnMetadata.get(qCol.fieldKey)),
                index: qCol.fieldKey,
                raw: qCol,
                title: qCol.caption,
                width: 100
            }));
        });

        return gridColumns;
    }

    headerCell(col: GridColumn) {
        const model = this.getModel(this.props);
        if (this.props.allowBulkRemove && col.index.toLowerCase() == GRID_SELECTION_INDEX) {
            return headerSelectionCell(this.selectAll, this.state.selectedState, false);
        }
        if (model.queryInfo && model.queryInfo.getColumn(col.index)) {
            const qColumn = model.queryInfo.getColumn(col.index);
            return [col.title, (qColumn.required ? '*': undefined)].join(' ');
        }
        if (col && col.showHeader) {
            return col.title;
        }
    }

    hideMask() {
        clearTimeout(this.maskDelay);
        this.toggleMask(false);
    }

    onDocumentClick(event: any) {
        const { disabled } = this.props;
        const model = this.getModel(this.props);

        if (!disabled && this.table && this.table.current &&
            (!$.contains(this.table.current, event.target) && !$(event.target).parent('.cell-lookup')) &&
            !inDrag(model.getId())) {
            clearSelection(model.getId());
        }
    }

    onCopy(event: any) {
        if (!this.props.disabled) {
            copyEvent(this.props.model.getId(), event);
        }
    }

    onKeyDown(event: any) {
        if (!this.props.disabled) {
            select(this.props.model.getId(), event);
        }
    }

    onMouseDown(event: any) {
        if (!this.props.disabled) {
            beginDrag(this.props.model.getId(), event);
        }
    }

    onMouseUp(event: any) {
        if (!this.props.disabled) {
            endDrag(this.props.model.getId(), event);
        }
    }

    onPaste(event: any) {
        if (!this.props.disabled) {
            const modelId = this.props.model.getId();
            const beforeRowCount = getEditorModel(modelId).rowCount;
            pasteEvent(modelId, event, this.showMask, this.hideMask, this.props.columnMetadata);
            const afterRowCount =  getEditorModel(modelId).rowCount;
            if (beforeRowCount !== afterRowCount) {
                this.onRowCountChange();
            }
        }
    }

    showMask() {
        clearTimeout(this.maskDelay);
        this.maskDelay = window.setTimeout(this.toggleMask.bind(this, true), 300);
    }

    toggleMask(show: boolean) {
        if (this.wrapper && this.wrapper.current) {
            $(this.wrapper.current).toggleClass('loading-mask', show === true);
        }
    }

    onAddRows(count: number) {
        const model = this.getModel(this.props);
        addRows(model, count);
        this.onRowCountChange();
    }

    toggleBulkUpdate() {
        this.setState((state) => ({
            showBulkUpdate: !state.showBulkUpdate
        }));
    }

    renderError() {
        const model = this.getModel(this.props);
        if (model.isError) {
            return <Alert>{model.message ? model.message : 'Something went wrong.'}</Alert>
        }
    }

    getModel(props: EditableGridProps) {
        const { model } = props;
        return getQueryGridModel(model.getId());
    }

    getEditorModel() {
        const modelId = this.props.model.getId();
        return getEditorModel(modelId);
    }

    getSelectedRowIndexes() : List<number>{
        const model = this.getModel(this.props);
        const { selected } = this.state;

        return model.data.reduce( (indexes, dataMap, key) => {
            if (selected.has(key)) {
                return indexes.push(model.dataIds.indexOf(key));
            }
            return indexes;
        }, List<number>());
    }

    removeSelectedRows() {
        removeRows(this.getModel(this.props), this.getSelectedRowIndexes());
        this.setState(() => ({
            selected: Set<string>(),
            selectedState: GRID_CHECKBOX_OPTIONS.NONE
        }));
        this.onRowCountChange();
    }

    renderTopControls() {
        const { addControlProps, allowAdd, allowBulkUpdate, allowBulkRemove, bulkUpdateText, initialEmptyRowCount, isSubmitting } = this.props;
        const editorModel = this.getEditorModel();

        const showAddOnTop = allowAdd && this.getControlsPlacement() !== 'bottom';
        const haveLeftControls = allowBulkRemove || showAddOnTop;
        return (
            <div className="row QueryGrid-bottom-spacing">
                {haveLeftControls && <div className={"col-sm-4"}>
                    <div className="btn-group">
                        {allowBulkRemove && (
                            <Button
                                disabled={this.state.selected.size === 0 || (initialEmptyRowCount === 1 && editorModel.rowCount === 1 && !editorModel.hasData()) }
                                onClick={this.removeSelectedRows}
                                title="Delete Rows">
                                Delete Rows
                            </Button>
                        )}
                        {showAddOnTop && (
                            <AddRowsControl
                                {...addControlProps}
                                placement={"top"}
                                disable={isSubmitting}
                                onAdd={this.onAddRows}/>
                        )}
                    </div>
                </div>}
                {allowBulkUpdate && (
                    <div className={haveLeftControls? "col-sm-8" : "col-xs-12"}>
                        <div className="pull-right control-right">
                            <Button onClick={this.toggleBulkUpdate}>
                                {bulkUpdateText}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    renderBulkCreationHeader() : ReactNode {
        const { bulkUpdateProps } = this.props;

        return (
            <div className={"editable-grid__bulk-header"}>
                {bulkUpdateProps.header}
            </div>
        )
    }

    bulkAdd(data: any) : Promise<any> {
        const addControlProps = this.props.addControlProps;
        const { nounSingular, nounPlural } = addControlProps;
        const model = this.getModel(this.props);

        const numItems = data.numItems;
        delete data.numItems;

        if (numItems) {
            return new Promise((resolve) => {
                addRows(model, numItems, Map<string, any>(data));
                this.onRowCountChange();
                resolve({
                    success: true,
                    message: "Added " + numItems + " " + (numItems > 1 ? nounPlural : nounSingular)
                });
            });
        }
        return new Promise((resolve, reject) => {
            reject({
                exception: "Quantity unknown.  No " + nounPlural + " added."
            })
        })
    }

    renderBulkUpdate() {
        const { showBulkUpdate } = this.state;

        const model = this.getModel(this.props);

        return (
            showBulkUpdate &&
            <QueryInfoForm
                allowFieldDisable={this.props.allowFieldDisable}
                onSubmitForEdit={this.bulkAdd}
                asModal={true}
                checkRequiredFields={false}
                submitForEditText={`Add ${capitalizeFirstChar(this.props.addControlProps.nounPlural)} to Grid`}
                maxCount={MAX_ADDED_EDITABLE_GRID_ROWS - model.data.size}
                onHide={this.toggleBulkUpdate}
                onCancel={this.toggleBulkUpdate}
                onSuccess={this.toggleBulkUpdate}
                queryInfo={model.queryInfo}
                schemaQuery={model.queryInfo.schemaQuery}
                title={this.props.bulkUpdateProps && this.props.bulkUpdateProps.title}
                header={this.renderBulkCreationHeader()}
            />
        )
    }

    getControlsPlacement() {
        const { addControlProps } = this.props;

        if (!addControlProps || !addControlProps.placement) {
            return 'bottom';
        }
        return addControlProps.placement;
    }

    render() {
        const { addControlProps, allowAdd, bordered, condensed, isSubmitting, striped } = this.props;
        const model = this.getModel(this.props);

        if (!model || !model.isLoaded) {
            return <LoadingSpinner/>;
        }
        else if (model.isLoaded) {
            return (
                <div>
                    {this.renderTopControls()}
                    <div className="editable-grid__container"
                         onKeyDown={this.onKeyDown}
                         onMouseDown={this.onMouseDown}
                         onMouseUp={this.onMouseUp}
                         ref={this.wrapper}>
                        <Grid
                            bordered={bordered}
                            calcWidths={true}
                            cellular={true}
                            columns={this.generateColumns()}
                            condensed={condensed}
                            data={model.getDataEdit()}
                            headerCell={this.headerCell}
                            responsive={false}
                            rowKey={GRID_EDIT_INDEX}
                            striped={striped}
                            tableRef={this.table} />
                    </div>
                    {allowAdd && (this.getControlsPlacement() != 'top') && (
                        <AddRowsControl
                            {...addControlProps}
                            placement={"bottom"}
                            disable={isSubmitting}
                            onAdd={this.onAddRows}/>
                    )}
                    {this.renderError()}
                    {this.renderBulkUpdate()}
                </div>
            )
        }

        return null;
    }
}