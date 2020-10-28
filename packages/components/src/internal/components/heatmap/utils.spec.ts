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
import { Set } from 'immutable';

import { AppURL } from '../../..';

import { addDateRangeFilter, ALL_MONTHS, last12Months, monthSort } from './utils';

describe('HeatMap utils', () => {
    test('addDateRangeFilter', () => {
        const url = AppURL.create([]);
        const url2 = addDateRangeFilter(url, 'col', new Date('2020-01-01'), new Date('2020-01-02'));
        expect(url2.toString()).toBe('/?query.col~dategte=2020-01-01&query.col~datelte=2020-01-02');
    });

    test('monthSort', () => {
        const thisMonth = new Date().getMonth();
        // this month should get sorted to the end, so it should be the largest.
        expect(monthSort(ALL_MONTHS[thisMonth], ALL_MONTHS[thisMonth + (1 % 12)])).toBe(1);
        // Check for months not at the end
        expect(monthSort(ALL_MONTHS[(thisMonth + 1) % 12], ALL_MONTHS[(thisMonth + 2) % 12])).toBe(-1);
        expect(monthSort(ALL_MONTHS[(thisMonth + 2) % 12], ALL_MONTHS[(thisMonth + 1) % 12])).toBe(1);
        expect(monthSort(ALL_MONTHS[(thisMonth + 1) % 12], ALL_MONTHS[(thisMonth + 1) % 12])).toBe(0);

        expect(monthSort('test', 'Feb')).toBe(-1);
        expect(monthSort('Feb', 'test')).toBe(1);
        expect(monthSort('test', 'test')).toBe(0);
        expect(monthSort('jan', 'feb')).toBe(0);
    });

    test('last12Months', () => {
        const months = last12Months();
        expect(months.length).toBe(12);

        // make sure we got 12 unique months
        let monthNames = Set<string>();
        months.forEach(month => {
            monthNames = monthNames.add(month.monthName);
        });
        expect(monthNames.size).toBe(12);
    });
});
