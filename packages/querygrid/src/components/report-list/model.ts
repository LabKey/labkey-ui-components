/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { AppURL } from '@glass/base';
import { IDataViewInfo } from '../../models';

export type ReportURLMapper = (report: IDataViewInfo) => AppURL

/**
 * FlattenResponse converts the repsonse body (a nested tree structure) from browseDataTree into a flat list of
 * ReportItem objects. This method purposely ignores categories and their nested structures.
 *
 * @param response: the body from the browseDataTree API Action
 * @param urlMapper: ReportURLMapper
 */
export function flattenBrowseDataTreeResponse(response: any, urlMapper: ReportURLMapper): Array<IDataViewInfo> {
    function _flattenBrowseDataTreeResponse(all, item): Array<IDataViewInfo> {
        if (item.hasOwnProperty('children')) {
            return [...all, ...item.children.reduce(_flattenBrowseDataTreeResponse, [])] as Array<IDataViewInfo>;
        } else {
            const appUrl = urlMapper(item);

            if (appUrl !== item.runUrl) {
                item.appUrl = appUrl;
            }

            return [...all, item];
        }
    }

    return _flattenBrowseDataTreeResponse([], response);
}
