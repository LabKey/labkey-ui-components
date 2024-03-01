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
import React, { FC, Fragment, memo, PureComponent, ReactNode, RefObject, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { fromJS, List, Map } from 'immutable';

import { HelpTipRenderer } from '../forms/HelpTipRenderer';

import { GRID_SELECTION_INDEX, GRID_HEADER_CELL_BODY } from '../../constants';

import { LabelHelpTip } from './LabelHelpTip';
import { GridColumn } from './models/GridColumn';
import { EditableColumnMetadata } from '../editable/models';

function processColumns(columns: List<any>): List<GridColumn> {
    return columns
        .map(c => {
            if (c instanceof GridColumn) {
                return c;
            } else if (typeof c === 'string') {
                return new GridColumn({
                    index: c,
                    raw: c,
                    title: c,
                });
            }

            return new GridColumn({
                align: c.align,
                cell: c.cell,
                format: c.jsonType === 'float' || c.jsonType === 'int' ? c.format : undefined,
                index: c.index,
                raw: c,
                tableCell: c.tableCell,
                title: c.title || c.caption,
                width: c.width,
                helpTipRenderer: c.helpTipRenderer,
                hideTooltip: c.helpTipRenderer !== undefined,
            });
        })
        .toList();
}

function processData(data: GridData): List<Map<string, any>> {
    if (List.isList(data)) {
        return data as List<Map<string, any>>;
    }

    if (Array.isArray(data)) {
        return fromJS(data);
    }

    return List();
}

function resolveColumns(data: List<Map<string, any>>): List<GridColumn> {
    const columns = List<GridColumn>().asMutable();
    if (data.count() > 0) {
        data.get(0).map((value, title: string) => {
            columns.push(new GridColumn({ index: title, title }));
        });
    }

    return columns.asImmutable();
}

// export for jest testing
export function getColumnHoverText(info: any): string {
    let description = info?.description || '';
    let sepLeft = description.length > 0 ? '(' : '';
    let sepRight = description.length > 0 ? ')' : '';

    // show field key for lookups to help determine path to field when the name is generic (i.e. "Name" is
    // from "Ancestors/Sources/Lab/Name"),  46256: use encoded fieldKeyPath
    description += info?.fieldKeyPath?.indexOf('/') > -1 ? ' ' + sepLeft + info.index + sepRight : '';
    sepLeft = description.length > 0 ? '(' : '';
    sepRight = description.length > 0 ? ')' : '';

    description += info?.phiProtected === true ? ' ' + sepLeft + 'PHI protected data removed' + sepRight : '';

    description = description.trim();
    return !description ? undefined : description;
}

interface GridHeaderProps {
    calcWidths?: boolean;
    columns: List<GridColumn>;
    headerCell?: any;
    onColumnDrop?: (sourceIndex: string, targetIndex: string) => void;
    showHeader?: boolean;
    transpose?: boolean;
    columnMetaData?: Record<number, EditableColumnMetadata>;
}

interface State {
    dragTarget: string;
}

// export for jest testing
export class GridHeader extends PureComponent<GridHeaderProps, State> {
    readonly state: State = { dragTarget: undefined };

    handleDragStart = (e): void => {
        const dragIndex = e.target.id;

        if (e.target?.tagName.toLowerCase() === 'th' && dragIndex !== GRID_SELECTION_INDEX) {
            e.dataTransfer.setData('dragIndex', dragIndex);
        }
    };
    handleDragOver = (e): void => {
        e.preventDefault();
    };
    handleDragEnd = (e): void => {
        this.setState({ dragTarget: undefined });
    };
    handleDragEnter = (e): void => {
        if (e.target?.tagName.toLowerCase() === 'th' && e.target.id !== GRID_SELECTION_INDEX) {
            this.setState({ dragTarget: e.target.id });
        }
    };
    handleDrop = (e): void => {
        var source = e.dataTransfer.getData('dragIndex');
        const target = this.state.dragTarget;
        if (source && target && source !== target) {
            this.props?.onColumnDrop(source, target);
        }
    };

    handleHeaderClick = (e): void => {
        // Issue 48610: app grid column header <th> element to trigger click on child <div>
        const childEl = e.target.getElementsByClassName(GRID_HEADER_CELL_BODY);
        if (childEl?.length === 1) {
            e.target.getElementsByClassName(GRID_HEADER_CELL_BODY)[0].click();
        }
    };

    render() {
        const { calcWidths, columns, headerCell, showHeader, transpose, onColumnDrop, columnMetaData } = this.props;
        const { dragTarget } = this.state;

        if (transpose || !showHeader) {
            // returning null here causes <noscript/> to render which is not expected
            return <thead style={{ display: 'none' }} />;
        }

        return (
            <thead>
                <tr>
                    {columns.map((column: GridColumn, i: number) => {
                        const { headerCls, index, raw, title, width, hideTooltip } = column;
                        const columnMeta = columnMetaData?.[i];
                        const draggable = onColumnDrop !== undefined;

                        let colWidth = columnMeta?.width;
                        if (colWidth !== undefined) {
                            colWidth += 'px';
                        }
                        let minWidth = columnMeta?.minWidth ?? width;
                        if (minWidth === undefined) {
                            // the additional 45px is to account for the grid column header icons for sort/filter and the dropdown toggle
                            minWidth = calcWidths && title ? Math.max(45 + title.length * 8, 150) : undefined;
                        }
                        if (minWidth !== undefined) {
                            minWidth += 'px';
                        }

                        if (column.showHeader) {
                            const className = classNames(headerCls, {
                                'grid-header-cell': headerCls === undefined,
                                'phi-protected': raw?.phiProtected === true,
                                'grid-header-draggable': draggable && index !== GRID_SELECTION_INDEX,
                                'grid-header-drag-over': dragTarget === index,
                            });
                            const description = getColumnHoverText(raw);

                            return (
                                <th
                                    id={index}
                                    key={index}
                                    className={className}
                                    style={colWidth ? {
                                        width: colWidth
                                    } : {
                                        minWidth
                                    }}
                                    title={hideTooltip ? undefined : description}
                                    draggable={draggable}
                                    onDragStart={this.handleDragStart}
                                    onDragOver={this.handleDragOver}
                                    onDrop={this.handleDrop}
                                    onDragEnter={this.handleDragEnter}
                                    onDragEnd={this.handleDragEnd}
                                    onClick={this.handleHeaderClick}
                                >
                                    {headerCell ? headerCell(column, i, columns.size) : title}
                                    {/* headerCell will render the helpTip, so only render here if not using headerCell() */}
                                    {!headerCell && column.helpTipRenderer && (
                                        <LabelHelpTip
                                            title={title}
                                            popoverClassName="label-help-arrow-top"
                                        >
                                            <HelpTipRenderer type={column.helpTipRenderer} />
                                        </LabelHelpTip>
                                    )}
                                </th>
                            );
                        }
                        return <th key={index} style={{ minWidth: colWidth }} />;
                    }, this)}
                </tr>
            </thead>
        );
    }
}

interface GridMessagesProps {
    messages: List<Map<string, string>>;
}

const GridMessages: FC<GridMessagesProps> = memo(({ messages }) => (
    <div className="grid-messages">
        {messages.map((message: Map<string, string>, i) => {
            return (
                <div className="grid-message" key={i}>
                    {message.get('content')}
                </div>
            );
        })}
    </div>
));

interface GridBodyProps {
    columns: List<GridColumn>;
    data: List<Map<string, any>>;
    emptyText: string;
    highlightRowIndexes?: List<number>;
    isLoading: boolean;
    loadingText: ReactNode;
    rowKey: any;
    transpose: boolean;
    columnMetaData?: Record<number, EditableColumnMetadata>;
}

class GridBody extends PureComponent<GridBodyProps> {
    constructor(props: GridBodyProps) {
        super(props);

        this.renderRow = this.renderRow.bind(this);
        this.renderRowTranspose = this.renderRowTranspose.bind(this);
    }

    renderDefaultRow() {
        const { columns, emptyText, isLoading, loadingText } = this.props;

        return (
            <tr key="grid-default-row" className={isLoading ? 'grid-loading' : 'grid-empty'}>
                <td colSpan={columns.count()}>{isLoading ? loadingText : emptyText}</td>
            </tr>
        );
    }

    renderRow(row: any, r: number, highlight?: boolean): any {
        const { columns, rowKey, columnMetaData } = this.props;
        const key = rowKey ? row.get(rowKey) : r;

        // style cast to "any" type due to @types/react@16.3.14 switch to csstype package usage which does not declare
        // "textAlign" property correctly for <td> elements.
        return (
            <tr
                key={key}
                className={classNames({
                    'grid-row-highlight': highlight,
                    'grid-row-alternate': r % 2 === 0,
                    'grid-row': r % 2 === 1,
                })}
            >
                {columns.map((column: GridColumn, c: number) => {
                    const columnMeta = columnMetaData?.[c];
                    const hasWidthOverride = !!columnMeta?.width || !!columnMeta?.minWidth;
                    return column.tableCell ? (
                        <Fragment key={column.index}>{column.cell(row.get(column.index), row, column, r, c)}</Fragment>
                    ) : (
                        <td key={column.index} className={classNames({
                            'grid-col-with-width': hasWidthOverride
                        })} style={{ textAlign: column.align || 'left' } as any}>
                            {column.cell(row.get(column.index), row, column, r, c)}
                        </td>
                    )
                })}
            </tr>
        );
    }

    renderRowTranspose(row: any, r: number): any {
        const { columns, rowKey } = this.props;
        let counter = 0;
        const key = rowKey ? row.get(rowKey) : r;

        return columns
            .map((column: GridColumn, c: number) => (
                <tr key={[key, counter++].join('_')} style={c === 0 ? { backgroundColor: '#eee' } : undefined}>
                    <td>{column.title}</td>
                    <td>{column.cell(row.get(column.index), row, column, r, c)}</td>
                </tr>
            ))
            .toArray();
    }

    render() {
        const { data, transpose, highlightRowIndexes } = this.props;

        return (
            <tbody>
                {data.count() > 0
                    ? data.map((row, ind) => {
                          if (transpose) return this.renderRowTranspose(row, ind);

                          const highlight = highlightRowIndexes && highlightRowIndexes.contains(ind);
                          return this.renderRow(row, ind, highlight);
                      })
                    : this.renderDefaultRow()}
            </tbody>
        );
    }
}

export type GridData = Array<Record<string, any>> | List<Map<string, any>>;

export interface GridProps {
    bordered?: boolean;
    calcWidths?: boolean;
    cellular?: boolean;
    columns?: List<any>;
    condensed?: boolean;
    data?: GridData;
    emptyText?: string;
    fixedHeight?: boolean;
    gridId?: string;
    headerCell?: any;
    highlightRowIndexes?: List<number>;
    isLoading?: boolean;
    loadingText?: ReactNode;
    messages?: List<Map<string, string>>;
    onColumnDrop?: (sourceIndex: string, targetIndex: string) => void;
    responsive?: boolean;
    /**
     * If a rowKey is specified the <Grid> will use it as a lookup key into each row. The associated value
     * will be used as the Key for the row.
     */
    rowKey?: any; // a valid React key
    showHeader?: boolean;
    striped?: boolean;
    tableRef?: RefObject<HTMLTableElement>;
    transpose?: boolean;
    columnMetaData?: Record<number, EditableColumnMetadata>
}

export const Grid: FC<GridProps> = memo(props => {
    const {
        bordered = true,
        calcWidths = false,
        cellular = false,
        condensed = false,
        data = List<Map<string, any>>(),
        emptyText = 'No data available.',
        isLoading = false,
        loadingText = 'Loading...',
        messages = List<Map<string, string>>(),
        responsive = true,
        showHeader = true,
        striped = true,
        tableRef = undefined,
        transpose = false,
        fixedHeight = false,
        columns,
        headerCell,
        onColumnDrop,
        rowKey,
        highlightRowIndexes,
        gridId,
        columnMetaData
    } = props;
    const gridData = processData(data);
    const gridColumns = columns !== undefined ? processColumns(columns) : resolveColumns(gridData);

    const divRef = useRef<HTMLDivElement>();
    useEffect(() => {
        if (!fixedHeight) return;
        const maxHeight = window.innerHeight * 0.7;
        divRef.current.style.height =
            divRef.current.lastElementChild?.clientHeight < maxHeight ? 'unset' : maxHeight + 'px';
    }, [fixedHeight, gridData.size]); // dep on gridData.size to recalculate div height on each grid row count change

    const headerProps: GridHeaderProps = {
        calcWidths,
        columns: gridColumns,
        headerCell,
        onColumnDrop,
        showHeader,
        transpose,
        columnMetaData
    };

    const bodyProps: GridBodyProps = {
        columns: gridColumns,
        data: gridData,
        emptyText,
        isLoading,
        loadingText,
        rowKey,
        transpose,
        highlightRowIndexes,
        columnMetaData,
    };

    const tableClasses = classNames({
        table: !cellular,
        'table-cellular': cellular,
        'table-striped': striped,
        'table-bordered': bordered,
        'table-condensed': condensed,
    });

    const wrapperClasses = classNames({
        'table-responsive': responsive,
    });

    return (
        <div className={wrapperClasses} data-gridid={gridId} ref={divRef}>
            <GridMessages messages={messages} />

            <table className={tableClasses} ref={tableRef}>
                <GridHeader {...headerProps} />
                <GridBody {...bodyProps} />
            </table>
        </div>
    );
});
