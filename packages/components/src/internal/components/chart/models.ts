import { ReactNode } from 'react';
import { Filter, Query } from '@labkey/api';

import { AppURL } from '../../url/AppURL';
import { SchemaQuery } from '../../../public/SchemaQuery';
import {VisualizationGetResponse} from "@labkey/api/dist/labkey/query/Visualization";

export interface BarChartData {
    count: number;
    id?: string | number;
    x: string;
    xSub?: string;
}

export interface BarChartSelector {
    filter?: number;
    label: string;
    name: string;
}

export interface BarChartConfig {
    charts: BarChartSelector[];
    colorPath?: string[];
    emptyStateMsg?: ReactNode;
    filterDataRegionName?: string;
    getAppURL?: (data: BarChartData, evt?: any) => AppURL;
    getProjectExclusionFilter?: (projectExclusions: { [key: string]: number[] }) => Filter.IFilter;
    groupPath?: string[];
    itemCountFilters?: Filter.IFilter[];
    itemCountSQ: SchemaQuery;
    key: string;
    label: string;
    namePath?: string[];
    queryName: string;
    schemaName: string;
    showSampleButtons?: boolean;
    sort?: string;
}

export interface ChartConfig {
    geomOptions: any;
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

interface VisualizationConfigModel {
    chartConfig: ChartConfig;
    queryConfig: ChartQueryConfig;
}

export interface GenericChartModel extends VisualizationGetResponse {
    visualizationConfig: VisualizationConfigModel;
}
