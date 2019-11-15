import { Set } from 'immutable';
import { buildURL, AppURL } from '@glass/base';
import { Ajax } from '@labkey/api';

import { DataViewInfoTypes, IDataViewInfo } from '../models';

export const GRID_REPORTS = Set([DataViewInfoTypes.Query, DataViewInfoTypes.Dataset]);
export const CHARTS = Set([
    DataViewInfoTypes.AutomaticPlot,
    DataViewInfoTypes.BarChart,
    DataViewInfoTypes.BoxAndWhiskerPlot,
    DataViewInfoTypes.PieChart,
    DataViewInfoTypes.XYScatterPlot,
    DataViewInfoTypes.XYSeriesLinePlot,
]);
export type ReportURLMapper = (report: IDataViewInfo) => AppURL

/**
 * FlattenResponse converts the response body (a nested tree structure) from browseDataTree into a flat list of
 * ReportItem objects. This method purposely ignores categories and their nested structures.
 *
 * @param response: the body from the browseDataTree API Action
 * @param urlMapper: ReportURLMapper
 */
export function flattenBrowseDataTreeResponse(response: any, urlMapper?: ReportURLMapper): Array<IDataViewInfo> {
    function _flattenBrowseDataTreeResponse(all, item): Array<IDataViewInfo> {
        if (item.hasOwnProperty('children')) {
            return [...all, ...item.children.reduce(_flattenBrowseDataTreeResponse, [])] as Array<IDataViewInfo>;
        } else {
            if (urlMapper) {
                const appUrl = urlMapper(item);

                if (appUrl !== item.runUrl) {
                    item.appUrl = appUrl;
                }
            }

            return [...all, item];
        }
    }

    return _flattenBrowseDataTreeResponse([], response);
}

export function loadReports(urlMapper?: ReportURLMapper): Promise<Array<IDataViewInfo>> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            method: 'GET',
            url: buildURL('reports', 'browseDataTree.api'),
            success: (request) => {
                const reports = flattenBrowseDataTreeResponse(JSON.parse(request.responseText), urlMapper);
                resolve(reports);
            },
            failure: (request: XMLHttpRequest) => reject(request),
        });
    });
}
