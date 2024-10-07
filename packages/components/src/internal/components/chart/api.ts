import { Ajax, Filter, Query, Utils } from '@labkey/api';

import { getContainerFilterForFolder } from '../../query/api';
import { buildURL } from '../../url/AppURL';

import { GenericChartModel } from './models';

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
            failure: reason => {
                console.error(reason);
                reject(reason);
            },
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
        const params = {
            reportId,
            'webpart.name': 'report',
            [containerFilterPrefix]: getContainerFilterForFolder(container),
        };
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
    fetchGenericChart: (reportId: string) => Promise<GenericChartModel>;
    fetchRReport: (
        reportId: string,
        urlPrefix?: string,
        container?: string,
        filters?: Filter.IFilter[]
    ) => Promise<string>;
}

export const DEFAULT_API_WRAPPER = {
    fetchRReport,
    fetchGenericChart,
};
