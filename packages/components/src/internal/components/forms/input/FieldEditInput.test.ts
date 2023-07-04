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
import { cleanProps } from './FieldEditInput';

describe('clearProps', () => {
    test('Empty values', () => {
        const emptyObj = {};
        expect(cleanProps(undefined)).toBeUndefined();
        expect(cleanProps(emptyObj)).toBe(emptyObj);
    });

    test('Remove values', () => {
        let props = { a: 1, b: 2, c: 3 };
        expect(cleanProps(props, 'd', 'e', 'f')).toMatchObject({ a: 1, b: 2, c: 3 });

        props = { a: 1, b: 2, c: 3 };
        expect(cleanProps(props, 'a', 'e', 'f')).toMatchObject({ b: 2, c: 3 });
    });
});
