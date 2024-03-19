import { Ajax, Filter, Query, Utils } from '@labkey/api';

import { getContainerFilter } from '../../query/api';
import { buildURL } from '../../url/AppURL';

import {GenericChartModel} from './models';

function fetchGenericChart(reportId: string): Promise<GenericChartModel> {
    return new Promise((resolve, reject) => {
        Query.Visualization.get({
            reportId,
            name: undefined,
            schemaName: undefined,
            queryName: undefined,
            success: response => {
                resolve(response);
            },
            failure: reject,
        });
    });
}

function fetchRReport(
    reportId: string,
    urlPrefix = 'query',
    container?: string,
    filters?: Filter.IFilter[]
): Promise<string> {
    return new Promise((resolve, reject) => {
        // The getWebPart API honors containerFilterName, not containerFilter.
        const containerFilterPrefix = `${urlPrefix}.containerFilterName`;
        const params = { reportId, 'webpart.name': 'report', [containerFilterPrefix]: getContainerFilter(container) };
        if (filters) {
            filters.forEach(filter => (params[filter.getURLParameterName(urlPrefix)] = filter.getURLParameterValue()));
        }
        Ajax.request({
            url: buildURL('project', 'getWebPart.view', params, { container }),
            success: Utils.getCallbackWrapper(response => {
                resolve(response.html);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

export interface ChartAPIWrapper {
    fetchRReport: (
        reportId: string,
        urlPrefix?: string,
        container?: string,
        filters?: Filter.IFilter[]
    ) => Promise<string>;
    fetchGenericChart: (reportId: string) => Promise<GenericChartModel>;
}

export const DEFAULT_API_WRAPPER = {
    fetchRReport,
    fetchGenericChart,
};
