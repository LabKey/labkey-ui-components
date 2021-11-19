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
    groupPath?: string[];
}

export function processChartData(response: ISelectRowsResult, options?: ProcessChartOptions): ChartDataProps {
    const countPath = options?.countPath ?? ['count', 'value'];
    const colorPath = options?.colorPath;
    const idPath = options?.idPath ?? ['RowId', 'value'];
    const namePath = options?.namePath ?? ['Name', 'value'];
    const groupPath = options?.groupPath;

    const rows = fromJS(response.models[response.key]);

    const data = rows
        .filter(row => row.getIn(countPath) > 0)
        .map(row => ({
            count: row.getIn(countPath),
            id: row.getIn(idPath),
            x: row.getIn(namePath),
            xSub: groupPath ? row.getIn(groupPath) : undefined,
        }))
        .sortBy(row => row.x, naturalSort)
        .toArray();

    let barFillColors;
    if (colorPath) {
        barFillColors = {};
        rows.forEach(row => {
            barFillColors[row.getIn(groupPath ?? namePath)] = row.getIn(colorPath);
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
    grouped?: boolean;
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
        grouped,
    } = props;
    const aes = {
        x: 'x',
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

    if (grouped) {
        aes['x'] = 'xSub';
        aes['xSub'] = 'x';
        aes['color'] = 'x';
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
            stacked: grouped,
            // TODO
            clickFn: onClick,
            // TODO
            hoverFn: function (row) {
                return row.label + '\nClick to view details';
            },
        },
        legendPos: !grouped ? 'none' : 'right',
        legendData: !grouped ? undefined : Object.keys(barFillColors).map(text => {
            return { text, color: barFillColors[text] };
        }),
        aes,
        scales,
        data,
    };
}
