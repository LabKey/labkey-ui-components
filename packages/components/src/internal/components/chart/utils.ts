import { fromJS } from 'immutable';

import { ISelectRowsResult, naturalSort } from '../../..';

interface ChartDataProps {
    data: any[];
    barFillColors: { [key: string]: string };
}

export function processChartData(
    response: ISelectRowsResult,
    countPath: string[] = ['count', 'value'],
    namePath: string[] = ['Name', 'value'],
    colorPath?: string[]
): ChartDataProps {
    const rows = fromJS(response.models[response.key]);

    const data = rows
        .filter(row => row.getIn(countPath) > 0)
        .map(row => ({
            label: row.getIn(namePath),
            count: row.getIn(countPath),
        }))
        .sortBy(row => row.label, naturalSort)
        .toArray();

    let barFillColors;
    if (colorPath) {
        barFillColors = {};
        rows.map(row => {
            barFillColors[row.getIn(namePath)] = row.getIn(colorPath);
        });
    }

    return { data, barFillColors } as ChartDataProps;
}

interface BarChartPlotConfigProps {
    renderTo: string;
    title: string;
    height?: number;
    width: number;
    defaultFillColor?: string;
    defaultBorderColor?: string;
    data: any[];
    barFillColors?: { [key: string]: any };
    onClick?: (evt: any, row: any) => void;
}

export function getBarChartPlotConfig(props: BarChartPlotConfigProps): { [key: string]: any } {
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
