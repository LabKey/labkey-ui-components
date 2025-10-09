import { Filter, Query, Visualization } from '@labkey/api';

export interface ChartConfig {
    geomOptions: any;
    gridLinesVisible: string;
    height: number;
    labels: any;
    measures: any;
    pointType: string;
    renderType: string;
    scales: any;
    width: number;
}

export interface ChartQueryConfig {
    columns: string[];
    containerFilter: Query.ContainerFilter;
    containerPath: string;
    // dataRegionName: string;
    filterArray: Filter.IFilter[];
    maxRows: number;
    method?: string;
    parameters: any;
    // queryLabel: string;
    queryName: string;
    requiredVersion: string;
    schemaName: string;
    sort: string;
    viewName: string;
}

export interface VisualizationConfigModel {
    chartConfig: ChartConfig;
    queryConfig: ChartQueryConfig;
}

export interface GenericChartModel extends Visualization.VisualizationGetResponse {
    visualizationConfig: VisualizationConfigModel;
}

export interface TrendlineType {
    equation?: string;
    label: string;
    schemaPrefix?: string;
    showMax?: boolean;
    showMin?: boolean;
    value: string;
}

interface AggregateFieldInfo {
    name: string;
    value: string;
}

export interface ChartFieldInfo {
    aggregate?: AggregateFieldInfo;
    altSelectionOnly?: boolean;
    // allowMultiple?: boolean; // not yet supported, will be part of a future dev story
    label: string;
    name: string;
    nonNumericOnly?: boolean;
    numericOnly?: boolean;
    numericOrDateOnly?: boolean;
    required: boolean;
}

export interface ChartTypeInfo {
    fields: ChartFieldInfo[];
    hidden?: boolean;
    imgUrl: string;
    name: string;
    title: string;
}
