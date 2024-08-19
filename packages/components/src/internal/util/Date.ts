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
import { format, formatDistance, isBefore, isValid, parse } from 'date-fns';
import { format as formatTz, toZonedTime } from 'date-fns-tz';
import numeral from 'numeral';
import { Container, getServerContext } from '@labkey/api';

import { QueryColumn } from '../../public/QueryColumn';

import { TIME_RANGE_URI } from '../components/domainproperties/constants';

function datePlaceholder(col: QueryColumn): string {
    let placeholder: string;

    if (col) {
        const rangeURI = col.rangeURI?.toLowerCase() ?? 'datetime';

        // attempt to use the rangeURI to figure out if we are working with a dateTime or date object
        // note Created and Modified columns do not include the rangeURI information
        if (rangeURI.indexOf('datetime') > -1) {
            placeholder = getDateFNSDateTimeFormat();
        } else if (rangeURI.indexOf('date') > -1) {
            placeholder = getDateFNSDateFormat();
        } else if (rangeURI === TIME_RANGE_URI.toLowerCase()) {
            placeholder = getDateFNSTimeFormat();
        } else {
            placeholder = getDateFNSDateTimeFormat();
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

export function getPickerDateAndTimeFormat(
    queryColumn: QueryColumn,
    hideTime?: boolean
): { dateFormat: string; timeFormat: string } {
    const dateFormat = getColDateFormat(queryColumn, hideTime ? 'Date' : undefined, queryColumn.isDateOnlyColumn);

    const isTimeOnly = queryColumn.isTimeColumn;
    const timeFormat = hideTime
        ? undefined
        : isTimeOnly
          ? parseFNSTimeFormat(getColDateFormat(queryColumn, queryColumn?.format ?? 'Time'))
          : parseDateFNSTimeFormat(dateFormat);

    return {
        dateFormat,
        timeFormat,
    };
}

export function getFormattedStringFromDate(date: Date, queryColumn: QueryColumn, hideTime?: boolean): string {
    if (!date) return undefined;

    const isTimeOnly = queryColumn.isTimeColumn;
    const isDateOnly = queryColumn.isDateOnlyColumn || hideTime;

    const rawType = isTimeOnly ? 'Time' : isDateOnly ? 'Date' : 'DateTime';
    const formatStr = getColDateFormat(queryColumn, queryColumn.format ?? rawType);
    if (!formatStr) {
        return getJsonFormatString(date, rawType);
    }

    try {
        return format(date, toDateFNSFormatString(formatStr));
    } catch (e) {
        return getJsonFormatString(date, rawType);
    }
}

export function getColDateFormat(queryColumn: QueryColumn, dateFormat?: string, dateOnly?: boolean): string {
    let rawFormat = dateFormat || queryColumn?.format;
    if (!rawFormat) {
        if (dateOnly) rawFormat = getDateFNSDateFormat();
        else rawFormat = datePlaceholder(queryColumn);
    }

    // Issue 44011: account for the shortcut values (i.e. "Date", "DateTime", and "Time")
    if (rawFormat === 'Date') rawFormat = getDateFNSDateFormat();
    if (rawFormat === 'DateTime') rawFormat = getDateFNSDateTimeFormat();
    if (rawFormat === 'Time') rawFormat = getDateFNSTimeFormat();

    return toDateFNSFormatString(rawFormat);
}

export function parseFNSTimeFormat(timePart: string): string {
    if (!timePart || timePart.indexOf(':') == -1) return undefined;

    if (timePart.indexOf('H') > -1 || timePart.indexOf('k') > -1) {
        if (timePart.indexOf('s') > 0) return 'HH:mm:ss'; // 13:30:00
        return 'HH:mm'; // 13:30
    } else if (timePart.indexOf('h') > -1 || timePart.indexOf('K') > -1) {
        if (timePart.indexOf('s') > 0) return 'hh:mm:ss a'; // 01:30:00 PM
        return 'hh:mm a'; // 01:30 PM
    }

    return undefined;
}

// Issue 48300: Respect 12-hour vs 24-hour time display format
// This method attempts to determine if the time portion of date format is in either 12-hour or 24-hour format.
// If the time format can be determined, then it will return a constant dateFNS time format.
// NK: That said, this is a far-reaching over simplification / contrived implementation which presumes the time
// format follows the date format. For a more precise implementation we would search for time-specific portions within
// the string (or use some more grand date format parsing library utility), however, there are so many different
// formats (Java, Date-FNS, JavaScript, etc.) and a seemingly infinite number of ways to configure a date/time
// format that I've elected to just assume the second part of a space-split string that contains a ":" is the time
// format (e.g. it supports formats similar to "yyyy-MM-dd hh:mm" or "yyyy-MM-dd hh:mm a").
export function parseDateFNSTimeFormat(dateFormat: string): string {
    if (!dateFormat) return undefined;
    let splitIndex = dateFormat.indexOf(' ');

    let _format: string;
    if (splitIndex > -1) {
        const remaining = dateFormat.substring(splitIndex + 1);
        _format = parseFNSTimeFormat(remaining);
        if (!_format && remaining.indexOf(' h') > 0) {
            // yyyy MM dd hh:mm
            splitIndex = remaining.indexOf(' h');
            _format = parseFNSTimeFormat(remaining.substring(splitIndex + 1));
        }
    }

    return _format;
}

function _getColFormattedDateFilterValue(column: QueryColumn, value: string): string {
    if (!value) return value;

    let valueFull = value;
    if (typeof value === 'string' && value.match(/^\s*(\d\d\d\d)-(\d\d)-(\d\d)\s*$/)) {
        // Issue 46460: Force local timezone. In ISO format, if you provide time and Z is not present
        // in the end of string, the date will be local time zone instead of UTC time zone.
        valueFull = value + 'T00:00:00';
    }

    const date = parseDate(valueFull);
    if (!isValid(date)) return value;

    // date or datetime fields always filter by 'date' portion only
    const dateFormat = getColDateFormat(column, undefined, true);
    return formatDate(date, null, dateFormat);
}

export function getColFormattedDateFilterValue(column: QueryColumn, value: string | string[]): string | string[] {
    if (value instanceof Array) {
        return value.map(v => _getColFormattedDateFilterValue(column, v));
    }
    return _getColFormattedDateFilterValue(column, value);
}

function includesAMPM(rawValue: string): boolean {
    if (!rawValue || typeof rawValue !== 'string') return false;
    const lower = rawValue.toLowerCase();
    return lower.indexOf('am') > -1 || lower.indexOf('pm') > -1;
}

function includesSeconds(rawValue: string): boolean {
    if (!rawValue || typeof rawValue !== 'string') return false;
    return rawValue.split(':').length > 2;
}

function _getColFormattedTimeFilterValue(column: QueryColumn, value: string): string {
    if (!value) return value;

    const timeFormat = getColDateFormat(column, column?.format ?? 'Time', false);
    if (!timeFormat) return value;

    const parsed = parseTimeUsingDateFNS(value);
    if (!isValid(parsed)) return undefined;

    return format(parsed, timeFormat);
}

export function getColFormattedTimeFilterValue(column: QueryColumn, value: string | string[]): string | string[] {
    if (value instanceof Array) {
        return value.map(v => _getColFormattedTimeFilterValue(column, v));
    }
    return _getColFormattedTimeFilterValue(column, value);
}

export function parseSimpleTime(rawValue: string): Date {
    if (!rawValue) return null;
    return parseTimeUsingDateFNS(rawValue.toString());
}

type ContainerFormats = {
    dateFormat: string;
    dateTimeFormat: string;
    numberFormat: string;
    timeFormat: string;
};

function getFormats(container?: Partial<Container>): ContainerFormats {
    return (container ?? getServerContext().container).formats;
}

export function getDateFormat(container?: Partial<Container>): string {
    return getFormats(container).dateFormat;
}

export function getDateTimeFormat(container?: Partial<Container>): string {
    return getFormats(container).dateTimeFormat;
}

export function getTimeFormat(container?: Partial<Container>): string {
    return getFormats(container).timeFormat;
}

function toDateFNSFormatString(javaDateFormatString: string): string {
    // TODO: Need to check if 'Z' is still a problem
    // Issue 48608: DateFNS throws errors when formatting 'Z'
    // date-fns (or react-datepicker's usage of date-fns) throws errors when 'Z' is part of the format.
    // Even though 'z' is declared part of the date-fns format it does not work either.
    // Thus, falling back to 'xxx' as the most appropriate match.
    // https://github.com/date-fns/date-fns/issues/1857
    // See https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
    return javaDateFormatString
        ?.replace('YYYY', 'yyyy') // 0044, 0001, 1900, 2017
        .replace('YY', 'yy') // 44, 01, 00, 17
        .replace('DD', 'dd') // 01, 02, ..., 31
        .replace('A', 'a')
        .replace(/Z+/gi, 'xxx'); // -08:00, +05:30, +00:00
}

// Issue 30834: get look and feel display formats
export function getDateFNSDateFormat(container?: Partial<Container>): string {
    return toDateFNSFormatString(getDateFormat(container));
}

export function getDateFNSDateTimeFormat(container?: Partial<Container>): string {
    return toDateFNSFormatString(getDateTimeFormat(container));
}

// hard-coded value, see docs: https://www.labkey.org/Documentation/Archive/21.7/wiki-page.view?name=studyDateNumber#short
export function getDateFNSTimeFormat(container?: Partial<Container>): string {
    return toDateFNSFormatString(getTimeFormat(container)) ?? 'HH:mm:ss';
}

export function fromDate(date: Date, baseDate: Date, addSuffix = true): string {
    return formatDistance(date, baseDate, { addSuffix });
}

export function fromNow(date: Date, addSuffix = true): string {
    return fromDate(date, new Date(), addSuffix);
}

export function parseDate(
    dateValue: Date | string | number,
    dateFormat?: string,
    minDate?: Date,
    timeOnly?: boolean,
    dateOnly?: boolean
): Date {
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'number') return new Date(dateValue);
    if (typeof dateValue !== 'string') return null;

    let validDate: Date;
    if (dateFormat) {
        const _dateFormat = toDateFNSFormatString(dateFormat);
        const date = safeParse(dateValue, _dateFormat, new Date());

        if (isValid(date)) {
            validDate = date;
        }
    }

    // Issue 45140: If we failed to parse from a dateFormat or a dateFormat was not provided,
    // then try the default container format.
    if (!validDate) {
        let date: Date;
        if (timeOnly) {
            date = safeParse(dateValue, getDateFNSTimeFormat(), new Date());
        } else if (dateOnly) {
            date = safeParse(dateValue, getDateFNSDateFormat(), new Date());
        } else {
            date = safeParse(dateValue, getDateFNSDateTimeFormat(), new Date());
            if (!isValid(date)) {
                date = safeParse(dateValue, getDateFNSDateFormat(), new Date());
            }
        }

        if (isValid(date)) {
            validDate = date;
        } else {
            // date-fns does not provide a format-speculative parse() function.
            // Recommendation is to fall back to new Date() / Date.parse().
            // See https://github.com/orgs/date-fns/discussions/2231
            date = new Date(dateValue);

            if (isValid(date)) {
                validDate = date;
            }
        }
    }

    // Issue 46767: DatePicker valid dates start at year 1000 (i.e. new Date('1000-01-01'))
    if (validDate && minDate && isBefore(validDate, minDate)) {
        return null;
    }

    return validDate ? validDate : null;
}

function parseTimeUsingDateFNS(value: string): Date {
    let valueFormat = includesSeconds(value) ? 'HH:mm:ss' : 'HH:mm';
    if (includesAMPM(value)) {
        valueFormat = valueFormat.replace('HH', 'hh');
        valueFormat += ' a';
    }

    // https://stackoverflow.com/a/68727535
    return safeParse(value, valueFormat, new Date());
}

function safeParse(dateStr: string, formatStr: string, referenceDate: number | Date, options?: any): Date {
    try {
        return parse(dateStr, formatStr, referenceDate, options);
    } catch (e) {
        // It is possible for date-fns to throw when parsing. Treat this as an invalid date / format.
        return undefined;
    }
}

function _formatDate(date: Date | number, dateFormat: string, timezone?: string): string {
    if (!date) return undefined;
    const _dateFormat = toDateFNSFormatString(dateFormat);
    if (timezone) {
        return formatTz(toZonedTime(date, timezone), _dateFormat, { timeZone: timezone });
    }
    return format(date, _dateFormat);
}

export function formatDate(date: Date | number, timezone?: string, dateFormat?: string): string {
    return _formatDate(date, dateFormat ?? getDateFNSDateFormat(), timezone);
}

export function formatDateTime(date: Date | number, timezone?: string, dateFormat?: string): string {
    return _formatDate(date, dateFormat ?? getDateFNSDateTimeFormat(), timezone);
}

export function getUnFormattedNumber(n): number {
    return n ? numeral(n).value() : n;
}

// Issue 44398: see DateUtil.java getJsonDateTimeFormatString(), this function is to match the format, which is
// provided by the LabKey server for the API response, from a JS Date object
export function getJsonDateTimeFormatString(date: Date): string {
    return _formatDate(date, 'YYYY-MM-dd HH:mm:ss');
}

export function getJsonTimeFormatString(date: Date): string {
    return _formatDate(date, 'YYYY-MM-dd HH:mm:ss')?.split(' ')[1];
}

export function getJsonDateFormatString(date: Date): string {
    return _formatDate(date, 'YYYY-MM-dd');
}

export function getJsonFormatString(date: Date, rawFormat: string): string {
    if (!date) return undefined;
    if (rawFormat === 'DateTime') return getJsonDateTimeFormatString(date);
    if (rawFormat === 'Time') return getJsonTimeFormatString(date);
    return getJsonDateFormatString(date);
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
export function filterDate(date: Date, start: Date, end: Date): boolean {
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

// return true if the dateStr has a date that's before today
export function isDateInPast(dateStr: string): boolean {
    if (!dateStr) return false;

    const currentDate = new Date();
    const currentDateStart = currentDate.setUTCHours(0, 0, 0, 0);

    const date = new Date(dateStr);
    return date.getTime() < currentDateStart;
}

// return true if the dateTimeStr has a timestamp that's before now
export function isDateTimeInPast(dateTimeStr: string): boolean {
    if (!dateTimeStr) return false;

    return new Date(dateTimeStr).getTime() <= new Date().getTime();
}
