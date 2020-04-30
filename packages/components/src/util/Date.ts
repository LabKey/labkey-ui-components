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
import moment from 'moment-jdateformatparser';
import 'moment-timezone';
import numeral from 'numeral';

import { QueryColumn } from '../components/base/models/model';

export function datePlaceholder(col: QueryColumn): string {
    let placeholder;

    if (col) {
        const rangeURI = col.rangeURI.toLowerCase();

        // attempt to use the rangeURI to figure out if we are working with a dateTime or date object
        // note Created and Modified columns do not include the rangeURI information
        if (rangeURI.indexOf('datetime') > -1) {
            placeholder = getDateTimeFormat();
        } else if (rangeURI.indexOf('date') > -1) {
            placeholder = getDateFormat();
        } else {
            placeholder = getDateTimeFormat();
        }
    }

    return placeholder;
}

export function isDateTimeCol(col: QueryColumn): boolean {
    if (col) {
        const rangeURI = col.rangeURI.toLowerCase();

        // attempt to use the rangeURI to figure out if we are working with a dateTime or date object
        // note Created and Modified columns do not include the rangeURI information
        if (rangeURI.indexOf('datetime') > -1) {
            return true;
        }
    }

    return false;
}

// 30834: get look and feel display formats
export function getDateFormat(): string {
    return moment().toMomentFormatString(LABKEY.container.formats.dateFormat);
}

export function getDateTimeFormat(): string {
    return moment().toMomentFormatString(LABKEY.container.formats.dateTimeFormat);
}

function getNumberFormat(): string {
    return LABKEY.container.formats.numberFormat;
}

// format input/value using look and feel settings
function getFormattedDate(d) {
    return d ? moment(d, getDateFormat()) : d;
}

function getFormattedDateTime(d) {
    return d ? moment(d, getDateTimeFormat()) : d;
}

export function parseDate(dateStr: string, dateFormat?: string) {
    if (!dateStr) return null;

    const date = moment(dateStr, dateFormat ? dateFormat : getDateFormat());
    if (date) return date.toDate();

    return null;
}

export function formatDate(date: Date, timezone?: string, dateFormat?: string) {
    if (!date) return null;
    let _date = moment(date);
    if (timezone) _date = _date.tz(timezone);
    return _date.formatWithJDF(dateFormat ? dateFormat : getDateFormat());
}

export function formatDateTime(date: Date, timezone?: string) {
    if (!date) return null;
    let _date = moment(date);
    if (timezone) _date = _date.tz(timezone);
    return _date.formatWithJDF(getDateTimeFormat());
}

function getFormattedNumber(n) {
    return n ? numeral(n).format(getNumberFormat()) : n;
}

export function getUnFormattedNumber(n) {
    return n ? numeral(n).value() : n;
}

export function generateNameWithTimestamp(name: string) {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    let timeStr = date.toTimeString().split(' ')[0];
    timeStr = timeStr.replace(/:/g, '-');
    return name + '_' + dateStr + '_' + timeStr;
}
