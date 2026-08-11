/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map } from 'immutable';
import { ChartConfig, ChartFieldInfo, ChartTypeInfo } from './models';
import { AGGREGATE_METHODS, BLUE_HEX_COLOR, MAX_POINT_DISPLAY } from './constants';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { naturalSortByProperty } from '../../../public/sort';
import { LABKEY_VIS } from '../../constants';
import { QueryColumn } from '../../../public/QueryColumn';

export interface HorizontalBarData {
    backgroundColor?: string;
    className?: string;
    count: number;
    dataLink?: string;
    filled: boolean;
    href?: string;
    name?: string;
    percent: number;
    sectionLabel?: string; // groups consecutive bars under a shared heading in the summary legend
    title: string;
    totalCount: number;
    unlabeled?: boolean; // name adds nothing beyond sectionLabel, so a section holding only this bar collapses to one row
}

export interface HorizontalBarLegendData {
    backgroundColor: string;
    barIndex?: number; // index of the HorizontalBarData this entry came from; undefined for section headers
    borderColor?: string;
    circleColor: string;
    data?: Map<any, any>;
    expired?: boolean;
    isSectionHeader?: boolean;
    legendLabel: string;
    locked?: boolean;
    separatorAbove?: boolean; // draws a rule above this row to fence off the section that ends before it
}

export function createHorizontalBarLegendData(data: HorizontalBarData[]): HorizontalBarLegendData[] {
    const legendMap = {};
    data.forEach(row => {
        if (row.filled && row.totalCount > 0) {
            const labels = legendMap[row.backgroundColor] || [];
            if (labels.indexOf(row.name) == -1) {
                labels.push(row.name);
                legendMap[row.backgroundColor] = labels;
            }
        }
    });
    const legendData = [];
    Object.keys(legendMap).forEach(key => {
        legendData.push({
            circleColor: key,
            backgroundColor: 'none',
            legendLabel: legendMap[key].join(', '),
        });
    });
    return legendData;
}

export function createHorizontalBarCountLegendData(
    data: HorizontalBarData[],
    emptyTextSingular: string,
    emptyTextPlural: string
): HorizontalBarLegendData[] {
    const bars = data.map((row, barIndex) => ({ row, barIndex })).filter(({ row }) => row.count > 0);
    const legendData: HorizontalBarLegendData[] = [];

    const toEntry = (row: HorizontalBarData, barIndex: number, legendLabel: string): HorizontalBarLegendData => {
        const countDisplay = row.count.toLocaleString();
        return {
            circleColor: row.backgroundColor ?? 'fff',
            backgroundColor: 'none',
            legendLabel: row.filled ? legendLabel : row.count > 1 ? emptyTextPlural : emptyTextSingular,
            barIndex,
            data: row.href ? Map.of('value', countDisplay, 'url', row.href) : Map.of('value', countDisplay),
        };
    };

    let previousWasSectioned = false;

    for (let i = 0; i < bars.length; i++) {
        const { row, barIndex } = bars[i];
        const { sectionLabel } = row;

        let end = i;
        if (sectionLabel) {
            while (end + 1 < bars.length && bars[end + 1].row.sectionLabel === sectionLabel) end++;
        }

        // a lone bar keeps its header unless it is unlabeled, where the header and row would read identically
        const collapses = end === i && row.unlabeled;

        if (sectionLabel && !collapses) {
            const section = bars.slice(i, end + 1);
            const total = section.reduce((sum, bar) => sum + bar.row.count, 0);
            legendData.push({
                circleColor: 'none',
                backgroundColor: 'none',
                legendLabel: sectionLabel,
                isSectionHeader: true,
                separatorAbove: legendData.length > 0,
                data: Map.of('value', total.toLocaleString()),
            });
            section.forEach(bar => legendData.push(toEntry(bar.row, bar.barIndex, bar.row.name)));
            previousWasSectioned = true;
        } else {
            const entry = toEntry(row, barIndex, sectionLabel ?? row.name);
            // close off the preceding section so its rows don't read as part of this one
            if (previousWasSectioned) entry.separatorAbove = true;
            legendData.push(entry);
            previousWasSectioned = false;
        }

        i = end;
    }

    return legendData;
}

export const getFieldDataType = (fieldData: Record<string, any>): string => {
    if (!fieldData) return undefined;
    return fieldData.displayFieldJsonType || fieldData.jsonType || fieldData.type;
};

export const shouldShowRangeScaleOptions = (field: ChartFieldInfo, selectedType: ChartTypeInfo): boolean => {
    const isScatter = selectedType.name === 'scatter_plot';
    const isLine = selectedType.name === 'line_plot';
    const isBox = selectedType.name === 'box_plot';
    const isBar = selectedType.name === 'bar_chart';
    const showForX = field.name === 'x' && (isScatter || isLine);
    const showForY = field.name === 'y' && (isScatter || isLine || isBox || isBar);
    return showForX || showForY;
};

export const shouldShowAggregateOptions = (field: ChartFieldInfo, selectedType: ChartTypeInfo): boolean => {
    const isBar = selectedType.name === 'bar_chart';
    const isLine = selectedType.name === 'line_plot';
    return field.name === 'y' && (isBar || isLine);
};

const makeGeomOptions = (chartType: string) => ({
    binShape: 'hex',
    binSingleColor: '000000',
    binThreshold: MAX_POINT_DISPLAY,
    boxFillColor: chartType === 'box_plot' ? 'none' : BLUE_HEX_COLOR,
    chartLayout: 'single',
    chartSubjectSelection: 'subjects',
    colorPaletteScale: 'ColorDiscrete',
    colorRange: 'BlueWhite',
    displayIndividual: true,
    displayAggregate: false,
    errorBars: 'None',
    gradientColor: 'FFFFFF',
    gradientPercentage: 95,
    hideDataPoints: false,
    hideTrendLine: false,
    lineColor: '000000',
    lineWidth: chartType === 'line_plot' ? 3 : 1,
    marginBottom: null,
    marginLeft: null,
    marginRight: null,
    marginTop: 15,
    opacity: chartType === 'bar_chart' || chartType === 'line_plot' ? 1.0 : 0.5,
    pieHideWhenLessThanPercentage: 5,
    pieInnerRadius: 0,
    pieOuterRadius: 80,
    piePercentagesColor: '333333',
    pointFillColor: BLUE_HEX_COLOR,
    pointSize: chartType === 'box_plot' ? 3 : 5,
    position: chartType === 'box_plot' ? 'jitter' : null,
    showOutliers: true,
    showPiePercentages: true,
    trendlineType: undefined,
    trendlineAsymptoteMin: undefined,
    trendlineAsymptoteMax: undefined,
});

/**
 * Deep copies an existing ChartConfig or creates an empty one. Use before manipulating an existing chart config.
 */
export function deepCopyChartConfig(chartConfig: ChartConfig, chartType = 'bar_chart'): ChartConfig {
    if (!chartConfig) {
        return {
            geomOptions: makeGeomOptions(chartType),
            gridLinesVisible: 'both',
            height: 500,
            labels: {},
            measures: {},
            measuresOptions: {},
            pointType: 'all',
            renderType: chartType,
            scales: {},
            width: undefined,
        };
    }
    return {
        ...chartConfig,
        geomOptions: { ...chartConfig.geomOptions },
        labels: { ...chartConfig.labels },
        measures: { ...chartConfig.measures },
        measuresOptions: { ...chartConfig.measuresOptions },
        scales: { ...chartConfig.scales },
    };
}

export function hasTrendline(chartType: ChartTypeInfo) {
    return chartType.fields.find(f => f.name === 'trendline') !== undefined;
}

export const getDefaultBarChartAxisLabel = (config: ChartConfig): string => {
    const aggregate = config.measures.y?.aggregate;
    const label = AGGREGATE_METHODS.find(m => m.value === aggregate)?.label;
    const prefix = (label ?? aggregate ?? 'Sum') + ' of ';
    return config.measures.y ? prefix + config.measures.y.label : 'Count';
};

export const getBarChartAxisLabel = (updated: ChartConfig, prev: ChartConfig) => {
    const emptyLabel = !updated.labels.y?.trim();
    const isPrevUsingDefault = prev.labels.y === getDefaultBarChartAxisLabel(prev);

    if (emptyLabel || isPrevUsingDefault) {
        return getDefaultBarChartAxisLabel(updated);
    }

    return updated.labels.y;
};

export const getSelectOptions = (model: QueryModel, chartType: ChartTypeInfo, field: ChartFieldInfo): QueryColumn[] => {
    const allowableTypes = LABKEY_VIS.GenericChartHelper.getAllowableTypes(field);

    return model.queryInfo
        .getDisplayColumns(model.viewName)
        .filter(col => {
            const colType = getFieldDataType(col);
            const hasMatchingType = allowableTypes.indexOf(colType) > -1;
            const isMeasureDimensionMatch = LABKEY_VIS.GenericChartHelper.isMeasureDimensionMatch(
                chartType.name,
                field,
                col.measure,
                col.dimension
            );
            return hasMatchingType || isMeasureDimensionMatch;
        })
        .sort(naturalSortByProperty('caption'));
};
