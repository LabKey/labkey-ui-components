import { ReactNode } from 'react';
import { Filter } from '@labkey/api';

import { AppURL, SchemaQuery } from '../../..';

export interface ChartData {
    count: number;
    x: string;
    xSub?: string;
    id?: string | number;
}

export interface ChartSelector {
    filter?: number;
    label: string;
    name: string;
}

export interface ChartConfig {
    charts: ChartSelector[];
    colorPath?: string[];
    groupPath?: string[];
    createText?: string;
    createURL?: () => AppURL;
    emptyStateMsg?: ReactNode;
    filterDataRegionName?: string;
    getAppURL?: (data: ChartData, evt?: any) => AppURL;
    itemCountFilters?: Filter.IFilter[];
    itemCountSQ: SchemaQuery;
    key: string;
    label: string;
    namePath?: string[];
    queryName: string;
    schemaName: string;
    sort?: string;
}
