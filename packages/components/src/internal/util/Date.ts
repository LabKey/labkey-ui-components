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
import { addDays, format, formatDistance, isBefore, isValid, parse } from 'date-fns';
import { format as formatTz, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { Container, getServerContext } from '@labkey/api';

import { QueryColumn } from '../../public/QueryColumn';

import { TIME_RANGE_URI } from '../components/domainproperties/constants';
import { SelectInputOption } from '../components/forms/input/SelectInput';

// These constants align with the formats declared in DateUtil.java
export const ISO_DATE_FORMAT_STRING = 'yyyy-MM-dd';
const ISO_SHORT_TIME_FORMAT_STRING = 'HH:mm';
const ISO_TIME_FORMAT_STRING = 'HH:mm:ss';
const ISO_LONG_TIME_FORMAT_STRING = 'HH:mm:ss.SSS';
export const ISO_DATE_TIME_FORMAT_STRING = `${ISO_DATE_FORMAT_STRING} ${ISO_LONG_TIME_FORMAT_STRING}`;

const STANDARD_DATE_DISPLAY_FORMATS = [
    'yyyy-MM-dd',
    'yyyy-MMM-dd',
    'yyyy-MM',
    'dd-MM-yyyy',
    'dd-MMM-yyyy',
    'dd-MMM-yy',
    'ddMMMyyyy',
    'ddMMMyy',
    'MM/dd/yyyy',
    'MM-dd-yyyy',
    'MMMM dd yyyy',
];

const STANDARD_TIME_DISPLAY_FORMATS = ['HH:mm:ss', 'HH:mm', 'HH:mm:ss.SSS', 'hh:mm a'];

const FIELD_ALT_DATETIME_FORMATS = ['date', 'datetime', 'time'];

const MISSING_FORMAT_DISPLAY = '<none>';

// Intended to match against ISO_DATE_FORMAT_STRING
const ISO_DATE_FORMAT_REGEX = /^\s*(\d\d\d\d)-(\d\d)-(\d\d)\s*$/;

export enum DateFormatType {
    Date = 'Date',
    DateTime = 'DateTime',
    Time = 'Time',
}

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

function _toAmPm(rawTimeFormat: string, toAMPM: boolean): string {
    if (!toAMPM) return rawTimeFormat;

    if (rawTimeFormat.indexOf(' a') > -1) return rawTimeFormat;

    return rawTimeFormat.replace('HH', 'hh') + ' a';
}

export function getPickerTimeFormatWithPrecision(
    timeFormat: string,
    showMinute?: boolean,
    showSeconds?: boolean,
    showMilliSeconds?: boolean
): string {
    if (!timeFormat) return '';

    const useAmPm = timeFormat.indexOf(' a') > -1;
    if (timeFormat.indexOf('.SSS') > -1) return timeFormat;

    if (showMilliSeconds) return _toAmPm(ISO_LONG_TIME_FORMAT_STRING, useAmPm);

    if (timeFormat.indexOf(':ss') > -1) return timeFormat;

    if (showSeconds) return _toAmPm(ISO_TIME_FORMAT_STRING, useAmPm);

    if (timeFormat.indexOf(':mm') > -1) return timeFormat;

    if (showMinute) return _toAmPm(ISO_SHORT_TIME_FORMAT_STRING, useAmPm);

    return timeFormat;
}

/**
 * This method is takes a date format, and adds additional precision to it as necessary:
 *  'yyyy-MM-dd HH:mm' -> 'yyyy-MM-dd HH:mm:ss' if showSeconds is true and showMilliSeconds is false
 *  'yyyy-MM-dd hh:mm a' -> 'yyyy-MM-dd hh:mm:ss.SSS a' if showSeconds is true and showMilliSeconds is true
 */
export function getPickerFormatWithPrecision(
    rawDateTimeFormat: string,
    showMinute?: boolean,
    showSeconds?: boolean,
    showMilliSeconds?: boolean
): string {
    const parts = splitDateTimeFormat(rawDateTimeFormat);
    if (parts.length === 1) return parts[0];
    if (!parts[1]) return parts[0];
    return (
        parts[0] +
        ' ' +
        getPickerTimeFormatWithPrecision(parts[1], showMinute, showSeconds, showMilliSeconds)
    ).trim();
}

/**
 * Given a QueryColumn and an initDate value this method will return a date and time format. By default, we will return
 * the date/time format from the QueryColumn, however, in some cases we may return a date/time format that has higher
 * precision (see getPickerFormatWithPrecision above).
 *
 * Changing the precision of a date or time format is necessary for a few reasons:
 *  - LabKey uses date formats for display reasons only, we actually always store fully precise dates and times
 *  - We want to allow users to enter very precise dates and times if needed, and if they do enter a very precise date
 *  then we want to render what they entered, so they do not falsely believe that we are truncating their data
 *  - If the user enters a date/time that matches the existing format, we want to display it in that format, in order
 *  to reduce visual clutter (react-datepicker looks worse when using highly precise date formats)
 *  - react-datepicker uses date formats as display and value formats, if you pass a strict date format it will only
 *  give you values that match the format, it will truncate more precise values entered by users, which is a data
 *  integrity problem (See Issue 52820).
 */
export function getPickerDateAndTimeFormat(
    column: QueryColumn,
    hideTime?: boolean,
    initDate?: Date
): { dateFormat: string; timeFormat: string } {
    const hasMsPrecision = initDate?.getMilliseconds() > 0;
    const hasSecondsPrecision = hasMsPrecision || initDate?.getSeconds() > 0;
    const hasMinutePrecision = hasSecondsPrecision || initDate?.getMinutes() > 0 || initDate?.getHours() > 0;

    const dateFormat_ = getColDateFormat(column, hideTime ? DateFormatType.Date : undefined, column.isDateOnlyColumn);
    let dateFormat =
        column.isTimeColumn || column.isDateOnlyColumn
            ? dateFormat_
            : getPickerFormatWithPrecision(dateFormat_, hasMinutePrecision, hasSecondsPrecision, hasMsPrecision);
    let timeFormat: string;
    if (!hideTime) {
        if (column.isTimeColumn) {
            timeFormat = parseFNSTimeFormat(getColDateFormat(column, column?.format ?? DateFormatType.Time));
            timeFormat = getPickerTimeFormatWithPrecision(
                timeFormat,
                hasMinutePrecision,
                hasSecondsPrecision,
                hasMsPrecision
            );
            dateFormat = timeFormat;
        } else {
            timeFormat = parseDateFNSTimeFormat(dateFormat);
        }
    }

    return { dateFormat, timeFormat };
}

export function getDateFromISO(
    value: string,
    queryColumn: QueryColumn,
    allowRelativeInput?: boolean,
    minDate?: Date
): Date {
    if (!value || (allowRelativeInput && isRelativeDateFilterValue(value))) return undefined;

    if (queryColumn.isTimeColumn) {
        return parseTime(value);
    }

    return parseDate(value, undefined, minDate, false, queryColumn.isDateOnlyColumn);
}

export function getDateTimeDisplayValue(date: Date, queryColumn: QueryColumn): string {
    const { dateFormat, timeFormat } = getPickerDateAndTimeFormat(queryColumn, false, date);
    if (queryColumn.isTimeColumn) return formatTime(date, timeFormat);
    if (queryColumn.isDateOnlyColumn) return formatDate(date, null, dateFormat);
    return formatDateTime(date, null, dateFormat);
}

export function getDateTimeDisplayValueFromStr(isoValue: string, queryColumn: QueryColumn): string {
    if (!isoValue || typeof isoValue !== 'string') return null;
    const date = getDateFromISO(isoValue, queryColumn);
    return getDateTimeDisplayValue(date, queryColumn);
}

export function getColDateFormat(column: QueryColumn, dateFormat?: string, dateOnly?: boolean): string {
    let rawFormat = dateFormat || column?.format;
    if (!rawFormat) {
        if (dateOnly) rawFormat = getDateFNSDateFormat();
        else rawFormat = datePlaceholder(column);
    }

    // Issue 44011: account for the shortcut values (i.e. "Date", "DateTime", and "Time")
    if (rawFormat === DateFormatType.Date) rawFormat = getDateFNSDateFormat();
    if (rawFormat === DateFormatType.DateTime) rawFormat = getDateFNSDateTimeFormat();
    if (rawFormat === DateFormatType.Time) rawFormat = getDateFNSTimeFormat();

    return toDateFNSFormatString(rawFormat);
}

export function parseFNSTimeFormat(timePart: string): string {
    if (!timePart || timePart.indexOf(':') === -1) return undefined;

    if (timePart.indexOf('H') > -1 || timePart.indexOf('k') > -1) {
        if (timePart.indexOf('.S') > 0) return 'HH:mm:ss.SSS'; // 13:30:00.000
        if (timePart.indexOf('s') > 0) return 'HH:mm:ss'; // 13:30:00
        return 'HH:mm'; // 13:30
    } else if (timePart.indexOf('h') > -1 || timePart.indexOf('K') > -1) {
        if (timePart.indexOf('.S') > 0) return 'hh:mm:ss.SSS a'; // 01:30:00.000 PM
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

    const date = parseDate(value);
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

function _getColFormattedTimeFilterValue(column: QueryColumn, value: string): string {
    if (!value) return value;

    const timeFormat = getColDateFormat(column, column?.format ?? DateFormatType.Time, false);
    if (!timeFormat) return value;

    const parsed = parseTime(value);
    if (!isValid(parsed)) return undefined;

    return format(parsed, timeFormat);
}

export function getColFormattedTimeFilterValue(column: QueryColumn, value: string | string[]): string | string[] {
    if (value instanceof Array) {
        return value.map(v => _getColFormattedTimeFilterValue(column, v));
    }
    return _getColFormattedTimeFilterValue(column, value);
}

export type ContainerFormats = {
    dateFormat: string;
    dateFormatInherited?: boolean;
    dateTimeFormat: string;
    dateTimeFormatInherited?: boolean;
    numberFormat: string;
    numberFormatInherited?: boolean;
    parentDateFormat?: string;
    parentDateTimeFormat?: string;
    parentNumberFormat?: string;
    parentTimeFormat?: string;
    timeFormat: string;
    timeFormatInherited?: boolean;
};

export function getContainerFormats(container?: Partial<Container>): ContainerFormats {
    return (container ?? getServerContext().container).formats;
}

export function getDateFormat(container?: Partial<Container>): string {
    return getContainerFormats(container).dateFormat;
}

export function getDateTimeFormat(container?: Partial<Container>): string {
    return getContainerFormats(container).dateTimeFormat;
}

export function getTimeFormat(container?: Partial<Container>): string {
    return getContainerFormats(container).timeFormat;
}

// Tested via formatDate(). Search Date.test.ts for 'toDateFNSFormatString'.
function toDateFNSFormatString(javaDateFormatString: string): string {
    // Issue 48608: DateFNS throws errors when formatting 'Z'
    // date-fns (or react-datepicker's usage of date-fns) throws errors when 'Z' is part of the format.
    // Even though 'z' is declared part of the date-fns format it does not work either.
    // Thus, falling back to 'xxx' as the most appropriate match.
    // https://github.com/date-fns/date-fns/issues/1857
    // See https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md
    return javaDateFormatString
        ?.replace('YYYY', 'yyyy') // 0044, 0001, 1900, 2017
        .replace('YY', 'yy') // 44, 01, 00, 17
        .replace('Y', 'y')
        .replace('DD', 'dd') // 01, 02, ..., 31
        .replace('D', 'd')
        .replace('A', 'a') // AM, PM (only 'a' is really supported in Java)
        .replace(/u+/gi, 'i') // 1, 2, 3, ... 7 (ISO day of week)
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
    return toDateFNSFormatString(getTimeFormat(container) ?? ISO_TIME_FORMAT_STRING);
}

export function fromDate(date: Date, baseDate: Date, addSuffix = true): string {
    return formatDistance(date, baseDate, { addSuffix });
}

export function fromNow(date: Date, addSuffix = true): string {
    return fromDate(date, new Date(), addSuffix);
}

/**
 * Attempts to parse a date value (Date | string | number) into a valid Date.
 * Will only return a valid date or null.
 */
export function parseDate(
    dateValue: Date | number | string,
    dateFormat?: string,
    minDate?: Date,
    timeOnly?: boolean,
    dateOnly?: boolean
): Date {
    if (dateValue instanceof Date) {
        return isValid(dateValue) ? dateValue : null;
    }
    if (typeof dateValue === 'number') {
        const date = new Date(dateValue);
        return isValid(date) ? date : null;
    }
    if (typeof dateValue !== 'string') return null;

    let strictMode = false,
        validDate: Date;
    if (dateFormat) {
        const _dateFormat = toDateFNSFormatString(dateFormat);
        const date = safeParse(dateValue, _dateFormat, new Date());

        if (isValid(date)) {
            validDate = date;
        } else {
            const altFormats = getAltParseFormats(dateFormat, dateValue);
            strictMode = altFormats.length > 1;
            for (const altFormat of altFormats) {
                const _altFormat = toDateFNSFormatString(altFormat);
                const altDate = safeParse(dateValue, _altFormat, new Date());
                if (isValid(altDate)) {
                    validDate = altDate;
                    break;
                }
            }
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
            // Issue 46460: Force local timezone. In ISO format, if you provide time and Z is not present
            // in the end of string, then the date will be local time zone instead of UTC time zone.
            if (dateValue.match(ISO_DATE_FORMAT_REGEX)) {
                dateValue = dateValue + 'T00:00:00';
            }

            // date-fns does not provide a format-speculative parse() function.
            // Recommendation is to fall back to new Date() / Date.parse().
            // See https://github.com/orgs/date-fns/discussions/2231
            if (!strictMode) {
                date = new Date(dateValue);
                if (isValid(date)) {
                    validDate = date;
                }
            }
        }
    }

    // Issue 46767: DatePicker valid dates start at year 1000 (i.e. new Date('1000-01-01'))
    if (validDate && minDate && isBefore(validDate, minDate)) {
        return null;
    }

    return validDate ? validDate : null;
}

export function parseTimeParts(h: string, m?: string, s?: string, ms?: string, period?: string): Date {
    if (!h) return null;

    const hours = parseInt(h);
    const minutes = m ? parseInt(m) : 0;
    const seconds = s ? parseInt(s) : 0;
    const milliseconds = ms ? parseInt(ms.slice(0, 3)) : 0; // truncate extra digits

    if (isNaN(hours) || hours < 0 || hours > 23) return null;

    if (period && period.toUpperCase() !== 'AM' && period.toUpperCase() !== 'PM') return null;

    // Invalid hours for AM/PM, 0 might be considered invalid as well
    if (period && (hours < 0 || hours > 12)) return null;

    if (isNaN(minutes) || minutes < 0 || minutes > 59) return null;

    if (isNaN(seconds) || seconds < 0 || seconds > 59) return null;

    if (isNaN(milliseconds) || milliseconds < 0 || milliseconds > 999) return null;

    // Convert hours for AM/PM
    const adjustedHours = period ? (hours % 12) + (period.toUpperCase() === 'PM' ? 12 : 0) : hours;

    const date = new Date();
    date.setHours(adjustedHours, minutes, seconds, milliseconds);

    return date;
}

/**
 * Attempts to parse a time value from a string. Will only return a valid date or null.
 * NOTE: This is only for time strings. This does not resolve time from date-like strings
 * with a time pre- or post-fixed to a date. You're better off using parseDate() in that case.
 */
export function parseTime(time: Date | string): Date {
    if (!time) return null;

    if (time instanceof Date) {
        if (isValid(time)) return time;
        return null;
    } else if (typeof time !== 'string') return null;

    // Format: HH(:mm(:ss(.SSS))) (AM|PM) -- (truncate extra digits)
    const timeRegex = /^(\d{1,2})(?::(\d{2})(?::(\d{2})(?:\.(\d{1,3}\d*))?)?)?(?:\s*(AM|PM))?$/i;
    const match = time.match(timeRegex);

    if (match) {
        const [, h, m, s, ms, period] = match;
        const date = parseTimeParts(h, m, s, ms, period);
        if (isValid(date)) return date;
    }

    return null;
}

function safeParse(dateStr: string, formatStr: string, referenceDate: Date | number, options?: any): Date {
    try {
        return parse(dateStr, formatStr, referenceDate, options);
    } catch (e) {
        // It is possible for date-fns to throw when parsing. Treat this as an invalid date / format.
        return undefined;
    }
}

function isStandardDateDisplayFormat(dateFormat: string): boolean {
    return STANDARD_DATE_DISPLAY_FORMATS.indexOf(dateFormat) > -1;
}

function isStandardTimeDisplayFormat(timeFormat: string): boolean {
    return STANDARD_TIME_DISPLAY_FORMATS.indexOf(timeFormat) > -1;
}

export function splitDateTimeFormat(dateTimeFormatStr: string): string[] {
    const dateTimeFormat = dateTimeFormatStr?.trim();
    if (!dateTimeFormat) return ['', ''];

    let restTimePart = '',
        standardDatePart = null;
    STANDARD_DATE_DISPLAY_FORMATS.forEach(standardDate => {
        if (dateTimeFormat.startsWith(standardDate)) {
            if (dateTimeFormat.length === standardDate.length) {
                standardDatePart = standardDate;
            } else if (dateTimeFormat[standardDate.length] === ' ') {
                standardDatePart = standardDate;
                restTimePart = dateTimeFormat.substring(standardDate.length).trim();
            }
        }
    });
    if (standardDatePart) {
        return [standardDatePart, restTimePart];
    }

    if (dateTimeFormat.indexOf(' h') > 0 || dateTimeFormat.indexOf(' H') > 0) {
        const splitInd = dateTimeFormat.indexOf(' h') > 0 ? dateTimeFormat.indexOf(' h') : dateTimeFormat.indexOf(' H');
        const date = dateTimeFormat.substring(0, splitInd).trim();
        const time = dateTimeFormat.substring(splitInd + 1).trim();
        return [date, time];
    }
    const [date, ...rest] = dateTimeFormat.split(/\s+/);
    if (!rest || rest.length === 0) return [date, ''];
    const time = rest.join(' ');
    return [date, time];
}

export const joinDateTimeFormat = (date: string, time?: string): string => {
    if (!time) return date;
    return date + ' ' + time;
};

export function getNonStandardDateTimeFormatWarning(dateTimeFormat: string): string {
    const warning = 'Non-standard date-time format.';
    if (!dateTimeFormat) return warning;
    const parts = splitDateTimeFormat(dateTimeFormat);
    if (parts.length === 1 || !parts[1]) return isStandardDateDisplayFormat(parts[0]) ? null : warning;
    else if (parts.length === 2) {
        if (!isStandardDateDisplayFormat(parts[0]) || !isStandardTimeDisplayFormat(parts[1])) return warning;
        return null;
    }
    return warning;
}

export function isValidAltDateTimeFormatOptions(format: string): boolean {
    return FIELD_ALT_DATETIME_FORMATS.indexOf(format?.toLowerCase()) > -1;
}

export function getNonStandardFormatWarning(
    formatType: DateFormatType,
    formatPattern: string,
    allowAltFormat?: boolean
): string {
    if (allowAltFormat && isValidAltDateTimeFormatOptions(formatPattern)) return null;

    switch (formatType) {
        case DateFormatType.Date:
            return isStandardDateDisplayFormat(formatPattern) ? null : 'Non-standard date format.';
        case DateFormatType.DateTime:
            return getNonStandardDateTimeFormatWarning(formatPattern);
        case DateFormatType.Time:
            return isStandardTimeDisplayFormat(formatPattern) ? null : 'Non-standard time format.';
    }
    return null;
}

export function getDateTimeInputOptions(
    timezone?: string,
    date?: Date
): { dateOptions: SelectInputOption[]; optionalTimeOptions: SelectInputOption[]; timeOptions: SelectInputOption[] } {
    const date_ = date ?? new Date();

    const dateOptions = [];
    STANDARD_DATE_DISPLAY_FORMATS.forEach(format => {
        const example = _formatDate(date_, format, timezone);
        dateOptions.push({
            value: format,
            label: format + ' (' + example + ')',
        });
    });

    const dateFormat = STANDARD_DATE_DISPLAY_FORMATS[0];
    const timeOptions: SelectInputOption[] = [];
    STANDARD_TIME_DISPLAY_FORMATS.forEach(timeFormat => {
        const dateTime = _formatDate(date_, dateFormat + ' ' + timeFormat, timezone);
        const parts = splitDateTimeFormat(dateTime);
        const example = parts[1];
        timeOptions.push({
            value: timeFormat,
            label: timeFormat + ' (' + example + ')',
        });
    });

    const optionalTimeOptions = [
        {
            value: '',
            label: MISSING_FORMAT_DISPLAY,
        },
        ...timeOptions,
    ];

    return {
        dateOptions,
        timeOptions,
        optionalTimeOptions,
    };
}

export interface DateTimeSettingProp {
    dateFormat: string;
    dateOptions: SelectInputOption[];
    formatType: DateFormatType;
    inherited: boolean;
    invalidWarning: string;
    isDate: boolean;
    isTime: boolean;
    isTimeRequired: boolean;
    parentFormat: string;
    placeholder?: string;
    settingName: string;
    timeFormat: string;
    timeOptions: SelectInputOption[];
}

export const getDateTimeSettingFormat = (setting: DateTimeSettingProp, checkInherited?: boolean): string => {
    const { formatType, dateFormat, timeFormat, inherited } = setting;
    if (!checkInherited && inherited) return null;
    return formatType === DateFormatType.DateTime
        ? joinDateTimeFormat(dateFormat, timeFormat)
        : formatType === DateFormatType.Date
          ? dateFormat
          : timeFormat;
};

export const getDateTimeSettingWarning = (setting: DateTimeSettingProp, allowAltFormat?: boolean): string => {
    const { formatType } = setting;
    return getNonStandardFormatWarning(formatType, getDateTimeSettingFormat(setting, true), allowAltFormat);
};

function _formatDate(date: Date | number | string, dateFormat: string, timezone?: string): string {
    const date_ = parseDate(date);
    if (!date_) return undefined;

    const _dateFormat = toDateFNSFormatString(dateFormat);
    if (timezone) {
        return formatTz(toZonedTime(date, timezone), _dateFormat, { timeZone: timezone });
    }
    return format(date_, _dateFormat);
}

export function formatDate(date: Date | number | string, timezone?: string, dateFormat?: string): string {
    return _formatDate(date, dateFormat ?? getDateFNSDateFormat(), timezone);
}

export function formatDateTime(date: Date | number | string, timezone?: string, dateFormat?: string): string {
    return _formatDate(date, dateFormat ?? getDateFNSDateTimeFormat(), timezone);
}

export function formatTime(timeValue: Date | string, timeFormat?: string): string {
    const timeObj = parseTime(timeValue);
    if (!timeObj) return undefined;
    const _timeFormat = toDateFNSFormatString(timeFormat ?? getDateFNSTimeFormat());
    return format(timeObj, _timeFormat);
}

// Issue 44398: see DateUtil.java getJsonDateTimeFormatString(), this function is to match the format, which is
// provided by the LabKey server for the API response, from a JS Date object
export function getJsonDateTimeFormatString(date: Date | number | string): string {
    return _formatDate(date, ISO_DATE_TIME_FORMAT_STRING);
}

export function getJsonTimeFormatString(date: Date | number | string): string {
    return _formatDate(date, ISO_LONG_TIME_FORMAT_STRING);
}

export function getJsonDateFormatString(date: Date | number | string): string {
    return _formatDate(date, ISO_DATE_FORMAT_STRING);
}

export function getJsonFormatString(date: Date | number | string, rawFormat: string): string {
    if (!isValid(date)) return undefined;
    if (rawFormat === DateFormatType.DateTime) return getJsonDateTimeFormatString(date);
    if (rawFormat === DateFormatType.Time) return getJsonTimeFormatString(date);
    return getJsonDateFormatString(date);
}

export function generateNameWithTimestamp(name: string): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    let timeStr = date.toTimeString().split(' ')[0];
    timeStr = timeStr.replace(/:/g, '-');
    return name + '_' + dateStr + '_' + timeStr;
}

// From a current date string, get the next N date string
// example, from "2022-02-02", get next 1 day, return "2022-02-03"
// example, from "2022-02-02", get next -1 day, return "2022-02-01"
export function getNextDateStr(date: Date | number | string, numberOfDays = 1): string {
    const seedDate = parseDate(date);
    if (!isValid(seedDate)) return undefined;

    const nextDate = addDays(seedDate, numberOfDays);
    return _formatDate(nextDate, ISO_DATE_FORMAT_STRING);
}

export function getNDaysStrFromToday(numberOfDays?: number): string {
    return getNextDateStr(new Date(), numberOfDays);
}

/**
 * Determines if the date is within the start/end date interval. If only the start or only the end of the
 * interval are given, then it returns a comparison against only the given part of the interval.
 * @param date The date to check.
 * @param start The start of the interval.
 * @param end The end of the interval.
 * @param dateOnlyComparison If true, then the date to check will be zeroed out to the beginning
 * of the day (midnight) for comparison. Defaults to false.
 */
export function isDateBetween(date: Date, start: Date, end: Date, dateOnlyComparison = false): boolean {
    if (!isValid(date)) return false;

    const isEndValid = isValid(end);
    const isStartValid = isValid(start);
    if (!isStartValid && !isEndValid) return true;

    const date_ = new Date(date.getTime());
    if (dateOnlyComparison) {
        date_.setHours(0, 0, 0, 0);
    }
    const time = date_.getTime();

    if (isStartValid && !isEndValid) return time >= start.getTime();
    if (!isStartValid && isEndValid) return time <= end.getTime();

    return time >= start.getTime() && time <= end.getTime();
}

const RELATIVE_DAYS_REGEX = /^[+-]\d+d$/;
export function isRelativeDateFilterValue(val: string): boolean {
    return typeof val === 'string' && RELATIVE_DAYS_REGEX.test(val);
}

export function getParsedRelativeDateStr(dateVal: string): { days: number; positive: boolean } {
    if (!isRelativeDateFilterValue(dateVal)) return null;

    const daysStr = dateVal.replace('-', '').replace('+', '').replace('d', '');
    const days = parseInt(daysStr, 10);
    const positive = dateVal.indexOf('-') !== 0;

    return { days, positive };
}

/**
 * Returns true if the date has a timestamp that is before now.
 * If a timezone is not provided, then it will assume the provided date is in the server's timezone
 */
export function isDateTimeInPast(date: Date | number | string, timezone?: string): boolean {
    const date_ = parseDate(date);
    if (!isValid(date_)) return false;

    // Issue 52637: Convert dates from server timezone to local timezone for comparison
    const timezone_ = timezone ?? getServerContext().timezone;
    const zonedTime = fromZonedTime(date_, timezone_);
    return zonedTime.getTime() <= new Date().getTime();
}

/**
 * Given a current date format (DMY or YMD), assuming useMDYDateParsing is false, return accepted alternative parse formats.
 * In order to be able to parse DMY dates, all possible combinations of MDY date and/or datetime formats need to be considered.
 * To help narrow down the list of formats, an optional inputDateStr can be provided.
 * @param currentFormat The configured field/container/folder date/datetime format
 * @param inputDateStr An optional input date string to help narrow down the list of formats to test
 */
export function getAltParseFormats(
    currentFormat: string,
    inputDateStr?: string /*helps narrow down list of formats*/
): string[] {
    const { useMDYDateParsing } = getServerContext();
    // if starts with 'yy', don't use alt formats to avoid ambiguity with ddMMyy
    const canUseAltFormat =
        currentFormat.toLowerCase().startsWith('d') || currentFormat.toLowerCase().startsWith('yyyy');
    if (useMDYDateParsing || !canUseAltFormat) {
        return [currentFormat];
    }
    const dayPart = ['dd'];
    const monthPart = ['MM', 'MMM'];
    const yearParts = ['yy', 'yyyy'];

    let separators = ['-', '/', '.'];
    let altDateFormats = [currentFormat];
    let hasTime = true;
    let timeParts = ['hh:mm:ss.SSS a', 'hh:mm:ss a', 'hh:mm a', 'hh a', 'HH:mm:ss.SSS', 'HH:mm:ss', 'HH:mm', 'HH']; // favor am/pm formats first, instead of current time format

    if (inputDateStr) {
        const sep = inputDateStr.indexOf('-') > -1 ? '-' : inputDateStr.indexOf('/') > -1 ? '/' : '.';
        separators = [sep];

        let currentDateFormat = currentFormat;
        hasTime = inputDateStr.indexOf(' ') > -1; // check dateStr instead of currentFormat for time part, we need to be able to parse datetime into date even if format contains only date portion
        timeParts = ['HH:mm:ss.SSS', 'HH:mm:ss', 'HH:mm', 'HH'];
        let hasAMPM = false;
        if (hasTime) {
            hasAMPM = inputDateStr.toLowerCase().indexOf(' am') > -1 || inputDateStr.toLowerCase().indexOf(' pm') > -1;
            if (hasAMPM) timeParts = ['hh:mm:ss.SSS a', 'hh:mm:ss a', 'hh:mm a', 'hh a'];
            const splitInd = currentFormat.indexOf(' ');
            if (splitInd > -1) currentDateFormat = currentFormat.substring(0, splitInd);
        }
        altDateFormats = [currentDateFormat];
    }

    for (const p1 of dayPart) {
        for (const p2 of monthPart) {
            for (const p3 of yearParts) {
                for (const sep of separators) {
                    const format = p1 + sep + p2 + sep + p3;
                    if (altDateFormats.indexOf(format) === -1) altDateFormats.push(format);
                }
            }
        }
    }

    // also allow yyyy M D like format, but not yy M D to avoid ambiguity with D M yy
    for (const month of monthPart) {
        for (const sep of separators) {
            const format = 'yyyy' + sep + month + sep + 'dd';
            if (altDateFormats.indexOf(format) === -1) altDateFormats.push(format);
        }
    }

    if (!hasTime) return altDateFormats;

    const altDateTimeFormats =
        altDateFormats.indexOf(currentFormat) > -1 ? [...altDateFormats] : [currentFormat, ...altDateFormats];

    for (const dateFormat of altDateFormats) {
        for (const timeFormat of timeParts) {
            const dateTimeFormat = dateFormat + ' ' + timeFormat;
            if (altDateTimeFormats.indexOf(dateTimeFormat) === -1) altDateTimeFormats.push(dateTimeFormat);
        }
    }

    return altDateTimeFormats;
}
