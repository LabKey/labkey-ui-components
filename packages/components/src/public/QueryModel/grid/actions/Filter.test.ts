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

import { QueryColumn } from '../../../QueryColumn';

import { FilterAction } from './Filter';
import { ActionValue } from './Action';
import { TIME_RANGE_URI } from '../../../../internal/components/domainproperties/constants';

describe('FilterAction::actionValueFromFilter', () => {
    const action = new FilterAction();

    // TODO add tests for various value options
    test('no label, unencoded column', () => {
        const filter = Filter.create('colName', '10', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter);
        expect(value.displayValue).toBe('colName = 10');
        expect(value.value).toBe('"colName" = 10');
    });

    test('no label, encoded column', () => {
        const filter = Filter.create('U mg$SL', '10', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter);
        expect(value.displayValue).toBe('U mg/L = 10');
        expect(value.value).toBe('"U mg$SL" = 10');
    });

    test('with label from QueryColumn', () => {
        const col = new QueryColumn({ shortCaption: 'otherLabel' });
        const filter = Filter.create('U mgS$L', 'x', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter, col);
        expect(value.displayValue).toBe('otherLabel = x');
        expect(value.value).toBe('"otherLabel" = x');
    });

    test('date formatting, date and time', () => {
        const col = new QueryColumn({ shortCaption: 'DateCol', jsonType: 'date', format: 'dd/MM/yyyy HH:mm' });
        const filter = Filter.create('DateCol', '2022-04-19 01:02', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter, col);
        expect(value.displayValue).toBe('DateCol = 19/04/2022 01:02');
    });

    test('date formatting, date only', () => {
        const col = new QueryColumn({ shortCaption: 'DateCol', jsonType: 'date', format: 'dd/MM/yyyy' });
        const filter = Filter.create('DateCol', '2022-04-19 01:02', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter, col);
        expect(value.displayValue).toBe('DateCol = 19/04/2022');
    });

    test('date formatting, time only', () => {
        const col = new QueryColumn({ shortCaption: 'DateCol', jsonType: 'date', format: 'HH:mm:ss' });
        const filter = Filter.create('DateCol', '2022-04-19 01:02', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter, col);
        expect(value.displayValue).toBe('DateCol = 01:02:00');
    });

    test('time formatting', () => {
        const col = new QueryColumn({ shortCaption: 'TimeCol', jsonType: 'time', format: 'HH:mm:ss', rangeURI: TIME_RANGE_URI });
        const filter = Filter.create('TimeCol', '01:02', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter, col);
        expect(value.displayValue).toBe('TimeCol = 01:02:00');
    });
});
