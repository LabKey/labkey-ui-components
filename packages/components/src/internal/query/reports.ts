/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ActionURL } from '@labkey/api';

import { IDataViewInfo } from '../DataViewInfo';
import { AppURL } from '../url/AppURL';
import { request } from '../request';

export type ReportURLMapper = (report: IDataViewInfo) => AppURL;

/**
 * FlattenResponse converts the response body (a nested tree structure) from browseDataTree into a flat list of
 * ReportItem objects. This method purposely ignores categories and their nested structures.
 *
 * @param response the body from the browseDataTree API Action
 * @param urlMapper ReportURLMapper
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

export async function loadReports(urlMapper?: ReportURLMapper): Promise<IDataViewInfo[]> {
    const result = await request({
        url: ActionURL.buildURL('reports', 'browseDataTree.api'),
        errorLogMsg: 'Failed to load reports',
    });

    return flattenBrowseDataTreeResponse(result, urlMapper);
}
