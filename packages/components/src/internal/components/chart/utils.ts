import { Map } from 'immutable';
import { ChartFieldInfo, ChartTypeInfo } from './models';

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
