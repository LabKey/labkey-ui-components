import { ReactNode } from 'react';
import { AppURL } from '../../..';

export interface ChartSelector {
    filter?: number;
    label: string;
    name: string;
}

export interface ChartConfig {
    charts: ChartSelector[];
    colorPath?: string[];
    createText?: string;
    createURL?: () => AppURL;
    emptyStateMsg?: ReactNode;
    fetchItemCount?: () => Promise<number>;
    getAppURL?: (row: any) => AppURL;
    key: string;
    label: string;
    namePath?: string[];
    queryName: string;
    schemaName: string;
}
