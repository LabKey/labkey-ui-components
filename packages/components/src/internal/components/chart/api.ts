import { Ajax, Filter, Query, Utils } from '@labkey/api';
import { buildURL } from '../../url/AppURL';
import { ProductSectionModel } from '../productnavigation/models';
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

export function fetchRReport(reportId: string, filters?: Filter.IFilter[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const params = { reportId, 'webpart.name': 'report' };
        if (filters) {
            filters.forEach(filter => {
                params[filter.getURLParameterName()] = filter.getURLParameterValue();
            });
        }
        const url = buildURL('project', 'getWebPart.view', params);
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
    fetchRReport: (reportId, filters?: Filter.IFilter[]) => Promise<string>;
    fetchVisualizationConfig: (reportId: string) => Promise<VisualizationConfigModel>;
}

export const DEFAULT_API_WRAPPER = {
    fetchRReport,
    fetchVisualizationConfig,
}
