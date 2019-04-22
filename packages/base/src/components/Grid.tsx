/*
 * Copyright (c) 2018 LabKey Corporation
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
import * as React from 'react'
import classNames from 'classnames'
import { fromJS, List, Map } from 'immutable'

interface ColumnProps {
    align?: string
    cell?: (data?: any, row?: any, col?: Column, rowNumber?: number, colNumber?: number) => any
    format?: string
    index: string
    showHeader?: boolean
    placeholder?: string
    raw?: any
    tableCell?: boolean
    title: string
    width?: any
}

class Column implements ColumnProps {
    align: string;
    cell: (data?: any, row?: any, col?: Column, rowNumber?: number, colNumber?: number) => any;
    format: string;
    index: string;
    raw: any;
    placeholder: string;
    showHeader: boolean;
    tableCell: boolean;
    title: string;
    width: any;

    constructor(config: ColumnProps) {
        this.align = config.align;
        this.index = config.index;
        this.format = config.format;
        this.raw = config.raw;
        this.width = config.width;
        this.placeholder = config.placeholder;

        // react render displays '&nbsp', see: https://facebook.github.io/react/docs/jsx-gotchas.html
        if (config.title && config.title == '&nbsp;') {
            this.title = '';
        }
        else {
            this.title = config.title;
        }

        this.showHeader = config.showHeader !== false; // defaults to true
        this.tableCell = config.tableCell === true; // defaults to false

        if (config.cell) {
            this.cell = config.cell;
        }
        else {
            this.cell = defaultCell;
        }
    }
}

export class GridColumn extends Column {

    constructor(config: ColumnProps) {
        super(config);
    }
}

const defaultCell = (d, row, col: Column) => {
    let display = null;
    if (d) {
        if (typeof(d) === 'string' || typeof(d) === 'number') {
            display = d;
        }
        else if (typeof(d) === 'boolean') {
            display = d ? 'true' : 'false';
        }
        else {
            if (d.has('formattedValue')) {
                display = d.get('formattedValue');
            }
            else {
                let o = d.has('displayValue') ? d.get('displayValue') : d.get('value');
                display = o !== null && o !== undefined ? o.toString() : null;
            }

            if (d.get('url')) {
                display = <a href={d.get('url')}>{display}</a>;
            }
        }
    }

    return display;
};

function processColumns(columns: List<any>): List<Column> {
    return columns
        .map(c => {
            if (c instanceof GridColumn) {
                return c;
            }
            else if (typeof(c) === 'string') {
                return new GridColumn({
                    index: c,
                    raw: c,
                    title: c
                });
            }

            return new GridColumn({
                align: c.align,
                cell: c.cell,
                format: (c.jsonType === 'float' || c.jsonType === 'int') ? c.format : undefined,
                index: c.index || c.fieldKey,
                raw: c,
                tableCell: c.tableCell,
                title: c.title || c.caption,
                width: c.width
            });
        }).toList();
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

function resolveColumns(data: List<Map<string, any>>): List<Column> {
    let columns = List<Column>().asMutable();
    if (data.count() > 0) {
        data.get(0).map((value, title: string) => {
            columns.push(new Column({index: title, title: title}));
        });
    }

    return columns.asImmutable();
}

interface GridHeaderProps {
    calcWidths?: boolean
    headerCell?: any
    onCellClick?: (column: Column) => any
    columns: List<Column>
    showHeader?: boolean
    transpose?: boolean
}

class GridHeader extends React.Component<GridHeaderProps, any> {

    _handleClick(column: Column, evt) {
        evt.stopPropagation();
        if (this.props.onCellClick) {
            this.props.onCellClick(column);
        }
    }

    render() {
        const { calcWidths, columns, headerCell, showHeader, transpose } = this.props;

        if (transpose || !showHeader) {
            // returning null here causes <noscript/> to render which is not expected
            return <thead style={{display: 'none'}}/>;
        }

        return (
            <thead>
            <tr>
                {columns.map((column: Column, i: number) => {
                    let minWidth = column.width;
                    if (minWidth === undefined) {
                        minWidth = calcWidths && column.title ? 30 + (column.title.length * 8) : undefined;
                    }
                    if (minWidth !== undefined) {
                        minWidth += 'px';
                    }

                    if (column.showHeader) {
                        return (
                            <th className="grid-header-cell"
                                key={i}
                                onClick={this._handleClick.bind(this, column)}
                                style={{minWidth}}>
                                {headerCell ? headerCell(column, i) : column.title}
                            </th>
                        );
                    }
                    return <th key={i} style={{minWidth}}/>;
                }, this)}
            </tr>
            </thead>
        );
    }
}

interface GridBodyProps {
    data: List<Map<string, any>>
    columns: List<Column>
    emptyText: string
    isLoading: boolean
    loadingText: React.ReactNode
    rowKey: any
    transpose: boolean
}

class GridBody extends React.Component<GridBodyProps, any> {

    constructor(props: GridBodyProps) {
        super(props);

        this.renderRow = this.renderRow.bind(this);
        this.renderRowTranspose = this.renderRowTranspose.bind(this);
    }

    renderDefaultRow() {
        const { columns, emptyText, isLoading, loadingText } = this.props;

        return (
            <tr key="grid-default-row" className={isLoading ? "grid-loading" : "grid-empty"}>
                <td colSpan={columns.count()}>{isLoading ? loadingText : emptyText}</td>
            </tr>
        );
    }

    renderRow(row: any, r: number): any {
        const { columns, rowKey } = this.props;
        const key = rowKey ? row.get(rowKey) : r;

        // style cast to "any" type due to @types/react@16.3.14 switch to csstype package usage which does not declare
        // "textAlign" property correctly for <td> elements.
        return (
            <tr key={key}>
                {columns.map((column: Column, c: number) => (
                    column.tableCell ? column.cell(row.get(column.index), row, column, r, c) : (
                        <td key={column.index} style={{textAlign: column.align || 'left'} as any}>
                            {column.cell(row.get(column.index), row, column, r, c)}
                        </td>
                    )
                ))}
            </tr>
        )
    }

    renderRowTranspose(row: any, r: number): any {
        const { columns, rowKey } = this.props;
        let counter = 0;
        const key = rowKey ? row.get(rowKey) : r;

        return columns.map((column: Column, c: number) => (
            <tr key={[key, counter++].join('_')} style={c === 0 ? {backgroundColor: '#eee'} : undefined}>
                <td>{column.title}</td>
                <td>{column.cell(row.get(column.index), row, column, r, c)}</td>
            </tr>
        )).toArray();
    }

    render() {
        const { data, transpose } = this.props;
        const rowRender = transpose ? this.renderRowTranspose : this.renderRow;

        return <tbody>{data.count() > 0 ? data.map(rowRender) : this.renderDefaultRow()}</tbody>;
    }
}

export type GridData = Array<Object> | List<Map<string, any>>;

export interface GridProps {
    bordered?: boolean
    calcWidths?: boolean
    cellular?: boolean
    condensed?: boolean
    columns?: List<any>
    data?: GridData
    emptyText?: string
    gridId?: string
    headerCell?: any
    isLoading?: boolean
    loadingText?: React.ReactNode
    responsive?: boolean

    /**
     * If a rowKey is specified the <Grid> will use it as a lookup key into each row. The associated value
     * will be used as the React.Key for the row.
     */
    rowKey?: any // a valid React key
    showHeader?: boolean
    striped?: boolean
    tableRef?: React.RefObject<HTMLTableElement>
    transpose?: boolean
}

export class Grid extends React.Component<GridProps, any> {
    static defaultProps = {
        bordered: true,
        calcWidths: false,
        cellular: false,
        condensed: false,
        data: List<Map<string, any>>(),
        emptyText: 'No data available.',
        isLoading: false,
        loadingText: 'Loading...',
        responsive: true,
        showHeader: true,
        striped: true,
        tableRef: undefined,
        transpose: false
    };

    render() {
        const {
            bordered,
            calcWidths,
            cellular,
            columns,
            condensed,
            data,
            emptyText,
            gridId,
            headerCell,
            isLoading,
            loadingText,
            responsive,
            rowKey,
            showHeader,
            striped,
            tableRef,
            transpose
        } = this.props;

        const gridData = processData(data);
        const gridColumns = columns !== undefined ? processColumns(columns) : resolveColumns(gridData);

        const headerProps: GridHeaderProps = {
            calcWidths,
            columns: gridColumns,
            headerCell,
            showHeader,
            transpose
        };

        const bodyProps: GridBodyProps = {
            columns: gridColumns,
            data: gridData,
            emptyText,
            isLoading,
            loadingText,
            rowKey,
            transpose
        };

        const tableClasses = classNames({
            'table': !cellular,
            'table-cellular': cellular,
            'table-striped': striped,
            'table-bordered': bordered,
            'table-condensed': condensed
        });

        const wrapperClasses = classNames({
            'table-responsive': responsive
        });

        return (
            <div className={wrapperClasses} data-gridid={gridId}>
                <table className={tableClasses} ref={tableRef}>
                    <GridHeader {...headerProps} />
                    <GridBody {...bodyProps} />
                </table>
            </div>
        );
    }
}
