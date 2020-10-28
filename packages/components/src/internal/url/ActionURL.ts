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
import { OrderedMap } from 'immutable';
import { ActionURL, Utils } from '@labkey/api';

// This is similar to LABKEY.Filter.getSortFromUrl, however, it does not assume the urlPrefix.
export function getSortFromUrl(queryString: string, urlPrefix?: string): string {
    const params = ActionURL.getParameters(queryString);
    let param = 'sort';
    if (urlPrefix) {
        param = [urlPrefix, param].join('.');
    }
    return params[param];
}

export function hasParameter(parameterName: string): boolean {
    return ActionURL.getParameter(parameterName) !== undefined;
}

export function setParameter(parameterName: string, value: any): void {
    const { search } = window.location;
    const EQ = '=',
        SEP = '&';

    const keyValues = search
        .substr(1)
        .split(SEP)
        .reduce((map, part) => {
            const [key, value] = part.split(EQ).map(p => decodeURIComponent(p));

            if (!key) {
                return map;
            }

            if (map.has(key)) {
                if (!Utils.isArray(map.get(key))) {
                    map.set(key, [map.get(key)]);
                }

                const arrValue = map.get(key);
                arrValue.push(value);

                return map.set(key, arrValue);
            }

            return map.set(key, value);
        }, OrderedMap<string, any>().asMutable());

    if (value !== undefined) {
        keyValues.set(parameterName, value);
    } else {
        keyValues.remove(parameterName);
    }

    let result = '';

    if (keyValues.size) {
        let sep = '';
        result = keyValues.reduce((search, value, key) => {
            if (!Utils.isArray(value)) {
                value = [value];
            }

            const eKey = encodeURIComponent(key);
            value.forEach(v => {
                search += sep + eKey + EQ + encodeURIComponent(v);
                sep = SEP;
            });

            return search;
        }, '?');
    }

    window.location.search = result;
}

export function imageURL(iconDir: string, src: string): string {
    return [ActionURL.getContextPath(), iconDir, src].join('/');
}

export function toggleParameter(parameterName: string, value: any): void {
    setParameter(parameterName, hasParameter(parameterName) ? undefined : value);
}
