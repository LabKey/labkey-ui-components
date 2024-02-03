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
import { fromJS } from 'immutable';

import { resolveDetailFieldValue } from './utils';

describe('resolveDetailFieldValue', () => {
    test('data value undefined', () => {
        expect(resolveDetailFieldValue(undefined)).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: undefined }))).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: undefined, displayValue: undefined }))).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: null, displayValue: null }))).toBe(undefined);
    });

    test('data value defined', () => {
        expect(resolveDetailFieldValue(fromJS({ value: 'test1', displayValue: undefined }))).toBe('test1');
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }))).toBe('test1');
        expect(resolveDetailFieldValue(fromJS({ value: 'test1', displayValue: 'Test Display' }))).toBe('test1');
    });

    test('resolveDisplayValue prop', () => {
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: undefined, formattedValue: 'Formatted Test 1' }),
                true,
            )
        ).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }), true)).toBe('test1');
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: 'Test Display', formattedValue: 'Test Formatted' }),
                true
            )
        ).toBe('Test Display');

        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: undefined, formattedValue: undefined }),
                false
            )
        ).toBe('test1');
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }), false)).toBe('test1');
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: 'Test Display', formattedValue: 'Test Formatted' }),
                false
            )
        ).toBe('test1');
    });

    test('resolveFormattedValue prop', () => {
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: undefined, formattedValue: undefined }),
                undefined,
                true
            )
        ).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }), undefined, true)).toBe('test1');
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: 'Test Display', formattedValue: 'Test Formatted' }),
                undefined,
                true
            )
        ).toBe('Test Formatted');

        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: undefined, formattedValue: undefined }),
                undefined,
                false
            )
        ).toBe('test1');
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }), undefined, false)).toBe('test1');
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: 'Test Display', formattedValue: 'Test Formatted' }),
                undefined,
                false
            )
        ).toBe('test1');
    });
});
