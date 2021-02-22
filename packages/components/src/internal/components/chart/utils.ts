import { fromJS } from 'immutable';

import { ISelectRowsResult, naturalSort } from '../../..';

import { ChartData } from './types';

interface ChartDataProps {
    barFillColors: Record<string, string>;
    data: ChartData[];
}

interface ProcessChartOptions {
    colorPath?: string[];
    countPath?: string[];
    idPath?: string[];
    namePath?: string[];
}

export function processChartData(response: ISelectRowsResult, options?: ProcessChartOptions): ChartDataProps {
    const countPath = options?.countPath ?? ['count', 'value'];
    const colorPath = options?.colorPath;
    const idPath = options?.idPath ?? ['RowId', 'value'];
    const namePath = options?.namePath ?? ['Name', 'value'];

    const rows = fromJS(response.models[response.key]);

    const data = rows
        .filter(row => row.getIn(countPath) > 0)
        .map(row => ({
            count: row.getIn(countPath),
            id: row.getIn(idPath),
            label: row.getIn(namePath),
        }))
        .sortBy(row => row.label, naturalSort)
        .toArray();

    let barFillColors;
    if (colorPath) {
        barFillColors = {};
        rows.forEach(row => {
            barFillColors[row.getIn(namePath)] = row.getIn(colorPath);
        });
    }

    return { barFillColors, data };
}

interface BarChartPlotConfigProps {
    renderTo: string;
    title: string;
    height?: number;
    width: number;
    defaultFillColor?: string;
    defaultBorderColor?: string;
    data: any[];
    barFillColors?: Record<string, any>;
    onClick?: (evt: any, row: any) => void;
}

export function getBarChartPlotConfig(props: BarChartPlotConfigProps): Record<string, any> {
    const {
        renderTo,
        title,
        data,
        onClick,
        height,
        width,
        defaultFillColor,
        defaultBorderColor,
        barFillColors,
    } = props;
    const aes = {
        x: 'label',
        y: 'count',
    };
    const scales = {
        y: {
            tickFormat: function (v) {
                if (v.toString().indexOf('.') > -1) {
                    return;
                }

                return v;
            },
        },
    };

    if (barFillColors) {
        aes['color'] = 'label';

        scales['color'] = {
            scaleType: 'discrete',
            scale: function (key) {
                return barFillColors[key] || defaultFillColor;
            },
        };
    }

    return {
        renderTo,
        rendererType: 'd3',
        width,
        height,
        labels: {
            main: { value: title, visibility: 'hidden' },
            yLeft: { value: 'Count' },
        },
        options: {
            color: defaultBorderColor,
            fill: defaultFillColor,
            showValues: true,
            clickFn: onClick,
            hoverFn: function (row) {
                return row.label + '\nClick to view details';
            },
        },
        legendPos: 'none',
        aes,
        scales,
        data,
    };
}
