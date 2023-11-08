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
import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';

import { allowReimportAssayRun, getRunPropertiesFileName } from './actions';

describe('allowReimportAssayRun', () => {
    test('require insert permissions', () => {
        expect(allowReimportAssayRun(TEST_USER_READER, 'a', 'a')).toBe(false);
        expect(allowReimportAssayRun(TEST_USER_EDITOR, 'a', 'a')).toBe(true);
    });
    test('match containerId', () => {
        expect(allowReimportAssayRun(TEST_USER_EDITOR, undefined, undefined)).toBe(false);
        expect(allowReimportAssayRun(TEST_USER_EDITOR, null, undefined)).toBe(false);
        expect(allowReimportAssayRun(TEST_USER_EDITOR, '', '')).toBe(false);
        expect(allowReimportAssayRun(TEST_USER_EDITOR, 'a', 'A')).toBe(false);
        expect(allowReimportAssayRun(TEST_USER_EDITOR, 'B', 'B')).toBe(true);
    });
});

describe('getRunPropertiesFileName', () => {
    test('abc', () => {
        expect(getRunPropertiesFileName(undefined)).toBe(undefined);
        expect(getRunPropertiesFileName({})).toBe(undefined);
        expect(getRunPropertiesFileName({ DataOutputs: [] })).toBe(undefined);
        expect(getRunPropertiesFileName({ DataOutputs: [{ displayValue: 'test1' }, { displayValue: 'test2' }] })).toBe(
            undefined
        );
        expect(getRunPropertiesFileName({ DataOutputs: [{ displayValue: 'test1' }] })).toBe('test1');
    });
});
