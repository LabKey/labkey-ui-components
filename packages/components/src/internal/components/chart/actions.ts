import { Ajax, Utils } from '@labkey/api';

import { buildURL } from '../../url/AppURL';
import { resolveErrorMessage } from '../../util/messaging';

export interface SaveReportConfig {
    jsonData: any; // this is effectively VisualizationConfigModel but the queryConfig.filterArray type doesn't quite match
    name?: string;
    public?: boolean;
    queryName: string;
    renderType: string;
    reportId?: string;
    schemaName: string;
    viewName: string;
}

interface SaveChartResponse {
    reportId: string;
    success: boolean;
}

export function saveChart(reportConfig: SaveReportConfig, containerPath?: string): Promise<SaveChartResponse> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('visualization', 'saveGenericReport.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: reportConfig,
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error(error);
                reject(resolveErrorMessage(error) ?? 'Failed to save chart.');
            }),
        });
    });
}

interface DeleteChartResponse {
    success: boolean;
}

export function deleteChart(id: string, dataType = 'reports', containerPath?: string): Promise<DeleteChartResponse> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('reports', 'deleteViews.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: { views: [{ dataType, id }] },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error(error);
                reject(resolveErrorMessage(error) ?? 'Failed to delete chart.');
            }),
        });
    });
}
