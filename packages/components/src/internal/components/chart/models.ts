import { Filter, Query, Visualization } from '@labkey/api';

export interface ChartLabels {
    main?: string;
    subtitle?: string;
    x?: string;
    y?: string;
}

export interface MeasureOption {
    color?: string;
    lineType?: string;
    shape?: string;
}

export interface ChartConfig {
    geomOptions: Record<string, boolean | number | string>;
    gridLinesVisible: string;
    height?: number;
    labels: ChartLabels;
    legendPos?: 'bottom' | 'right';
    measures: Record<string, Record<string, any>>; // TODO: we can probably do better than any
    measuresOptions?: Record<string, Record<string, MeasureOption>>; // map from measures to the options for the distinct values of that measure
    pointType: string;
    renderType: string;
    scales: Record<string, ScaleType>;
    width?: number;
}

export type ChartConfigMutator = (currentConfig: ChartConfig) => ChartConfig;
export type ChartConfigSetter = (mutator: ChartConfigMutator) => void;

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

export interface BaseChartModel {
    inheritable: boolean;
    name: string;
    shared: boolean;
}

export type BaseChartModelMutator = (currentModel: BaseChartModel) => BaseChartModel;
export type BaseChartModelSetter = (mutator: BaseChartModelMutator) => void;

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

export interface ScaleType {
    max?: number | string;
    min?: number | string;
    trans: string;
    type: string;
}
