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
import { addDays, addHours, subDays, subHours } from 'date-fns';

import { QueryColumn } from '../../public/QueryColumn';
import { DATE_TYPE, DATETIME_TYPE, TIME_TYPE } from '../components/domainproperties/PropDescType';

import {
    formatDate,
    formatDateTime,
    generateNameWithTimestamp,
    getColDateFormat,
    getColFormattedDateFilterValue,
    getColFormattedTimeFilterValue,
    getJsonDateTimeFormatString,
    getJsonFormatString,
    getNextDateStr,
    getParsedRelativeDateStr,
    getPickerDateAndTimeFormat,
    isDateBetween,
    isDateTimeInPast,
    isRelativeDateFilterValue,
    parseDate,
    parseDateFNSTimeFormat,
    parseFNSTimeFormat,
} from './Date';

describe('Date Utilities', () => {
    describe('generateNameWithTimestamp', () => {
        test('generated text', () => {
            const prefix = 'Test';
            const name = generateNameWithTimestamp(prefix);
            expect(name.indexOf(prefix + '_') === 0).toBeTruthy();
            expect(name.length === prefix.length + 20).toBeTruthy(); // 2 underscores, 10 for date string, 8 for time string
        });
    });

    describe('isDateBetween', () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/Vancouver
        const date = new Date(datePOSIX);
        const datePlusDay = addDays(date, 1);
        const datePlusHours = addHours(date, 5);
        const dateMinusDay = subDays(date, 1);
        const dateMinusHours = subHours(date, 5);
        const invalidDate = new Date(NaN);

        test('invalid dates', () => {
            expect(isDateBetween(undefined, undefined, undefined)).toBe(false);
            expect(isDateBetween(null, undefined, undefined)).toBe(false);
            expect(isDateBetween(date, undefined, undefined)).toBe(true);
            expect(isDateBetween(date, null, undefined)).toBe(true);
            expect(isDateBetween(date, undefined, null)).toBe(true);
            expect(isDateBetween(date, invalidDate, undefined)).toBe(true);
            expect(isDateBetween(date, undefined, invalidDate)).toBe(true);
            expect(isDateBetween(date, invalidDate, invalidDate)).toBe(true);
        });

        test('only start date', () => {
            expect(isDateBetween(date, date, undefined, false)).toBe(true);
            expect(isDateBetween(date, date, undefined, true)).toBe(false);
            expect(isDateBetween(date, datePlusDay, undefined)).toBe(false);
            expect(isDateBetween(date, datePlusHours, undefined, true)).toBe(false);
            expect(isDateBetween(date, datePlusHours, undefined, false)).toBe(false);
            expect(isDateBetween(date, dateMinusDay, undefined)).toBe(true);
            expect(isDateBetween(date, dateMinusHours, undefined, true)).toBe(false);
            expect(isDateBetween(date, dateMinusHours, undefined, false)).toBe(true);
        });

        test('only end date', () => {
            expect(isDateBetween(date, undefined, date)).toBe(true);
            expect(isDateBetween(date, undefined, datePlusDay)).toBe(true);
            expect(isDateBetween(date, undefined, dateMinusDay)).toBe(false);
        });

        test('between', () => {
            expect(isDateBetween(date, date, date, true)).toBe(false);
            expect(isDateBetween(date, date, date, false)).toBe(true);
            expect(isDateBetween(date, datePlusHours, datePlusDay)).toBe(false);
            expect(isDateBetween(date, dateMinusDay, dateMinusHours)).toBe(false);
            expect(isDateBetween(date, dateMinusDay, datePlusDay)).toBe(true);
            expect(isDateBetween(date, dateMinusHours, datePlusHours)).toBe(true);
        });
    });

    describe('formatDate', () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/Vancouver
        const testDate = new Date(datePOSIX);

        test('invalid date', () => {
            expect(formatDate(undefined)).toBe(undefined);
        });
        test('default to context dateFormat', () => {
            const actualFormat = formatDate(testDate);

            expect(actualFormat).toBe('2020-08-06');
            expect(actualFormat).toEqual(formatDate(testDate, undefined, LABKEY.container.formats.dateFormat));
        });
        test('supports timezone', () => {
            expect(formatDate(datePOSIX, 'Europe/Athens')).toBe('2020-08-07');
            expect(formatDate(testDate, 'Europe/Athens')).toBe('2020-08-07');
        });
        test('supports custom format', () => {
            expect(formatDate(datePOSIX, 'America/New_York', 'DDYYYYMM')).toBe('06202008');
            expect(formatDate(testDate, 'America/New_York', 'DDYYYYMM')).toBe('06202008');
        });
    });

    describe('formatDateTime', () => {
        const datePOSIX = 1596750283812; // Aug 6, 2020 14:44 America/Vancouver
        const testDate = new Date(datePOSIX);

        test('invalid date', () => {
            expect(formatDateTime(undefined)).toBe(undefined);
        });
        test('default to context dateTimeFormat', () => {
            const actualFormat = formatDateTime(testDate);

            expect(actualFormat).toEqual(formatDateTime(testDate, undefined, LABKEY.container.formats.dateTimeFormat));
        });
        test('supports timezone', () => {
            expect(formatDateTime(datePOSIX, 'Europe/Athens')).toBe('2020-08-07 00:44');
            expect(formatDateTime(testDate, 'Europe/Athens')).toBe('2020-08-07 00:44');
        });
        test('supports custom format', () => {
            expect(formatDateTime(datePOSIX, 'America/New_York', 'DDYYYYMM')).toBe('06202008');
            expect(formatDateTime(testDate, 'America/New_York', 'DDYYYYMM')).toBe('06202008');
        });
    });

    describe('getJsonDateTimeFormatString', () => {
        test('without date', () => {
            expect(getJsonDateTimeFormatString(undefined)).toBe(undefined);
            expect(getJsonDateTimeFormatString(null)).toBe(undefined);
        });

        test('with date', () => {
            expect(getJsonDateTimeFormatString(new Date('2021-12-03 00:00'))).toBe('2021-12-03 00:00:00');
            expect(getJsonDateTimeFormatString(new Date('2021-12-03 23:59'))).toBe('2021-12-03 23:59:00');
        });
    });

    describe('getJsonFormatString', () => {
        test('without date', () => {
            expect(getJsonFormatString(undefined, 'Date')).toBe(undefined);
            expect(getJsonFormatString(null, 'Date')).toBe(undefined);
            expect(getJsonFormatString(undefined, 'DateTime')).toBe(undefined);
            expect(getJsonFormatString(null, 'DateTime')).toBe(undefined);
            expect(getJsonFormatString(undefined, 'Time')).toBe(undefined);
            expect(getJsonFormatString(null, 'Time')).toBe(undefined);
        });

        test('with date', () => {
            expect(getJsonFormatString(new Date('2021-12-03 00:00'), 'Date')).toBe('2021-12-03');
            expect(getJsonFormatString(new Date('2021-12-03 23:59'), 'Date')).toBe('2021-12-03');
            expect(getJsonFormatString(new Date('2021-12-03 00:00'), 'DateTime')).toBe('2021-12-03 00:00:00');
            expect(getJsonFormatString(new Date('2021-12-03 23:59'), 'DateTime')).toBe('2021-12-03 23:59:00');
            expect(getJsonFormatString(new Date('2021-12-03 00:00'), 'Time')).toBe('00:00:00');
            expect(getJsonFormatString(new Date('2021-12-03 23:59'), 'Time')).toBe('23:59:00');
        });
    });

    describe('getColDateFormat', () => {
        test('datePlaceholder', () => {
            const col = new QueryColumn({ shortCaption: 'DateCol', rangeURI: DATETIME_TYPE.rangeURI });
            expect(getColDateFormat(col)).toBe('yyyy-MM-dd HH:mm');
            expect(getColDateFormat(col, null, true)).toBe('yyyy-MM-dd');

            expect(getPickerDateAndTimeFormat(col)).toEqual({
                dateFormat: 'yyyy-MM-dd HH:mm',
                timeFormat: 'HH:mm',
            });
            expect(getPickerDateAndTimeFormat(col, true)).toEqual({
                dateFormat: 'yyyy-MM-dd',
                timeFormat: undefined,
            });

            const timeCol = new QueryColumn({ shortCaption: 'TimeCol', rangeURI: TIME_TYPE.rangeURI });
            expect(getColDateFormat(timeCol)).toBe('HH:mm');
            expect(getColDateFormat(col, 'Time')).toBe('HH:mm');

            expect(getPickerDateAndTimeFormat(timeCol)).toEqual({
                dateFormat: 'HH:mm',
                timeFormat: 'HH:mm',
            });
        });

        test('datePlaceholder without col.rangeURI', () => {
            const col = new QueryColumn({ shortCaption: 'DateCol', rangeURI: undefined });
            expect(getColDateFormat(col)).toBe('yyyy-MM-dd HH:mm');
            expect(getColDateFormat(col, null, true)).toBe('yyyy-MM-dd');

            expect(getPickerDateAndTimeFormat(col)).toEqual({
                dateFormat: 'yyyy-MM-dd HH:mm',
                timeFormat: 'HH:mm',
            });
            expect(getPickerDateAndTimeFormat(col, true)).toEqual({
                dateFormat: 'yyyy-MM-dd',
                timeFormat: undefined,
            });

            const timeCol = new QueryColumn({ shortCaption: 'TimeCol', rangeURI: undefined });
            expect(getColDateFormat(timeCol, 'Time')).toBe('HH:mm');

            expect(getPickerDateAndTimeFormat(timeCol)).toEqual({
                dateFormat: 'yyyy-MM-dd HH:mm',
                timeFormat: 'HH:mm',
            });
        });

        test('queryColumn.format', () => {
            const col = new QueryColumn({
                shortCaption: 'DateCol',
                rangeURI: DATETIME_TYPE.rangeURI,
                format: 'dd/MM/yyyy HH:mm',
            });
            expect(getColDateFormat(col)).toBe('dd/MM/yyyy HH:mm');
            expect(getColDateFormat(col, null, true)).toBe('dd/MM/yyyy HH:mm');

            expect(getPickerDateAndTimeFormat(col)).toEqual({
                dateFormat: 'dd/MM/yyyy HH:mm',
                timeFormat: 'HH:mm',
            });

            expect(getPickerDateAndTimeFormat(col, true)).toEqual({
                dateFormat: 'yyyy-MM-dd',
                timeFormat: undefined,
            });
        });

        test('provided dateFormat', () => {
            const col = new QueryColumn({
                shortCaption: 'DateCol',
                rangeURI: DATETIME_TYPE.rangeURI,
                format: 'dd/MM/yyyy HH:mm',
            });
            expect(getColDateFormat(col, 'yyyy-MM HH')).toBe('yyyy-MM HH');
            expect(getColDateFormat(col, 'yyyy-MM HH HH:mm')).toBe('yyyy-MM HH HH:mm');
            expect(getColDateFormat(col, 'yyyy-MM HH HH:mm', true)).toBe('yyyy-MM HH HH:mm');
        });

        test('date-fns replacement', () => {
            const col = new QueryColumn({ shortCaption: 'DateCol', rangeURI: DATETIME_TYPE.rangeURI });
            expect(getColDateFormat(col, 'YYYY-MM-DD')).toBe('yyyy-MM-dd');
            expect(getColDateFormat(col, 'YY-MM-dd')).toBe('yy-MM-dd');
            expect(getColDateFormat(col, 'YY-MM-dd z')).toBe('yy-MM-dd xxx');
            expect(getColDateFormat(col, 'YY-MM-dd Z')).toBe('yy-MM-dd xxx');
            expect(getColDateFormat(col, 'YY-MM-dd zz')).toBe('yy-MM-dd xxx');
            expect(getColDateFormat(col, 'ZZ YY-MM-dd ZZ')).toBe('xxx yy-MM-dd xxx');
            expect(getColDateFormat(col, 'xxx YY-MM-dd ZZ')).toBe('xxx yy-MM-dd xxx');
            expect(getColDateFormat(col, 'YY-MM-dd ZZZZ')).toBe('yy-MM-dd xxx');
            expect(getColDateFormat(col, 'zzzz YY-MM-dd')).toBe('xxx yy-MM-dd');
        });

        test('shortcut formats', () => {
            const col = new QueryColumn({ shortCaption: 'DateCol', rangeURI: DATETIME_TYPE.rangeURI });
            expect(getColDateFormat(col, 'Date')).toBe('yyyy-MM-dd');
            expect(getColDateFormat(col, 'DateTime')).toBe('yyyy-MM-dd HH:mm');
            expect(getColDateFormat(col, 'DateTime', true)).toBe('yyyy-MM-dd HH:mm');
            expect(getColDateFormat(col, 'Time')).toBe('HH:mm');
        });
    });

    describe('parseFNSTimeFormat', () => {
        test('various formats', () => {
            expect(parseFNSTimeFormat('kk:mm aa')).toBe('HH:mm');
            expect(parseFNSTimeFormat('HH:mm')).toBe('HH:mm');
            expect(parseFNSTimeFormat('kk:mm')).toBe('HH:mm');
            expect(parseFNSTimeFormat('hh:mm')).toBe('hh:mm a');
            expect(parseFNSTimeFormat('KK:mm')).toBe('hh:mm a');
        });
    });

    describe('parseDateFNSTimeFormat', () => {
        test('various formats', () => {
            expect(parseDateFNSTimeFormat('yyyy-MM HH')).toBeUndefined();
            expect(parseDateFNSTimeFormat('yyyy-MM-DD HHmm')).toBeUndefined();
            expect(parseDateFNSTimeFormat('yyyy-MM HH HH:mm')).toBe('HH:mm');
            expect(parseDateFNSTimeFormat('yyyy:MM:DD kk:mm aa')).toBe('HH:mm');
            expect(parseDateFNSTimeFormat('yyyy-MM-DD HH:mm')).toBe('HH:mm');
            expect(parseDateFNSTimeFormat('yyyy:MM:DD kk:mm')).toBe('HH:mm');
            expect(parseDateFNSTimeFormat('yyyy:MM:DD hh:mm')).toBe('hh:mm a');
            expect(parseDateFNSTimeFormat('yyyy:MM:DD KK:mm')).toBe('hh:mm a');
            expect(parseDateFNSTimeFormat('MMMM dd yyyy HH:mm')).toBe('HH:mm');
            expect(parseDateFNSTimeFormat('MMMM dd yyyy HH:mm:ss')).toBe('HH:mm:ss');
            expect(parseDateFNSTimeFormat('MMMM dd yyyy hh:mm:ss a')).toBe('hh:mm:ss a');
            expect(parseDateFNSTimeFormat('MMMM dd yyyy hh:mm:ss aa')).toBe('hh:mm:ss a');
        });
    });

    describe('getColFormattedDateFilterValue', () => {
        test('formatDateTime with QueryColumn format', () => {
            const col = new QueryColumn({
                shortCaption: 'DateCol',
                rangeURI: DATETIME_TYPE.rangeURI,
                format: 'dd/MM/yyyy HH:mm',
            });

            expect(
                getColFormattedDateFilterValue(col, ['', null, '2022-04-19 01:02', 'ABCDEFG'])
            ).toStrictEqual(['', null, '19/04/2022 01:02', 'ABCDEFG']);
        });

        test('formatDateTime without QueryColumn format', () => {
            const col = new QueryColumn({ shortCaption: 'DateCol', rangeURI: DATETIME_TYPE.rangeURI });
            expect(getColFormattedDateFilterValue(col, '2022-04-19 01:02')).toBe('2022-04-19');
        });

        test('formatDate with QueryColumn format', () => {
            const col = new QueryColumn({
                shortCaption: 'DateCol',
                rangeURI: DATE_TYPE.rangeURI,
                format: 'dd/MM/yyyy',
            });
            expect(getColFormattedDateFilterValue(col, '2022-04-19 01:02')).toBe('19/04/2022');
        });

        test('formatDate without QueryColumn format', () => {
            const col = new QueryColumn({ shortCaption: 'DateCol', rangeURI: DATE_TYPE.rangeURI });
            expect(getColFormattedDateFilterValue(col, '2022-04-19 01:02')).toBe('2022-04-19');
        });

        test('formatDate without QueryColumn format, without timestamp', () => {
            const col = new QueryColumn({ shortCaption: 'DateCol', rangeURI: DATE_TYPE.rangeURI });
            expect(getColFormattedDateFilterValue(col, '2022-04-19')).toBe('2022-04-19');
        });

        test('formatDate with QueryColumn format, without timestamp', () => {
            const col = new QueryColumn({
                shortCaption: 'DateCol',
                rangeURI: DATE_TYPE.rangeURI,
                format: 'dd/MM/yyyy',
            });
            expect(getColFormattedDateFilterValue(col, '2022-04-19')).toBe('19/04/2022');
        });
    });

    describe('getColFormattedTimeFilterValue', () => {
        test('format time with QueryColumn format', () => {
            let col = new QueryColumn({
                shortCaption: 'TimeCol',
                rangeURI: TIME_TYPE.rangeURI,
                format: 'HH:mm:ss',
            });
            expect(getColFormattedTimeFilterValue(col, '01:02 PM')).toBe('13:02:00');
            expect(getColFormattedTimeFilterValue(col, '01:02:03 AM')).toBe('01:02:03');
            expect(getColFormattedTimeFilterValue(col, '01:02 AM')).toBe('01:02:00');
            expect(getColFormattedTimeFilterValue(col, '01:02')).toBe('01:02:00');
            expect(getColFormattedTimeFilterValue(col, '21:02:30')).toBe('21:02:30');

            col = new QueryColumn({
                shortCaption: 'TimeCol',
                rangeURI: TIME_TYPE.rangeURI,
                format: 'hh:mm a',
            });
            expect(getColFormattedTimeFilterValue(col, '01:02 PM')).toBe('01:02 PM');
            expect(getColFormattedTimeFilterValue(col, '01:02:03 AM')).toBe('01:02 AM');
            expect(getColFormattedTimeFilterValue(col, '01:02')).toBe('01:02 AM');
            expect(getColFormattedTimeFilterValue(col, '21:02:30')).toBe('09:02 PM');
        });

        test('formatDateTime without QueryColumn format', () => {
            const col = new QueryColumn({
                shortCaption: 'TimeCol',
                rangeURI: TIME_TYPE.rangeURI,
            });
            expect(getColFormattedTimeFilterValue(col, '01:02 PM')).toBe('13:02');
            expect(getColFormattedTimeFilterValue(col, '01:02:03 AM')).toBe('01:02');
            expect(getColFormattedTimeFilterValue(col, '01:02 AM')).toBe('01:02');
            expect(getColFormattedTimeFilterValue(col, '01:02:03')).toBe('01:02');
            expect(getColFormattedTimeFilterValue(col, '21:02:03')).toBe('21:02');
        });
    });

    describe('parseDate', () => {
        test('no dateStr', () => {
            expect(parseDate(undefined)).toBe(null);
            expect(parseDate(null)).toBe(null);
            expect(parseDate('')).toBe(null);
        });

        test('invalid date', () => {
            global.console.warn = jest.fn();
            expect(parseDate('test')).toBe(null);
            expect(parseDate('test', 'yyyy-MM-dd')).toBe(null);
        });

        test('valid date without dateFormat', () => {
            expect(parseDate('2022-04-19 01:02').toString()).toContain('Apr 19 2022');
            expect(parseDate('2022-04-19').toString()).toContain('Apr 19 2022');
            expect(parseDate('04/19/2022').toString()).toContain('Apr 19 2022');
        });

        test('valid date with dateFormat', () => {
            expect(parseDate('01:02 2022-04-19', 'HH:mm yyyy-MM-dd').toString()).toContain('Apr 19 2022');
            expect(parseDate('19/04/2022', 'dd/MM/yyyy').toString()).toContain('Apr 19 2022');
            // TODO: The following seems incorrect. I would expect November 4th (4th day of the 11th month). So does date-fns.
            // expect(parseDate('4/11/2022', 'dd/MM/yyyy').toString()).toContain('Apr 11 2022');
            expect(parseDate('04/11/2022', 'dd/MM/yyyy').toString()).toContain('Nov 04 2022');
            expect(parseDate('4/11/2022', 'yyyy-MM-dd').toString()).toContain('Apr 11 2022');
            expect(parseDate('04/11/2022', 'yyyy-MM-dd').toString()).toContain('Apr 11 2022');
            expect(parseDate('4/11/2022', 'yyyy-MM-dd HH:ss').toString()).toContain('Apr 11 2022');
            expect(parseDate('04/11/2022', 'yyyy-MM-dd HH:ss').toString()).toContain('Apr 11 2022');
            expect(parseDate('22-04-11', 'yy-MM-dd').toString()).toContain('Apr 11 2022');
            expect(parseDate('22-04-11', 'YY-MM-DD').toString()).toContain('Apr 11 2022');
            expect(parseDate('22/04/11', 'yy/MM/dd').toString()).toContain('Apr 11 2022');
            expect(parseDate('22/04/11', 'YY/MM/DD').toString()).toContain('Apr 11 2022');
        });

        test('minDate', () => {
            expect(parseDate('0218-11-18', undefined).toString()).toContain('0218');
            expect(parseDate('0218-11-18', undefined, new Date('1000-01-01'))).toBe(null);
            expect(parseDate('0218-11-18 00:00', 'yyyy-MM-dd HH:ss').toString()).toContain('0218');
            expect(parseDate('0218-11-18 00:00', 'yyyy-MM-dd HH:ss', new Date('1000-01-01'))).toBe(null);
        });
    });

    describe('getNextDateStr', () => {
        test('default days', () => {
            expect(getNextDateStr('2022-02-02')).toEqual('2022-02-03');
            expect(getNextDateStr('2022-02-02 01:02')).toEqual('2022-02-03');
        });

        test('0 day', () => {
            expect(getNextDateStr('2022-02-02', 0)).toEqual('2022-02-02');
        });

        test('n positive days', () => {
            expect(getNextDateStr('2022-02-02', 3)).toEqual('2022-02-05');
            expect(getNextDateStr('2022-02-02 01:02', 3)).toEqual('2022-02-05');
            expect(getNextDateStr('2022-02-27', 3)).toEqual('2022-03-02');
            expect(getNextDateStr('2022-02-27 01:02', 3)).toEqual('2022-03-02');
        });

        test('n negative days', () => {
            expect(getNextDateStr('2022-02-02', -3)).toEqual('2022-01-30');
            expect(getNextDateStr('2022-02-02 01:02', -3)).toEqual('2022-01-30');
            expect(getNextDateStr('2022-02-27', -3)).toEqual('2022-02-24');
            expect(getNextDateStr('2022-02-27 01:02', -3)).toEqual('2022-02-24');
        });
    });

    describe('isRelativeDateFilterValue', () => {
        test('empty value', () => {
            expect(isRelativeDateFilterValue(undefined)).toBeFalsy();
            expect(isRelativeDateFilterValue(null)).toBeFalsy();
            expect(isRelativeDateFilterValue('')).toBeFalsy();
        });

        test('date value', () => {
            expect(isRelativeDateFilterValue('2022-04-19 01:02')).toBeFalsy();
            expect(isRelativeDateFilterValue('2022-04-19')).toBeFalsy();
        });

        test('incomplete value', () => {
            expect(isRelativeDateFilterValue('3d')).toBeFalsy();
            expect(isRelativeDateFilterValue('d')).toBeFalsy();
            expect(isRelativeDateFilterValue('3')).toBeFalsy();
            expect(isRelativeDateFilterValue('0d')).toBeFalsy();
            expect(isRelativeDateFilterValue('+d')).toBeFalsy();
            expect(isRelativeDateFilterValue('+3')).toBeFalsy();
            expect(isRelativeDateFilterValue('++3d')).toBeFalsy();
        });

        test('valid', () => {
            expect(isRelativeDateFilterValue('+3d')).toBeTruthy();
            expect(isRelativeDateFilterValue('+300d')).toBeTruthy();
            expect(isRelativeDateFilterValue('-3d')).toBeTruthy();
            expect(isRelativeDateFilterValue('-0d')).toBeTruthy();
        });
    });

    describe('getParsedRelativeDateStr', () => {
        test('getParsedRelativeDateStr', () => {
            expect(getParsedRelativeDateStr('+3d')).toStrictEqual({
                positive: true,
                days: 3,
            });
            expect(getParsedRelativeDateStr('+300d')).toStrictEqual({
                positive: true,
                days: 300,
            });
            expect(getParsedRelativeDateStr('-3d')).toStrictEqual({
                positive: false,
                days: 3,
            });
            expect(getParsedRelativeDateStr('-0d')).toStrictEqual({
                positive: false,
                days: 0,
            });
        });
    });

    describe('isDateTimeInPast', () => {
        test('empty', () => {
            expect(isDateTimeInPast(undefined)).toBeFalsy();
            expect(isDateTimeInPast(null)).toBeFalsy();
            expect(isDateTimeInPast('')).toBeFalsy();
        });

        test('past', () => {
            expect(isDateTimeInPast('2022-02-02')).toBeTruthy();
            expect(isDateTimeInPast('2022-02-02 01:02')).toBeTruthy();
            expect(isDateTimeInPast('2022-02-02 01:02:03.123')).toBeTruthy();
        });

        test('today midnight', () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            expect(isDateTimeInPast(today)).toBeTruthy();
        });

        test('now', () => {
            const nowDate = new Date();
            const now = getJsonDateTimeFormatString(nowDate);
            const in10SecondsDate = new Date(nowDate.getTime() + (10 * 6000));
            const in10Seconds = getJsonDateTimeFormatString(in10SecondsDate);

            expect(isDateTimeInPast(now)).toBeTruthy();
            expect(isDateTimeInPast(in10Seconds)).toBeFalsy();
        });

        test('futurama', () => {
            expect(isDateTimeInPast('3000-01-01')).toBeFalsy();
            expect(isDateTimeInPast('3000-01-01 00:01')).toBeFalsy();
            expect(isDateTimeInPast('3000-01-01 00:00:00.001')).toBeFalsy();
        });
    });
});
