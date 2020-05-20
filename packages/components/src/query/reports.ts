import { Ajax, Utils } from '@labkey/api';

import { IDataViewInfo } from '../models';
import { AppURL, buildURL } from '..';

export type ReportURLMapper = (report: IDataViewInfo) => AppURL;

/**
 * FlattenResponse converts the response body (a nested tree structure) from browseDataTree into a flat list of
 * ReportItem objects. This method purposely ignores categories and their nested structures.
 *
 * @param response: the body from the browseDataTree API Action
 * @param urlMapper: ReportURLMapper
 */
export function flattenBrowseDataTreeResponse(response: any, urlMapper?: ReportURLMapper): IDataViewInfo[] {
    function _flattenBrowseDataTreeResponse(all, item): IDataViewInfo[] {
        if (item.hasOwnProperty('children')) {
            return [...all, ...item.children.reduce(_flattenBrowseDataTreeResponse, [])] as IDataViewInfo[];
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

export function loadReports(urlMapper?: ReportURLMapper): Promise<IDataViewInfo[]> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            method: 'GET',
            url: buildURL('reports', 'browseDataTree.api'),
            success: request => {
                const reports = flattenBrowseDataTreeResponse(JSON.parse(request.responseText), urlMapper);
                resolve(reports);
            },
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }, this, true),
        });
    });
}
