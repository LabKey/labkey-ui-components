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
import { List } from 'immutable';
import { Filter } from '@labkey/api';

export function isEqual(first: List<Filter.IFilter>, second: List<Filter.IFilter>): boolean {
    if (first.size !== second.size) {
        return false;
    }

    let isEqual = true;
    first.forEach((f: Filter.IFilter, i: number) => {
        const s = second.get(i);
        if (f === undefined) {
            if (s !== undefined) {
                isEqual = false;
                return false;
            }
        }

        if (s === undefined) {
            isEqual = false;
            return false;
        }

        if (f.getURLParameterName() !== s.getURLParameterName()) {
            isEqual = false;
            return false;
        } else if (JSON.stringify(f.getURLParameterValue()) !== JSON.stringify(s.getURLParameterValue())) {
            isEqual = false;
            return false;
        }
    });

    return isEqual;
}
