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
import { InjectedRouter, WithRouterProps } from 'react-router';

// We export Location like this in order to avoid having a direct dependency on the History library
export type Location = WithRouterProps['location'];

function setParameters(
    router: InjectedRouter,
    location: Location,
    params: Record<string, string | number>,
    asReplace = false
): void {
    const query = { ...location.query };

    Object.keys(params).forEach(key => {
        const value = params[key];

        if (value === undefined) {
            delete query[key];
        } else {
            query[key] = value;
        }
    });

    if (asReplace) {
        router.replace({ ...location, query });
    } else {
        router.push({ ...location, query });
    }
}

export function removeParameters(router: InjectedRouter, location: Location, ...params: string[]): void {
    if (!params) return;
    const paramsObj = params.reduce((result, param) => {
        result[param] = undefined;
        return result;
    }, {});
    setParameters(router, location, paramsObj, true);
}

export function replaceParameters(
    router: InjectedRouter,
    location: Location,
    params: Record<string, string | number>
): void {
    setParameters(router, location, params, true);
}

export function pushParameters(
    router: InjectedRouter,
    location: Location,
    params: Record<string, string | number>
): void {
    setParameters(router, location, params);
}

export function resetParameters(router: InjectedRouter, location: Location, except: string[] = []): void {
    const updatedParams = Object.keys(location.query).reduce((result, key: string) => {
        if (except.indexOf(key) > -1) {
            result[key] = location.query[key];
        } else {
            result[key] = undefined;
        }

        return result;
    }, {});

    setParameters(router, location, updatedParams);
}
