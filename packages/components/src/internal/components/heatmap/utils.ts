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
import { Filter } from '@labkey/api';

import { AppURL } from '../../../url/AppURL';

export const ALL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Add one as slice extracts to, but does not include end value
const THIS_MONTH = new Date().getMonth() + 1;
// rearrange months with this month furthest to the right
const OFFSET_MONTHS = ALL_MONTHS.slice(THIS_MONTH).concat(ALL_MONTHS.slice(0, THIS_MONTH));

export function addDateRangeFilter(url: AppURL, columnName: string, dateBegin: Date, dateEnd: Date): AppURL {
    const filterStart = Filter.create(
            columnName,
            dateBegin.toISOString().substr(0, 10),
            Filter.Types.DATE_GREATER_THAN_OR_EQUAL
        ),
        filterEnd = Filter.create(
            columnName,
            dateEnd.toISOString().substr(0, 10),
            Filter.Types.DATE_LESS_THAN_OR_EQUAL
        );

    return url.addFilters(filterStart, filterEnd);
}

export function monthSort(monthOne: string, monthTwo: string): number {
    const monthOneIdx = OFFSET_MONTHS.indexOf(monthOne);
    const monthTwoIdx = OFFSET_MONTHS.indexOf(monthTwo);

    return monthOneIdx > monthTwoIdx ? 1 : monthOneIdx < monthTwoIdx ? -1 : 0;
}

type monthRec = {
    // Human readable month and year, e.g. "March 2017"
    displayValue: string;
    // 1-based month number
    month: number;
    // month short name
    monthName: string;
    year: number;
    // Sortable year and month in the format "yyyy-mm"
    yearMonth: string;
};

/**
 * Get array of month records for the last 12 months.
 * @returns {monthRec[]}
 */
export function last12Months(): monthRec[] {
    const d = new Date();
    d.setDate(1); // Issue 38807: make sure we don't skip months without a full complement of days.
    const months: monthRec[] = [];
    for (let i = 0; i < 12; i++) {
        months.push({
            month: d.getMonth() + 1,
            monthName: ALL_MONTHS[d.getMonth()],
            year: d.getFullYear(),
            yearMonth: d.getFullYear() + '-' + (d.getMonth() + 1),
            displayValue: d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        });
        d.setMonth(d.getMonth() - 1);
    }

    return months;
}
