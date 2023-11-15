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
import { Location } from 'history';
import { SetURLSearchParams } from 'react-router-dom';

import { DeprecatedRouter, QueryParams } from '../routerTypes';

/**
 * Takes a search string (typically from Location) and converts it to a QueryParams object. If the same key is used
 * multiple times in a search string (e.g. ?foo=bar&foo=baz) it will return an array of values for that key, if the key
 * only appears once it will return a string for that key. If you know the key you are looking for will not be an array
 * use: const myValue = getQueryParams(search).myValue as string;
 * @param search
 */
export function getQueryParams(search: string): QueryParams {
    if (!search) return {};
    const paramsArray = new URLSearchParams(search).entries();
    return [...paramsArray].reduce((result, tuple) => {
        const [key, value] = tuple;
        if (result.hasOwnProperty(key)) {
            if (Array.isArray(result[key])) {
                result[key].push(value);
            } else {
                result[key] = [result[key], value];
            }
        } else {
            result[key] = value;
        }
        return result;
    }, {});
}

// TODO: convert this to use SetURLSearchParams, which negates the need for router and location as it is a React style
//  useState setter that lets us pass exactly what we want, or a function that accesses the current params while setting
function setParameters(router: DeprecatedRouter, location: Location, params: QueryParams, asReplace = false): void {
    const query = getQueryParams(location.search);

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

export function removeParameters(router: DeprecatedRouter, location: Location, ...params: string[]): void {
    if (!params) return;
    const paramsObj = params.reduce((result, param) => {
        result[param] = undefined;
        return result;
    }, {});
    setParameters(router, location, paramsObj, true);
}

export function replaceParameters(router: DeprecatedRouter, location: Location, params: QueryParams): void {
    setParameters(router, location, params, true);
}

export function pushParameters(router: DeprecatedRouter, location: Location, params: QueryParams): void {
    setParameters(router, location, params);
}

export function resetParameters(router: DeprecatedRouter, location: Location, except: string[] = []): void {
    const currentParams = getQueryParams(location.search);
    const updatedParams = Object.keys(currentParams).reduce((result, key: string) => {
        if (except.indexOf(key) > -1) {
            result[key] = currentParams[key];
        } else {
            result[key] = undefined;
        }

        return result;
    }, {});

    setParameters(router, location, updatedParams);
}
