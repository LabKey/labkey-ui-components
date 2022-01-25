import { fromJS } from 'immutable';
import { getServerContext } from '@labkey/api';

import {AppURL, caseInsensitive, ISelectRowsResult, naturalSort} from '../../..';

import { HorizontalBarData } from './HorizontalBarSection';
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
    const vis = getServerContext().vis;
    const { renderTo, data, onClick, height, width, defaultFillColor, defaultBorderColor, barFillColors, grouped } =
        props;

    let marginRight,
        legendPos = 'none',
        legendData;

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
            sortFn: vis.discreteSortFn,
            scale: function (key) {
                return barFillColors[key] || defaultFillColor;
            },
        };
    }

    if (grouped) {
        // in the stacked bar chart case, we actually will end up using the xSub variable for the x-axis categories
        // and the x variable for the secondary category and legend (i.e. the bar chart stacked segments)
        aes['x'] = 'xSub';
        aes['xSub'] = 'x';
        aes['color'] = 'x';

        scales['x'] = {
            scaleType: 'discrete',
            sortFn: function (a, b) {
                // reverse the sorting so that the stacked bar chart segments match the legend
                return vis.discreteSortFn(b, a);
            },
        };
        scales['xSub'] = {
            scaleType: 'discrete',
            sortFn: vis.discreteSortFn,
        };

        marginRight = Math.max(...Object.keys(barFillColors).map(text => text.length)) > 10 ? undefined : 125;
        legendPos = 'right';
        legendData = Object.keys(barFillColors)
            .sort()
            .map(text => {
                return { text, color: barFillColors[text] };
            });
    }

    return {
        renderTo,
        rendererType: 'd3',
        width,
        height,
        margins: {
            top: 50,
            right: marginRight,
        },
        labels: {
            yLeft: { value: 'Count' },
        },
        options: {
            color: defaultBorderColor,
            fill: defaultFillColor,
            showValues: true,
            stacked: grouped,
            clickFn: onClick,
            hoverFn: function (row) {
                return (
                    (grouped ? row.subLabel + '\n' : '') +
                    row.label +
                    '\n' +
                    'Count: ' +
                    row.value +
                    '\n' +
                    'Click to view details'
                );
            },
        },
        legendPos,
        legendData,
        aes,
        scales,
        data,
    };
}

export function createPercentageBarData(
    row: Record<string, any>,
    totalCountKey: string,
    itemCountKey: string,
    itemNounPlural: string,
    usedNoun: string,
    unusedNoun: string,
    className?: string,
    appURL?: AppURL
) : { data: HorizontalBarData[], subtitle: string } {
    const totalCount = caseInsensitive(row, totalCountKey)?.value ?? 0;
    const itemCount = caseInsensitive(row, itemCountKey)?.value ?? 0;
    const data = [];
    let subtitle;
    if (totalCount > 0) {
        const usedPct = (itemCount/totalCount) * 100;
        const unusedPct = 100 - usedPct;
        const unusedTitle = `${(totalCount - itemCount).toLocaleString()} of ${totalCount.toLocaleString()} ${itemNounPlural.toLowerCase()} ${unusedNoun.toLowerCase()}`;
        data.push({
            title: `${itemCount.toLocaleString()} of ${totalCount.toLocaleString()} ${itemNounPlural.toLowerCase()} ${usedNoun.toLowerCase()}`,
            name: usedNoun,
            className,
            count: itemCount,
            totalCount: totalCount,
            percent: usedPct,
            href: appURL?.toHref(),
            filled: true,
        });
        data.push({
            title: unusedTitle,
            name: unusedNoun,
            count: totalCount - itemCount,
            totalCount: totalCount,
            percent: unusedPct,
            filled: false,
        });

        subtitle = `${unusedTitle} (${(unusedPct > 0 && unusedPct < 1 ? '< 1' :  Math.trunc(unusedPct))}%)`;
    }

    return { data, subtitle };
}
