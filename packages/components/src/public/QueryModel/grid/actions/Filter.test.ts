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

import { TIME_RANGE_URI } from '../../../../internal/components/domainproperties/constants';

import { FilterAction, removeFilterValueForFilterProps } from './Filter';
import { ActionValue } from './Action';
import { EntityFieldFilter } from '../../../../internal/components/search/models';
import { FilterProps } from '../../../../internal/components/entities/models';

describe('FilterAction::actionValueFromFilter', () => {
    const action = new FilterAction();

    test('no-value filter (ISBLANK)', () => {
        const filter = Filter.create('col', null, Filter.Types.ISBLANK);
        const value: ActionValue = action.actionValueFromFilter(filter);
        expect(value.displayValue).toBe('col Is Blank');
        expect(value.value).toBe('"col" Is Blank null');
    });

    test('multi-value IN filter with 3 or fewer values shows comma-joined list', () => {
        const filter1 = Filter.create('col', ['a'], Filter.Types.IN);
        expect(action.actionValueFromFilter(filter1).displayValue).toBe('col Equals One Of a');

        const filter3 = Filter.create('col', ['a', 'b', 'c'], Filter.Types.IN);
        expect(action.actionValueFromFilter(filter3).displayValue).toBe('col Equals One Of a, b, c');
    });

    test('multi-value IN filter with more than 3 values shows count', () => {
        const filter = Filter.create('col', ['a', 'b', 'c', 'd'], Filter.Types.IN);
        const value: ActionValue = action.actionValueFromFilter(filter);
        expect(value.displayValue).toBe('col Equals One Of (4 values)');
    });

    test('custom getFilterDisplayValue callback overrides display', () => {
        const actionWithCb = new FilterAction((_colName, rawValue) => `DISPLAY(${rawValue})`);
        const filter = Filter.create('myCol', 'rawVal', Filter.Types.EQUAL);
        const value: ActionValue = actionWithCb.actionValueFromFilter(filter);
        expect(value.displayValue).toBe('myCol = DISPLAY(rawVal)');
        expect(value.value).toBe('"myCol" = DISPLAY(rawVal)');
    });

    test('isReadOnly is propagated to ActionValue', () => {
        const filter = Filter.create('col', 'val', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter, undefined, 'readonly');
        expect(value.isReadOnly).toBe('readonly');
    });

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
        expect(value.value).toBe('"U mg/L" = 10');
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
        const col = new QueryColumn({
            shortCaption: 'TimeCol',
            jsonType: 'time',
            format: 'HH:mm:ss',
            rangeURI: TIME_RANGE_URI,
        });
        const filter = Filter.create('TimeCol', '01:02', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter, col);
        expect(value.displayValue).toBe('TimeCol = 01:02:00');
    });

    test('multi-value IN filter with separator in value uses JSON encoding', () => {
        // Value 'a}b;c' contains both '}' and ';' (the IN separator), triggering {json:...} encoding
        const filter = Filter.create('col', ['a}b;c', 'normal'], Filter.Types.IN);
        const value: ActionValue = action.actionValueFromFilter(filter);
        expect(value.displayValue).toBe('col Equals One Of a}b;c, normal');
    });

    test('multi-value IN filter round-trips through URL parameter encoding', () => {
        // Simulate what happens when a filter is encoded to URL and parsed back
        const original = ['a}b;c', 'x;y}z'];
        const filter = Filter.create('col', original, Filter.Types.IN);
        // getURLParameterValue produces {json:["a}b;c","x;y}z"]}
        const encoded = filter.getFilterType().getURLParameterValue(filter.getValue());
        // Re-create from the encoded URL value, as if parsed from URL
        const roundTripped = Filter.create('col', encoded, Filter.Types.IN);
        const value: ActionValue = action.actionValueFromFilter(roundTripped);
        expect(value.displayValue).toBe('col Equals One Of a}b;c, x;y}z');
    });

    test('decodePart label vs column name', () => {
        const col = new QueryColumn({ shortCaption: '$Bool Field./,$&' });
        const filter = Filter.create('$DBoolField$P$S$C$D$A', true, Filter.Types.EQUAL);

        let value: ActionValue = action.actionValueFromFilter(filter, col);
        expect(value.displayValue).toBe('$Bool Field./,$& = true');
        expect(value.value).toBe('"$Bool Field./,$&" = true');

        value = action.actionValueFromFilter(filter);
        expect(value.displayValue).toBe('$BoolField./,$& = true');
        expect(value.value).toBe('"$BoolField./,$&" = true');
    });
});

describe('actionValueFromEntityFieldFilter', () => {
    const action = new FilterAction();

    it('returns correct ActionValue for date field with formatted value', () => {
        const entityFieldFilter: EntityFieldFilter = {
            fieldCaption: 'DateField',
            filter: Filter.create('DateField', '10-01-2023', Filter.Types.EQUAL),
            jsonType: 'date',
        } as EntityFieldFilter;
        const value = action.actionValueFromEntityFieldFilter(entityFieldFilter);
        expect(value.displayValue).toBe('DateField = 2023-10-01');
        expect(value.value).toBe('"DateField" = 2023-10-01');
    });

    it('returns correct ActionValue for time field with formatted value', () => {
        const entityFieldFilter: EntityFieldFilter = {
            fieldCaption: 'TimeField',
            filter: Filter.create('TimeField', '12:30:00.123', Filter.Types.EQUAL),
            jsonType: 'time',
        } as EntityFieldFilter;
        const value = action.actionValueFromEntityFieldFilter(entityFieldFilter);
        expect(value.displayValue).toBe('TimeField = 12:30');
        expect(value.value).toBe('"TimeField" = 12:30');
    });

    it('returns correct ActionValue for string field', () => {
        const entityFieldFilter: EntityFieldFilter = {
            fieldCaption: 'StringField',
            filter: Filter.create('StringField', 'testValue', Filter.Types.EQUAL),
        } as EntityFieldFilter;
        const value = action.actionValueFromEntityFieldFilter(entityFieldFilter);
        expect(value.displayValue).toBe('StringField = testValue');
        expect(value.value).toBe('"StringField" = testValue');
    });

    it('handles missing fieldCaption gracefully', () => {
        const entityFieldFilter: EntityFieldFilter = {
            filter: Filter.create('UnnamedField', 'value', Filter.Types.EQUAL),
        } as EntityFieldFilter;
        const value = action.actionValueFromEntityFieldFilter(entityFieldFilter);
        expect(value.displayValue).toBe('UnnamedField = value');
        expect(value.value).toBe('"UnnamedField" = value');
    });

    it('handles null filter value', () => {
        const entityFieldFilter: EntityFieldFilter = {
            fieldCaption: 'NullField',
            filter: Filter.create('NullField', null, Filter.Types.ISBLANK),
        } as EntityFieldFilter;
        const value = action.actionValueFromEntityFieldFilter(entityFieldFilter);
        expect(value.displayValue).toBe('NullField Is Blank');
        expect(value.value).toBe('"NullField" Is Blank null');
    });
});

describe('removeFilterValueForFilterProps', () => {
    const filter1 = Filter.create('PropA', 'a');
    const filter2 = Filter.create('PropB', 'b');
    const filter3 = Filter.create('PropB', 'c');

    const entityFilterProps: FilterProps = {
        schemaQuery: { schemaName: 'schema', queryName: 'query' },
        filterArray: [{ filter: filter2 }, { filter: filter1 }, { filter: filter3 }],
    } as FilterProps;
    const actionValues: ActionValue[] = [
        {
            action: new FilterAction(),
            displayValue: 'PropA = a',
            value: '"PropA" = a',
            valueObject: filter1,
        },
        {
            action: new FilterAction(),
            displayValue: 'PropB = b',
            value: '"PropB" = b',
            valueObject: filter2,
        },
        {
            action: new FilterAction(),
            displayValue: 'PropC = c',
            value: '"PropC" = c',
            valueObject: filter3,
        },
    ];

    it('removes the filter value when it exists in the filter array', () => {
        const updatedFilters = removeFilterValueForFilterProps(entityFilterProps, actionValues, 0);
        expect(updatedFilters.length).toBe(2);
        expect(updatedFilters[0].filter).toBe(filter2);
        expect(updatedFilters[1].filter).toBe(filter3);
    });

    it('does not modify the filter array when the value does not exist', () => {
        const nonMatchingFilter = Filter.create('OtherField', 'otherValue', Filter.Types.EQUAL);
        const nonMatchingActionValues: ActionValue[] = [
            {
                action: new FilterAction(),
                displayValue: 'OtherField = otherValue',
                value: '"OtherField" = otherValue',
                valueObject: nonMatchingFilter,
            },
        ];
        const updatedFilters = removeFilterValueForFilterProps(entityFilterProps, nonMatchingActionValues, 0);
        expect(updatedFilters.length).toBe(3);
        expect(updatedFilters[0].filter).toBe(filter2);
    });

    it('handles an empty filter array gracefully', () => {
        const emptyFilterProps: FilterProps = {
            schemaQuery: { schemaName: 'schema', queryName: 'query' },
            filterArray: [],
        } as FilterProps;
        const updatedFilters = removeFilterValueForFilterProps(emptyFilterProps, actionValues, 0);
        expect(updatedFilters.length).toBe(0);
    });

    it('does not throw an error when valueIndex is out of bounds', () => {
        const updatedFilters = removeFilterValueForFilterProps(entityFilterProps, actionValues, 3);
        expect(updatedFilters.length).toBe(3);
        expect(updatedFilters[0].filter).toBe(filter2);
    });
});
