import React, { ReactNode } from 'react';

export type GridColumnCellRenderer<D = any, R = any> = (
    data?: D,
    row?: R,
    col?: GridColumn,
    rowNumber?: number,
    colNumber?: number
) => ReactNode;

interface ColumnProps {
    align?: string;
    cell?: GridColumnCellRenderer;
    format?: string;
    headerCls?: string;
    helpTipRenderer?: string;
    hideTooltip?: boolean;
    index: string;
    raw?: any;
    showHeader?: boolean;
    tableCell?: boolean;
    title: string;
}

const defaultCell: GridColumnCellRenderer = d => {
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
    cell: GridColumnCellRenderer;
    format: string;
    headerCls: string;
    helpTipRenderer?: string;
    hideTooltip?: boolean;
    index: string;
    raw: any;
    tableCell: boolean;
    title: string;
    showHeader: boolean;

    constructor(config: ColumnProps) {
        this.align = config.align;
        this.cell = config.cell ?? defaultCell;
        this.format = config.format;
        this.index = config.index;
        this.raw = config.raw;
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
    }
}

// Special interface that lets us pass GridColumn and QueryColumn to getTextAlignClassname
interface WithAlignment {
    align?: string;
}

const TEXT_ALIGN_CLASSES = {
    center: 'text-center',
    left: 'text-left',
    right: 'text-right',
};

export function getTextAlignClassName(column: WithAlignment): string {
    return TEXT_ALIGN_CLASSES[column?.align] ?? TEXT_ALIGN_CLASSES.left;
}
