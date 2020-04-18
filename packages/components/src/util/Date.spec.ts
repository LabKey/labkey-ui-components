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
import { generateNameWithTimestamp } from './Date';

describe('generateNameWithTimestamp', () => {
    test('generated text', () => {
        const prefix = 'Test';
        const name = generateNameWithTimestamp(prefix);
        expect(name.indexOf(prefix + '_') === 0).toBeTruthy();
        expect(name.length === prefix.length + 20).toBeTruthy(); // 2 underscores, 10 for date string, 8 for time string
    });
});
