/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as OrigReact from 'react'
import React from 'reactn'
import { Dropdown, MenuItem } from 'react-bootstrap'
import { List } from 'immutable'
import $ from 'jquery'
import { Grid, GridColumn } from '@glass/grid'
import { QueryColumn, QueryGridModel, GRID_EDIT_INDEX } from '@glass/models'
import { Alert, LoadingSpinner } from '@glass/utils'

import { beginDrag, endDrag, inDrag, select, removeRow, addRows, clearSelection, copyEvent, pasteEvent } from '../../actions'
import { Cell } from './Cell'
import { AddRowsControl, AddRowsControlProps, RightClickToggle } from './Controls'

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
    addControlProps?: Partial<AddRowsControlProps>
    allowRemove?: boolean
    model: QueryGridModel
    isSubmitting?: boolean
    loadData?: boolean
}

export class EditableGrid extends React.Component<EditableGridProps, any> {

    static defaultProps = {
        allowAdd: true,
        allowRemove: true,
        isSubmitting: false,
        loadData: false
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

        this.table = OrigReact.createRef();
        this.wrapper = OrigReact.createRef();

        if (!props.model) {
            throw new Error('EditableGrid: a model must be provided.');
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

    generateColumns(): List<GridColumn> {
        const { allowRemove } = this.props;
        const { model } = this.props;

        let gridColumns = List<GridColumn>([
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
        ]).asMutable();

        model.getInsertColumns().forEach(qCol => {
            gridColumns.push(new GridColumn({
                align: qCol.align,
                cell: inputCellFactory(model.id),
                index: qCol.fieldKey,
                raw: qCol,
                title: qCol.caption,
                width: 100
            }));
        });

        return gridColumns.asImmutable();
    }

    headerCell(col: GridColumn) {
        const { model } = this.props;

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
        const { model } = this.props;

        if (this.table && this.table.current &&
            (!$.contains(this.table.current, event.target) && !$(event.target).parent('.cell-lookup')) &&
            !inDrag(model.getId())) {
            clearSelection(model.getId());
        }
    }

    onCopy(event: any) {
        copyEvent(this.props.model.getId(), event);
    }

    onKeyDown(event: any) {
        select(this.props.model.getId(), event);
    }

    onMouseDown(event: any) {
        beginDrag(this.props.model.getId(), event);
    }

    onMouseUp(event: any) {
        endDrag(this.props.model.getId(), event);
    }

    onPaste(event: any) {
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
        const { model } = this.props;
        addRows(model, count);
    }

    renderError() {
        const { model } = this.props;
        if (model.isError) {
            return <Alert>{model.message ? model.message : 'Something went wrong.'}</Alert>
        }
    }

    render() {
        const { addControlProps, allowAdd, isSubmitting, model } = this.props;

        if (!model || !model.isLoaded) {
            return <LoadingSpinner/>;
        }
        else if (model.isLoaded) {
            return (
                <div>
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
                    {allowAdd && (
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