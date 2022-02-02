import React from 'react';

interface ColumnProps {
    align?: string;
    cell?: (data?: any, row?: any, col?: GridColumn, rowNumber?: number, colNumber?: number) => any;
    format?: string;
    index: string;
    showHeader?: boolean;
    raw?: any;
    tableCell?: boolean;
    title: string;
    width?: any;
    headerCls?: string;
    hideTooltip?: boolean;
    helpTipRenderer?: string;
}

const defaultCell = (d, row, col: GridColumn) => {
    let display = null;
    if (d != undefined) {
        if (typeof d === 'string' || typeof d === 'number') {
            display = d;
        } else if (typeof d === 'boolean') {
            display = d ? 'true' : 'false';
        } else {
            if (d.has('formattedValue')) {
                display = d.get('formattedValue');
            } else {
                const o = d.has('displayValue') ? d.get('displayValue') : d.get('value');
                display = o !== null && o !== undefined ? o.toString() : null;
            }

            if (d.get('url')) {
                display = <a href={d.get('url')}>{display}</a>;
            }
        }
    }

    return display;
};

export class GridColumn implements ColumnProps {
    align: string;
    cell: (data?: any, row?: any, col?: GridColumn, rowNumber?: number, colNumber?: number) => any;
    format: string;
    index: string;
    raw: any;
    showHeader: boolean;
    tableCell: boolean;
    title: string;
    width: any;
    headerCls: string;
    hideTooltip?: boolean;
    helpTipRenderer?: string;

    constructor(config: ColumnProps) {
        this.align = config.align;
        this.index = config.index;
        this.format = config.format;
        this.raw = config.raw;
        this.width = config.width;
        this.headerCls = config.headerCls;
        this.helpTipRenderer = config.helpTipRenderer;

        // react render displays '&nbsp', see: https://facebook.github.io/react/docs/jsx-gotchas.html
        if (config.title && config.title == '&nbsp;') {
            this.title = '';
        } else {
            this.title = config.title;
        }

        this.showHeader = config.showHeader !== false; // defaults to true
        this.tableCell = config.tableCell === true; // defaults to false
        this.hideTooltip = config.hideTooltip === true; // defaults to false

        if (config.cell) {
            this.cell = config.cell;
        } else {
            this.cell = defaultCell;
        }
    }
}
