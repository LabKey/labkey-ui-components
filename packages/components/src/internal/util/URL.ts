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
import { SetURLSearchParams } from 'react-router-dom';

import { QueryParams } from '../routerTypes';

function getQueryParamsFromSearchParams(searchParams: URLSearchParams): QueryParams {
    return [...searchParams.entries()].reduce((result, tuple) => {
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

/**
 * Takes a search string (typically from Location) or URLSearchParams (typically from useSearchParams hook) and converts
 * it to a QueryParams object. If the same key is used multiple times in a search string (e.g. ?foo=bar&foo=baz) it will
 * return an array of values for that key, if the key only appears once it will return a string for that kΩey. If you
 * know the key you are looking for will not be an array use: const myValue = getQueryParams(search).myValue as string;
 * @param search
 */
export function getQueryParams(search: string | URLSearchParams): QueryParams {
    if (!search) return {};

    if (search instanceof URLSearchParams) {
        return getQueryParamsFromSearchParams(search);
    }

    return getQueryParamsFromSearchParams(new URLSearchParams(search));
}

function setParameters(setParams: SetURLSearchParams, params: QueryParams, asReplace = false): void {
    const options = asReplace ? { replace: true } : undefined;

    setParams(current => {
        const query = getQueryParams(current);
        Object.keys(params).forEach(key => {
            const value = params[key];

            if (value === undefined) {
                delete query[key];
            } else {
                query[key] = value;
            }
        });

        return query;
    }, options);
}

export function removeParameters(setParams: SetURLSearchParams, ...params: string[]): void {
    if (!params) return;
    const paramsObj = params.reduce((result, param) => {
        result[param] = undefined;
        return result;
    }, {});
    setParameters(setParams, paramsObj, true);
}

export function replaceParameters(setParams: SetURLSearchParams, params: QueryParams): void {
    setParameters(setParams, params, true);
}

export function pushParameters(setParams: SetURLSearchParams, params: QueryParams): void {
    setParameters(setParams, params);
}

export function resetParameters(setParams: SetURLSearchParams, except: string[] = []): void {
    setParams(current => {
        const currentParams = getQueryParams(current);
        return Object.keys(currentParams).reduce((result, key: string) => {
            if (except.indexOf(key) > -1) {
                result[key] = currentParams[key];
            } else {
                result[key] = undefined;
            }

            return result;
        }, {});
    });
}
