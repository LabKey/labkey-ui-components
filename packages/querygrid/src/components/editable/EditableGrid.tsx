/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as OrigReact from 'react'
import React from 'reactn'
import { Dropdown, MenuItem } from 'react-bootstrap'
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
    QueryGridModel
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
    select
} from '../../actions'
import { getQueryGridModel } from "../../global";
import { Cell } from './Cell'
import { AddRowsControl, AddRowsControlProps, RightClickToggle } from './Controls'
import { headerSelectionCell } from "../../renderers";

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

function inputCellFactory(modelId: string) {
    return (value: any, row: any, c: GridColumn, rn: number, cn: number) => (
        <Cell
            col={c.raw}
            colIdx={cn-1}
            key={inputCellKey(c.raw, row)}
            modelId={modelId}
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

export interface EditableGridProps {
    allowAdd?: boolean
    allowBulkDelete?: boolean
    addControlProps?: Partial<AddRowsControlProps>
    allowRemove?: boolean
    disabled?: boolean
    initialEmptyRowCount?: number
    model: QueryGridModel
    isSubmitting?: boolean
}

export interface EditableGridState {
    selected: Set<string>
    selectedState: GRID_CHECKBOX_OPTIONS
}

export class EditableGrid extends React.Component<EditableGridProps, EditableGridState> {

    static defaultProps = {
        allowAdd: true,
        allowBulkDelete: false,
        allowRemove: true,
        disabled: false,
        isSubmitting: false,
        initialEmptyRowCount: 1
    };

    private maskDelay: number;
    private readonly table: React.RefObject<any>;
    private readonly wrapper: React.RefObject<any>;

    constructor(props: EditableGridProps) {
        super(props);

        this.onAddRows = this.onAddRows.bind(this);
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

        this.table = OrigReact.createRef();
        this.wrapper = OrigReact.createRef();

        this.state = {
            selected: Set<string>(),
            selectedState: GRID_CHECKBOX_OPTIONS.NONE
        }
    }

    componentWillMount() {
        const { initialEmptyRowCount } = this.props;
        const model = this.getModel(this.props);
        if (model.isLoaded && model.data.size === 0)
            addRows(model, initialEmptyRowCount);
    }

    componentWillReceiveProps(nextProps: EditableGridProps) {
        const newModel = this.getModel(nextProps);
        if (newModel.isLoaded && newModel.data.size === 0)
            addRows(newModel, nextProps.initialEmptyRowCount);
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
        this.setState(() => {
            return {
                selected: selected,
                selectedState: this.getModel(this.props).dataIds.size === selected.size ? GRID_CHECKBOX_OPTIONS.ALL : GRID_CHECKBOX_OPTIONS.SOME
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

    generateColumns(): List<GridColumn> {
        const { allowBulkDelete, allowRemove } = this.props;
        const model = this.getModel(this.props);
        let gridColumns = List<GridColumn>();

        if (allowBulkDelete) {
            const selColumn = new GridColumn({
                index: GRID_SELECTION_INDEX,
                title: '&nbsp;',
                showHeader: true,
                cell: (selected: boolean, row) => {
                    return <input
                        className={"edit-grid-row-checkbox"}
                        checked={this.state.selected.contains(row.get(GRID_EDIT_INDEX))}
                        type="checkbox"
                        onChange={this.select.bind(this, row)}/>;
                }
            });
            gridColumns = gridColumns.push(selColumn);
        }
        gridColumns = gridColumns.push(
            allowRemove ? new GridColumn({
                index: GRID_EDIT_INDEX,
                showHeader: false,
                tableCell: true,
                title: '',
                width: 45,
                cell: (d,r,c,rn) => (
                    <Dropdown key={c.index} id={`row-context-${rn}`} className="cellular-count" componentClass="td">
                        <RightClickToggle bsRole="toggle">
                            {rn+1}
                        </RightClickToggle>
                        <Dropdown.Menu>
                            <MenuItem onSelect={() => removeRow(model, d, rn)}>Delete row</MenuItem>
                        </Dropdown.Menu>
                    </Dropdown>
                )
            }) : COUNT_COL
        );

        model.getInsertColumns().forEach(qCol => {
            gridColumns = gridColumns.push(new GridColumn({
                align: qCol.align,
                cell: inputCellFactory(model.getId()),
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
        if (this.props.allowBulkDelete && col.index.toLowerCase() == GRID_SELECTION_INDEX) {
            return headerSelectionCell(this.selectAll, this.state.selectedState, false);
        }
        if (model.queryInfo && model.queryInfo.getColumn(col.index)) {
            const qColumn = model.queryInfo.getColumn(col.index);
            return [col.title, (qColumn.required ? '*': undefined)].join(' ');
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
        if (!this.props.disabled)
            copyEvent(this.props.model.getId(), event);
    }

    onKeyDown(event: any) {
        if (!this.props.disabled)
            select(this.props.model.getId(), event);
    }

    onMouseDown(event: any) {
        if (!this.props.disabled)
            beginDrag(this.props.model.getId(), event);
    }

    onMouseUp(event: any) {
        if (!this.props.disabled)
            endDrag(this.props.model.getId(), event);
    }

    onPaste(event: any) {
        if (!this.props.disabled)
            pasteEvent(this.props.model.getId(), event, this.showMask, this.hideMask);
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

    render() {
        const { addControlProps, allowAdd, isSubmitting } = this.props;
        const model = this.getModel(this.props);

        if (!model || !model.isLoaded) {
            return <LoadingSpinner/>;
        }
        else if (model.isLoaded) {
            return (
                <div>
                    {allowAdd && addControlProps.placement !== 'bottom' && (
                        <AddRowsControl
                            {...addControlProps}
                            disable={isSubmitting}
                            onAdd={this.onAddRows}/>
                    )}
                    <div className="editable-grid__container"
                         onKeyDown={this.onKeyDown}
                         onMouseDown={this.onMouseDown}
                         onMouseUp={this.onMouseUp}
                         ref={this.wrapper}>
                        <Grid
                            bordered={false}
                            calcWidths={true}
                            cellular={true}
                            columns={this.generateColumns()}
                            condensed={false}
                            data={model.getDataEdit()}
                            headerCell={this.headerCell}
                            responsive={false}
                            rowKey={GRID_EDIT_INDEX}
                            striped={false}
                            tableRef={this.table} />
                    </div>
                    {allowAdd && addControlProps.placement !== 'top' && (
                        <AddRowsControl
                            {...addControlProps}
                            disable={isSubmitting}
                            onAdd={this.onAddRows}/>
                    )}
                    {this.renderError()}
                </div>
            )
        }

        return null;
    }
}