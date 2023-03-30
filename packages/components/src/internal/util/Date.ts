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
import moment from 'moment';
import momentTZ from 'moment-timezone';
import numeral from 'numeral';
import { Container, getServerContext } from '@labkey/api';

import { QueryColumn } from '../../public/QueryColumn';

import { formatWithJDF, toMomentFormatString } from './jDateFormatParser';

export function datePlaceholder(col: QueryColumn): string {
    let placeholder;

    if (col) {
        const rangeURI = col.rangeURI?.toLowerCase() ?? 'datetime';

        // attempt to use the rangeURI to figure out if we are working with a dateTime or date object
        // note Created and Modified columns do not include the rangeURI information
        if (rangeURI.indexOf('datetime') > -1) {
            placeholder = getMomentDateTimeFormat();
        } else if (rangeURI.indexOf('date') > -1) {
            placeholder = getMomentDateFormat();
        } else {
            placeholder = getMomentDateTimeFormat();
        }
    }

    return placeholder;
}

export function isDateTimeCol(col: QueryColumn): boolean {
    if (col) {
        const rangeURI = col.rangeURI?.toLowerCase();

        // attempt to use the rangeURI to figure out if we are working with a dateTime or date object
        // note Created and Modified columns do not include the rangeURI information
        if (rangeURI?.indexOf('datetime') > -1) {
            return true;
        }

        // material.materialexpdate is a non domain property datetime field that doesn't have rangeURI, but should be treated as datetime
        if (!rangeURI && col?.jsonType === 'date' && col?.name.toLowerCase() === 'materialexpdate') {
            return true;
        }
    }

    return false;
}

export function getColDateFormat(queryColumn: QueryColumn, dateFormat?: string, dateOnly?: boolean): string {
    let rawFormat = dateFormat || queryColumn.format;
    if (!rawFormat) {
        if (dateOnly) rawFormat = getMomentDateFormat();
        else rawFormat = datePlaceholder(queryColumn);
    }

    // Issue 44011: account for the shortcut values (i.e. "Date", "DateTime", and "Time")
    if (rawFormat === 'Date') rawFormat = getMomentDateFormat();
    if (rawFormat === 'DateTime') rawFormat = getMomentDateTimeFormat();
    if (rawFormat === 'Time') rawFormat = getTimeFormat();

    // Moment.js and react datepicker date format is different
    // https://github.com/Hacker0x01/react-datepicker/issues/1609
    return rawFormat.replace('YYYY', 'yyyy').replace('YY', 'yy').replace('DD', 'dd');
}

export function getColFormattedDateFilterValue(column: QueryColumn, value: string | Date): string {
    let valueFull = value;
    if (value && typeof value === 'string' && value.match(/^\s*(\d\d\d\d)-(\d\d)-(\d\d)\s*$/)) {
        valueFull = value + 'T00:00:00'; // Force local timezone. In ISO format, if you provide time and Z is not present in the end of string, the date will be local time zone instead of UTC time zone.
    }
    const dateFormat = getColDateFormat(column, null, true); // date or datetime fields always filter by 'date' portion only
    return formatDate(new Date(valueFull), null, dateFormat);
}

export function getDateFormat(container?: Partial<Container>): string {
    return (container ?? getServerContext().container).formats.dateFormat;
}

export function getDateTimeFormat(container?: Partial<Container>): string {
    return (container ?? getServerContext().container).formats.dateTimeFormat;
}

// Issue 30834: get look and feel display formats
export function getMomentDateFormat(container?: Partial<Container>): string {
    return toMomentFormatString((container ?? getServerContext().container).formats.dateFormat);
}

export function getMomentDateTimeFormat(container?: Partial<Container>): string {
    return toMomentFormatString((container ?? getServerContext().container).formats.dateTimeFormat);
}

// hard-coded value, see docs: https://www.labkey.org/Documentation/Archive/21.7/wiki-page.view?name=studyDateNumber#short
export function getTimeFormat(): string {
    return toMomentFormatString('HH:mm:ss');
}

export function parseDate(dateStr: string, dateFormat?: string, minDate?: Date): Date {
    if (!dateStr) return null;

    // Moment.js and react datepicker date format is different
    // https://github.com/Hacker0x01/react-datepicker/issues/1609
    const _dateFormat = dateFormat?.replace('yyyy', 'YYYY').replace('yy', 'YY').replace('dd', 'DD');

    let validDate;
    if (_dateFormat) {
        const date = moment(dateStr, _dateFormat, true);
        if (date && date.isValid()) {
            validDate = date;
        }
    }

    // Issue 45140: if a dateFormat was provided here and the date didn't parse, try the default container format and no format
    if (!validDate) {
        const date = moment(dateStr, getMomentDateTimeFormat(), true);
        if (date && date.isValid()) {
            validDate = date;
        }
    }

    if (!validDate) {
        const date = moment(dateStr);
        if (date && date.isValid()) {
            validDate = date;
        }
    }

    // Issue 46767: DatePicker valid dates start at year 1000 (i.e. new Date('1000-01-01'))
    if (validDate && minDate && validDate.isBefore(minDate)) {
        return null;
    }

    return validDate ? validDate.toDate() : null;
}

function _formatDate(date: Date | number, dateFormat: string, timezone?: string): string {
    if (!date) return undefined;
    let _date: moment.Moment;
    if (timezone) {
        // Unfortunately, the typings for moment-timezone are not great and as a result there
        // are collisions with the expected type of moment.Moment.
        _date = momentTZ(date).tz(timezone) as never;
    } else {
        _date = moment(date);
    }
    return formatWithJDF(_date, dateFormat);
}

export function formatDate(date: Date | number, timezone?: string, dateFormat?: string): string {
    return _formatDate(date, dateFormat ?? getMomentDateFormat(), timezone);
}

export function formatDateTime(date: Date | number, timezone?: string, dateFormat?: string): string {
    return _formatDate(date, dateFormat ?? getMomentDateTimeFormat(), timezone);
}

export function getUnFormattedNumber(n): number {
    return n ? numeral(n).value() : n;
}

// Issue 44398: see DateUtil.java getJsonDateTimeFormatString(), this function is to match the format, which is
// provided by the LabKey server for the API response, from a JS Date object
export function getJsonDateTimeFormatString(date: Date): string {
    return _formatDate(date, 'YYYY-MM-dd HH:mm:ss');
}

export function getJsonDateFormatString(date: Date): string {
    return _formatDate(date, 'YYYY-MM-dd');
}

export function generateNameWithTimestamp(name: string): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    let timeStr = date.toTimeString().split(' ')[0];
    timeStr = timeStr.replace(/:/g, '-');
    return name + '_' + dateStr + '_' + timeStr;
}

function twoDigit(num: number): string {
    if (num < 10) {
        return '0' + num;
    }
    return '' + num;
}

// From a current date string, get the next N date string
// example, from "2022-02-02", get next 1 day, return "2022-02-03"
// example, from "2022-02-02", get next -1 day, return "2022-02-01"
export function getNextDateStr(currentDateStr: string, ndays?: number): string {
    const numberOfDays = ndays ?? 1;
    const seedDate = new Date(currentDateStr);
    let nextDate = new Date(seedDate.getTime() + 60 * 60 * 24 * 1000 * numberOfDays); // add N*24 hours

    const userTimezoneOffset = nextDate.getTimezoneOffset() * 60 * 1000;
    nextDate = new Date(nextDate.getTime() + userTimezoneOffset);

    const year = nextDate.getFullYear();
    const month = nextDate.getMonth() + 1;
    const day = nextDate.getDate();

    return '' + year + '-' + twoDigit(month) + '-' + twoDigit(day);
}

export function getNDaysStrFromToday(ndays?: number): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const todayStr = '' + year + '-' + twoDigit(month) + '-' + twoDigit(day);
    return getNextDateStr(todayStr, ndays);
}

// TODO add jest
export function filterDate(date: Date, start: Date, end: Date) {
    const dateOnly = new Date(date.getTime());
    dateOnly.setHours(0, 0, 0, 0);

    if (start == null && end == null) return true;

    if (start != null && end == null) return dateOnly >= start;

    if (start == null && end != null) return dateOnly <= end;

    return dateOnly >= start && dateOnly <= end;
}

const RELATIVE_DAYS_REGEX = /^[+-]\d+d$/;
export function isRelativeDateFilterValue(val: string): boolean {
    if (!val == null) return false;

    if (typeof val !== 'string') return false;

    return RELATIVE_DAYS_REGEX.test(val);
}

export function getParsedRelativeDateStr(dateVal: string): { days: number; positive: boolean } {
    if (!isRelativeDateFilterValue(dateVal)) return null;

    let positive = true;
    if (dateVal.indexOf('-') === 0) positive = false;
    const daysStr = dateVal.replace('-', '').replace('+', '').replace('d', '');
    const days = parseInt(daysStr);
    return {
        positive,
        days,
    };
}
