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
import momentTZ from 'moment-timezone';
import numeral from 'numeral';
import { getServerContext } from '@labkey/api';

import { QueryColumn } from '../..';

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
        const rangeURI = col.rangeURI?.toLowerCase();

        // attempt to use the rangeURI to figure out if we are working with a dateTime or date object
        // note Created and Modified columns do not include the rangeURI information
        if (rangeURI?.indexOf('datetime') > -1) {
            return true;
        }
    }

    return false;
}

// 30834: get look and feel display formats
export function getDateFormat(): string {
    return moment().toMomentFormatString(getServerContext().container.formats.dateFormat);
}

export function getDateTimeFormat(): string {
    return moment().toMomentFormatString(getServerContext().container.formats.dateTimeFormat);
}

export function parseDate(dateStr: string, dateFormat?: string): Date {
    if (!dateStr) return null;

    const date = moment(dateStr, dateFormat);
    if (date && date.isValid()) {
        return date.toDate();
    }

    return null;
}

function _formatDate(date: Date | number, dateFormat: string, timezone?: string): string {
    if (!date) return undefined;
    const _date = moment(timezone ? momentTZ(date).tz(timezone) : date);
    return _date.formatWithJDF(dateFormat);
}

export function formatDate(date: Date | number, timezone?: string, dateFormat?: string): string {
    return _formatDate(date, dateFormat ?? getDateFormat(), timezone);
}

export function formatDateTime(date: Date | number, timezone?: string, dateFormat?: string): string {
    return _formatDate(date, dateFormat ?? getDateTimeFormat(), timezone);
}

export function getUnFormattedNumber(n): number {
    return n ? numeral(n).value() : n;
}

export function generateNameWithTimestamp(name: string): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    let timeStr = date.toTimeString().split(' ')[0];
    timeStr = timeStr.replace(/:/g, '-');
    return name + '_' + dateStr + '_' + timeStr;
}
