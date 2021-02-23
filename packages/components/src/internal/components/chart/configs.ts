import { Filter, Query } from '@labkey/api';

import { AppURL, App, SCHEMAS, SchemaQuery } from '../../..';

import { ASSAYS_KEY, SAMPLES_KEY } from '../../app';

import { ChartConfig, ChartSelector } from './types';

function fetchItemCount(schemaQuery: SchemaQuery, filters?: Filter.IFilter[]): () => Promise<number> {
    return () =>
        new Promise(resolve => {
            Query.selectRows({
                filterArray: filters ?? [],
                includeMetadata: false,
                maxRows: 1,
                method: 'POST',
                queryName: schemaQuery.getQuery(),
                requiredVersion: '17.1',
                schemaName: schemaQuery.getSchema(),
                success: response => {
                    resolve(response.rowCount);
                },
                failure: error => {
                    console.error('Failed to fetch item count for charts', error);
                    resolve(0);
                },
            });
        });
}

const CHART_SELECTORS: Record<string, ChartSelector> = {
    All: { name: 'TotalCount', label: 'All' },
    Month: { name: 'Last30DaysCount', label: 'In the Last Month', filter: -29 },
    Today: { name: 'TodayCount', label: 'Today', filter: 0 },
    Week: { name: 'Last7DaysCount', label: 'In the Last Week', filter: -6 },
    Year: { name: 'Last365DaysCount', label: 'In the Last Year', filter: -364 },
};

export const CHART_GROUPS: ChartConfig[] = [
    {
        charts: [
            CHART_SELECTORS.All,
            CHART_SELECTORS.Year,
            CHART_SELECTORS.Month,
            CHART_SELECTORS.Week,
            CHART_SELECTORS.Today,
        ],
        colorPath: ['Color', 'value'],
        createText: 'Create Samples',
        createURL: () => App.NEW_SAMPLES_HREF,
        fetchItemCount: fetchItemCount(SCHEMAS.EXP_TABLES.SAMPLE_SETS),
        getAppURL: row => AppURL.create(SAMPLES_KEY, row.label),
        key: SAMPLES_KEY,
        label: 'Sample Count by Sample Type',
        queryName: 'SampleSetCounts',
        schemaName: SCHEMAS.EXP_TABLES.SCHEMA,
    },
    {
        charts: [
            CHART_SELECTORS.All,
            CHART_SELECTORS.Year,
            CHART_SELECTORS.Month,
            CHART_SELECTORS.Week,
            CHART_SELECTORS.Today,
        ],
        fetchItemCount: fetchItemCount(SCHEMAS.ASSAY_TABLES.ASSAY_LIST, [Filter.create('Type', 'General')]),
        // TODO: Use redirect AppURL.create('assays', row.id, 'overview')
        getAppURL: row => AppURL.create(ASSAYS_KEY, 'general', row.label, 'overview'),
        key: ASSAYS_KEY,
        label: 'Assay Run Count by Assay',
        queryName: 'AssayRunCounts',
        schemaName: SCHEMAS.EXP_TABLES.SCHEMA,
    },
];
