import { Ajax, Filter, Query, Utils } from '@labkey/api';
import { getContainerFilter } from '../../query/api';
import { buildURL } from '../../url/AppURL';
import { VisualizationConfigModel } from './models';

export function fetchVisualizationConfig(reportId: string): Promise<VisualizationConfigModel> {
    return new Promise((resolve, reject) => {
        Query.Visualization.get({
            reportId,
            name: undefined,
            schemaName: undefined,
            queryName: undefined,
            success: response => {
                resolve(response.visualizationConfig);
            },
            failure: reject,
        });
    });
}

export function fetchRReport(reportId: string, container?: string, filters?: Filter.IFilter[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const params = { reportId, 'webpart.name': 'report', containerFilter: getContainerFilter(container) };
        if (filters) {
            filters.forEach(filter => {
                params[filter.getURLParameterName()] = filter.getURLParameterValue();
            });
        }
        const url = buildURL('project', 'getWebPart.view', params, { container });
        Ajax.request({
            url,
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
    fetchRReport: (reportId: string, container?: string, filters?: Filter.IFilter[]) => Promise<string>;
    fetchVisualizationConfig: (reportId: string) => Promise<VisualizationConfigModel>;
}

export const DEFAULT_API_WRAPPER = {
    fetchRReport,
    fetchVisualizationConfig,
};
