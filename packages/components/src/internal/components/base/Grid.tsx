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
import React, { FC, Fragment, memo, PureComponent, ReactNode, RefObject } from 'react';
import classNames from 'classnames';
import { fromJS, List, Map } from 'immutable';

import { HelpTipRenderer } from '../forms/HelpTipRenderer';

import { GRID_HEADER_CELL_BODY, GRID_SELECTION_INDEX } from '../../constants';

import { LabelHelpTip } from './LabelHelpTip';
import { getTextAlignClassName, GridColumn } from './models/GridColumn';

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
                helpTipRenderer: c.helpTipRenderer,
                hideTooltip: c.helpTipRenderer !== undefined,
                index: c.index,
                raw: c,
                tableCell: c.tableCell,
                title: c.title || c.caption,
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
    let description = info?.description?.trim() || '';
    let sepLeft = description.length > 0 ? '(' : '';
    let sepRight = description.length > 0 ? ')' : '';

    // show field key for lookups to help determine path to field when the name is generic (i.e. "Name" is
    // from "Ancestors/Sources/Lab/Name"),  46256: use encoded fieldKeyPath, 49795: show tooltip for all columns
    description += info?.index ? ' ' + sepLeft + info.index + sepRight : '';
    sepLeft = description.length > 0 ? '(' : '';
    sepRight = description.length > 0 ? ')' : '';

    description += info?.phiProtected === true ? ' ' + sepLeft + 'PHI protected data removed' + sepRight : '';

    description = description.trim();
    return !description ? undefined : description;
}

interface GridHeaderProps {
    columns: List<GridColumn>;
    headerCell?: any;
    onColumnDrop?: (sourceIndex: string, targetIndex: string) => void;
    showHeader?: boolean;
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
        // Issue 51679: find parent TH element if hovering over child element
        let target = e.target;
        if (target?.tagName.toLowerCase() === 'div' && target.classNames?.indexOf('grid-header-cell__body') > -1) {
            target = target.parentElement;
        } else if (target?.tagName.toLowerCase() === 'span') {
            target = target.parentElement.parentElement;
        }

        const targetId = target?.tagName.toLowerCase() === 'th' ? target.id : undefined;
        if (targetId !== undefined && targetId !== '' && targetId !== GRID_SELECTION_INDEX) {
            this.setState({ dragTarget: targetId });
        }
    };
    handleDrop = (e): void => {
        const source = e.dataTransfer.getData('dragIndex');
        const target = this.state.dragTarget;
        if (source && target && source !== target) {
            this.props.onColumnDrop?.(source, target); // Issue 53443
        }
    };

    handleHeaderClick = (e): void => {
        // Issue 48610: app grid column header <th> element to trigger click on child <div>
        const childEl = e.target.getElementsByClassName(GRID_HEADER_CELL_BODY);
        if (childEl?.length === 1) {
            childEl[0].click();
            e.stopPropagation(); // Issue 51879
        }
    };

    render() {
        const { columns, headerCell, showHeader, onColumnDrop } = this.props;
        const { dragTarget } = this.state;

        if (!showHeader) {
            // returning null here causes <noscript/> to render which is not expected
            return <thead style={{ display: 'none' }} />;
        }

        return (
            <thead>
                <tr>
                    {columns
                        .map((column, i) => {
                            const { headerCls, index, raw, title, hideTooltip } = column;
                            const draggable = onColumnDrop !== undefined;

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
                                        className={className}
                                        data-fieldkey={column.raw?.fieldKeyPath}
                                        draggable={draggable}
                                        id={index}
                                        key={index}
                                        onClick={this.handleHeaderClick}
                                        onDragEnd={this.handleDragEnd}
                                        onDragEnter={this.handleDragEnter}
                                        onDragOver={this.handleDragOver}
                                        onDragStart={this.handleDragStart}
                                        onDrop={this.handleDrop}
                                        title={hideTooltip ? undefined : description}
                                    >
                                        {column.index === '__selection__' && (
                                            <span className="sr-only">Selection checkboxes</span>
                                        )}
                                        {headerCell && headerCell(column, i, columns.size)}
                                        {!headerCell && (
                                            <div className={GRID_HEADER_CELL_BODY}>
                                                {title}
                                                {column.helpTipRenderer && (
                                                    <LabelHelpTip popoverClassName="label-help-arrow-top" title={title}>
                                                        <HelpTipRenderer type={column.helpTipRenderer} />
                                                    </LabelHelpTip>
                                                )}
                                            </div>
                                        )}
                                    </th>
                                );
                            }
                            return <th key={index} />;
                        }, this)
                        .toArray()}
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
        {messages
            .map((message: Map<string, string>, i) => {
                return (
                    <div className={classNames('grid-message', message.get('type'))} key={i}>
                        {message.get('content')}
                    </div>
                );
            })
            .toArray()}
    </div>
));
GridMessages.displayName = 'GridMessages';

interface GridRowProps {
    columns: List<GridColumn>;
    highlight: boolean;
    row: Map<string, any>;
    rowIdx: number;
}

const GridRow: FC<GridRowProps> = memo(({ columns, highlight, row, rowIdx }) => (
    <tr
        className={classNames({
            'grid-row-highlight': highlight,
            'grid-row-alternate': rowIdx % 2 === 0,
            'grid-row': rowIdx % 2 === 1,
        })}
    >
        {columns
            .map((column: GridColumn, c: number) => {
                if (column.tableCell) {
                    return (
                        <Fragment key={column.index}>
                            {column.cell(row.get(column.index), row, column, rowIdx, c)}
                        </Fragment>
                    );
                }

                const className = getTextAlignClassName(column);
                return (
                    <td className={className} key={column.index}>
                        <div className="table-cell-content">
                            {column.cell(row.get(column.index), row, column, rowIdx, c)}
                        </div>
                    </td>
                );
            })
            .toArray()}
    </tr>
));
GridRow.displayName = 'GridRow';

interface EmptyGridRowProps {
    colSpan: number;
    emptyText: string;
    isLoading: boolean;
    loadingText: ReactNode;
}

const EmptyGridRow: FC<EmptyGridRowProps> = memo(({ colSpan, emptyText, isLoading, loadingText }) => (
    <tr className={isLoading ? 'grid-loading' : 'grid-empty'} key="grid-default-row">
        <td colSpan={colSpan}>{isLoading ? loadingText : emptyText}</td>
    </tr>
));
EmptyGridRow.displayName = 'EmptyGridRow';

interface GridBodyProps {
    columns: List<GridColumn>;
    data: List<Map<string, any>>;
    emptyText: string;
    highlightRowIndexes?: List<number>;
    isLoading: boolean;
    loadingText: ReactNode;
    rowKey: string;
}

const GridBody: FC<GridBodyProps> = memo(props => {
    const { columns, data, emptyText, highlightRowIndexes, isLoading, loadingText, rowKey } = props;

    return (
        <tbody>
            {data
                .map((row, ind) => {
                    const highlight = highlightRowIndexes && highlightRowIndexes.contains(ind);
                    const key = rowKey ? row.get(rowKey) : ind;
                    return <GridRow columns={columns} highlight={highlight} key={key} row={row} rowIdx={ind} />;
                })
                .toArray()}

            {data.isEmpty() && (
                <EmptyGridRow
                    colSpan={columns.count()}
                    emptyText={emptyText}
                    isLoading={isLoading}
                    loadingText={loadingText}
                />
            )}
        </tbody>
    );
});
GridBody.displayName = 'GridBody';

export type GridData = List<Map<string, any>> | Record<string, any>[];

export interface GridProps {
    bordered?: boolean;
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
    rowKey?: string;
    showHeader?: boolean;
    striped?: boolean;
    tableRef?: RefObject<HTMLTableElement>;
}

export const Grid: FC<GridProps> = memo(props => {
    const {
        bordered = true,
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
        fixedHeight = false,
        columns,
        headerCell,
        onColumnDrop,
        rowKey,
        highlightRowIndexes,
        gridId,
    } = props;
    const gridData = processData(data);
    const gridColumns = columns !== undefined ? processColumns(columns) : resolveColumns(gridData);
    const headerProps: GridHeaderProps = {
        columns: gridColumns,
        headerCell,
        onColumnDrop,
        showHeader,
    };

    const bodyProps: GridBodyProps = {
        columns: gridColumns,
        data: gridData,
        emptyText,
        isLoading,
        loadingText,
        rowKey,
        highlightRowIndexes,
    };

    const tableClasses = classNames('read-only-table', {
        table: !cellular,
        'table-cellular': cellular,
        'table-striped': striped,
        'table-bordered': bordered,
        'table-condensed': condensed,
    });

    const wrapperClasses = classNames({
        'table-responsive': responsive,
        // fixedHeight is a misnomer, we used to set a fixed height, but now we use a max-height set via css
        'table-responsive--max-height': fixedHeight,
    });

    return (
        <div className={wrapperClasses} data-gridid={gridId}>
            <GridMessages messages={messages} />

            <table className={tableClasses} ref={tableRef}>
                <GridHeader {...headerProps} />
                <GridBody {...bodyProps} />
            </table>
        </div>
    );
});
Grid.displayName = 'Grid';
