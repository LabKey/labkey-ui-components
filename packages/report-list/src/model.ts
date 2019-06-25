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
/**
 * IReportItem is a type based on the leaf nodes returned from the browseDataTree API. I purposely left off many other
 * fields that are returned from the API because we simply don't need them right now, possibly ever.
 */
export interface IReportItem {
    name: string,
    description?: string,
    detailsUrl: string,
    runUrl: string,
    type: string,
    visible: boolean,
    id: string, // This is actually a uuid from the looks of it, should we be more strict on the type here?
    created?: Date,
    modified: Date,
    createdBy?: string,
    modifiedBy?: string,
    thumbnail: string, // This is actually a URL, do we enforce that?
    icon: string,
    iconCls: string,
}

function _flattenApiResponse(all, item) {
    if (item.hasOwnProperty('children')) {
        return [...all, ...item.children.reduce(_flattenApiResponse, [])];
    } else {
        return [...all, item];
    }
}

/**
 * FlattenResponse converts the repsonse body (a nested tree structure) from browseDataTree into a flat list of
 * ReportItem objects. This method purposely ignores categories and their nested structures.
 *
 * @param response: the body from the browseDataTree API Action
 */
export function flattenApiResponse(response): Array<IReportItem> {
    return _flattenApiResponse([], response);
}
