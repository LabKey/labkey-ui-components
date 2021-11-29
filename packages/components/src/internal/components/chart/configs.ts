import { Filter } from '@labkey/api';

import { AppURL, App, SCHEMAS } from '../../..';

import { ASSAYS_KEY, SAMPLES_KEY } from '../../app/constants';

import { ChartConfig, ChartSelector } from './types';

const CHART_SELECTORS: Record<string, ChartSelector> = {
    All: { name: 'TotalCount', label: 'All' },
    Month: { name: 'Last30DaysCount', label: 'In the Last Month', filter: -29 },
    Today: { name: 'TodayCount', label: 'Today', filter: 0 },
    Week: { name: 'Last7DaysCount', label: 'In the Last Week', filter: -6 },
    Year: { name: 'Last365DaysCount', label: 'In the Last Year', filter: -364 },
};

export const CHART_GROUPS: Record<string, ChartConfig> = {
    Assays: {
        charts: [
            CHART_SELECTORS.All,
            CHART_SELECTORS.Year,
            CHART_SELECTORS.Month,
            CHART_SELECTORS.Week,
            CHART_SELECTORS.Today,
        ],
        // TODO: Use redirect AppURL.create('assays', row.id, 'overview')
        getAppURL: row => AppURL.create(ASSAYS_KEY, 'general', row.x, 'overview'),
        itemCountSQ: SCHEMAS.ASSAY_TABLES.ASSAY_LIST,
        key: ASSAYS_KEY,
        label: 'Assay Run Count by Assay',
        queryName: 'AssayRunCounts',
        schemaName: SCHEMAS.EXP_TABLES.SCHEMA,
    },
    Samples: {
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
        getAppURL: row => AppURL.create(SAMPLES_KEY, row.x),
        itemCountSQ: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
        key: SAMPLES_KEY,
        label: 'Sample Count by Sample Type',
        queryName: 'SampleSetCounts',
        schemaName: SCHEMAS.EXP_TABLES.SCHEMA,
    },
    SampleStatuses: {
        charts: [
            { name: 'TotalCount', label: 'All Statuses' },
            { name: 'WithStatusCount', label: 'With a Status' },
            { name: 'NoStatusCount', label: 'No Status' },
        ],
        colorPath: ['Color', 'value'],
        groupPath: ['Status', 'value'],
        createText: 'Create Samples',
        createURL: () => App.NEW_SAMPLES_HREF,
        getAppURL: (row, evt) => {
            let url = AppURL.create(SAMPLES_KEY, row.xSub || row['subLabel']);
            if (evt.target.tagName === 'rect') {
                const val = row.x || row['label'];
                if (val !== 'No Status') {
                    url = url.addFilters(Filter.create('SampleState/Label', val));
                } else {
                    url = url.addFilters(Filter.create('SampleState/Label', null, Filter.Types.ISBLANK));
                }
            }
            return url;
        },
        itemCountSQ: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
        key: SAMPLES_KEY,
        label: 'Sample Count by Status',
        queryName: 'SampleStatusCounts',
        schemaName: SCHEMAS.EXP_TABLES.SCHEMA,
    },
};
