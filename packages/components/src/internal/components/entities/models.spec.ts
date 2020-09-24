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
import { SCHEMAS } from '../../..';

import { EntityParentType } from './models';

describe('EntityParentType', () => {
    test('generateColumn captionSuffix', () => {
        let col = EntityParentType.create({ query: 'dataclass' }).generateColumn('Display Column');
        expect(col.caption).toBe('Dataclass Parents');

        col = EntityParentType.create({ schema: SCHEMAS.DATA_CLASSES.SCHEMA, query: 'dataclass' }).generateColumn(
            'Display Column'
        );
        expect(col.caption).toBe('Dataclass');

        col = EntityParentType.create({ query: 'sampletype' }).generateColumn('Display Column');
        expect(col.caption).toBe('Sampletype Parents');

        col = EntityParentType.create({ schema: SCHEMAS.SAMPLE_SETS.SCHEMA, query: 'sampletype' }).generateColumn(
            'Display Column'
        );
        expect(col.caption).toBe('Sampletype Parents');
    });
});
