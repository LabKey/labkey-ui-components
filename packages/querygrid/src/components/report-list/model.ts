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

export enum ReportTypes {
    Query = 'Query',
    Dataset = 'Dataset',
    XYScatterPlot = 'XY Scatter Plot',
    BarChart = 'Bar Chart',
    PieChart = 'Pie Chart',
    XYSeriesLinePlot = 'XY Series Line Plot',
    BoxAndWhiskerPlot = 'Box and Whisker Plot',
    AutomaticPlot = 'Automatic Plot',
    TimeChart = 'Time Chart',
    CrosstabReport = 'Crosstab Report',
    RReport = 'R Report',
    ParticipantReport = 'Participant Report',
}

/**
 * IReportItem is a type based on the leaf nodes returned from the browseDataTree API. I purposely left off many other
 * fields that are returned from the API because we simply don't need them right now, possibly ever.
 */
export interface IReportItem {
    name: string,
    description?: string,
    detailsUrl: string,
    runUrl: string, // This comes directly from the API response and is a link to LK Server
    appUrl?: AppURL, // This is a URL generated from a URLResolver from the runURL
    type: ReportTypes,
    visible: boolean,
    id: string, // This is actually a uuid from the looks of it, should we be more strict on the type here?
    created?: Date,
    modified: Date,
    createdBy?: string,
    modifiedBy?: string,
    thumbnail: string, // This is actually a URL, do we enforce that?
    icon: string,
    iconCls: string,
    schemaName?: string,
    queryName?: string,
    viewName?: string,
}

export type ReportURLMapper = (report: IReportItem) => AppURL

/**
 * FlattenResponse converts the repsonse body (a nested tree structure) from browseDataTree into a flat list of
 * ReportItem objects. This method purposely ignores categories and their nested structures.
 *
 * @param response: the body from the browseDataTree API Action
 * @param urlMapper: ReportURLMapper
 */
export function flattenBrowseDataTreeResponse(response: any, urlMapper: ReportURLMapper): Array<IReportItem> {
    function _flattenBrowseDataTreeResponse(all, item): Array<IReportItem> {
        if (item.hasOwnProperty('children')) {
            return [...all, ...item.children.reduce(_flattenBrowseDataTreeResponse, [])] as Array<IReportItem>;
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
