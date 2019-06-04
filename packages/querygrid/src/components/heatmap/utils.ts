/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter } from '@labkey/api'
import { AppURL } from '@glass/base'

export const ALL_MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Add one as slice extracts to, but does not include end value
const THIS_MONTH = new Date().getMonth() + 1;
// rearrange months with this month furthest to the right
const OFFSET_MONTHS = (ALL_MONTHS.slice(THIS_MONTH)).concat(ALL_MONTHS.slice(0, THIS_MONTH));

export function addDateRangeFilter(url: AppURL, columnName: string, dateBegin: Date, dateEnd: Date): AppURL {
    const filterStart = Filter.create(columnName, dateBegin.toISOString().substr(0, 10), Filter.Types.DATE_GREATER_THAN_OR_EQUAL),
        filterEnd = Filter.create(columnName, dateEnd.toISOString().substr(0, 10), Filter.Types.DATE_LESS_THAN_OR_EQUAL);

    return url.addFilters(filterStart, filterEnd);
}

export function monthSort(monthOne: string, monthTwo: string): number {
    const monthOneIdx = OFFSET_MONTHS.indexOf(monthOne);
    const monthTwoIdx = OFFSET_MONTHS.indexOf(monthTwo);

    return monthOneIdx > monthTwoIdx ? 1 : (monthOneIdx < monthTwoIdx ? -1 : 0);
}

type monthRec = {
    // Human readable month and year, e.g. "March 2017"
    displayValue: string
    // 1-based month number
    month: number
    // month short name
    monthName: string
    year: number
    // Sortable year and month in the format "yyyy-mm"
    yearMonth: string
};

/**
 * Get array of month records for the last 12 months.
 * @returns {monthRec[]}
 */
export function last12Months(): monthRec[] {
    const d = new Date();
    const months: monthRec[] = [];
    for (let i = 0; i < 12; i++) {
        months.push({
            month: d.getMonth() + 1,
            monthName: ALL_MONTHS[d.getMonth()],
            year: d.getFullYear(),
            yearMonth: d.getFullYear() + "-" + (d.getMonth()+1),
            displayValue: d.toLocaleDateString('en-US', {year: 'numeric', month: 'long'}),
        });
        d.setMonth(d.getMonth() - 1);
    }

    return months;
}