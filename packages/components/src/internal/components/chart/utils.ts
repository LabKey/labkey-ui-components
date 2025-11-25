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
    title: string;
    totalCount: number;
}

export interface HorizontalBarLegendData {
    backgroundColor: string;
    borderColor?: string;
    circleColor: string;
    data?: Map<any, any>;
    expired?: boolean;
    legendLabel: string;
    locked?: boolean;
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
    return data
        .filter(row => row.count > 0)
        .reduce<HorizontalBarLegendData[]>((legendData, row) => {
            const countDisplay = row.count.toLocaleString();
            let legendLabel = row.name;
            if (!row.filled) {
                legendLabel = row.count > 1 ? emptyTextPlural : emptyTextSingular;
            }

            legendData.push({
                circleColor: row.backgroundColor ?? 'fff',
                backgroundColor: 'none',
                legendLabel,
                data: row.href ? Map.of('value', countDisplay, 'url', row.href) : Map.of('value', countDisplay),
            });

            return legendData;
        }, []);
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
