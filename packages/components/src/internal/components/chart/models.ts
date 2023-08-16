import { ReactNode } from 'react';
import { Filter } from '@labkey/api';

import { AppURL } from '../../url/AppURL';
import { SchemaQuery } from '../../../public/SchemaQuery';

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
