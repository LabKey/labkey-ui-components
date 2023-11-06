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
import { List, Map } from 'immutable';
import { InjectedRouter, WithRouterProps } from 'react-router';

import { getBrowserHistoryDeprecated } from './global';

// This type is roughly equivalent to the Location object from this history package
// but here we have all fields optional to make it also compatible with the window.location object
// we are not making use of action, key, state fields for now, but keeping them so the type is consistent with history.location type
export type Location = {
    action?: string;
    hash?: string;
    key?: string;
    pathname?: string;
    query?: any; // {[key:string]: string}
    search?: string;
    state?: any; // {[key:string]: string}
};

export function getLocation(): Location {
    const location = getBrowserHistoryDeprecated().location;
    const { action, pathname, search, key, state } = location;

    let hash = location.hash;
    let query = Map<string, string>().asMutable();
    const parseParams = p => {
        const keyVal = p.split('=');
        query = query.set(keyVal[0].trim(), keyVal[1].trim());
    };

    // check for query params that are before the hash
    if (search && search.length > 0) {
        const params = search.substring(1).split('&');
        params.forEach(parseParams);
    }

    // and check for query params after the hash
    if (hash && hash.indexOf('?') > -1) {
        const index = hash.indexOf('?');
        const params = hash.substring(index + 1).split('&');
        params.forEach(parseParams);
        hash = hash.substring(0, index);
    }

    query = query.asImmutable();

    return { action, pathname, search, key, state, hash, query };
}

export function buildQueryString(params: Map<string, string | number>): string {
    let q = '',
        sep = '';
    params.forEach((v, k) => {
        q += sep + k + '=' + v;
        sep = '&';
    });

    return q.length > 0 ? '?' + q : '';
}

export function build(pathname: string, hash?: string, params?: Map<string, string | number>): string {
    return pathname + (hash || '') + (params ? buildQueryString(params) : '');
}

function setParameterDeprecated(location: Location, key: string, value: string | number, asReplace = false): void {
    const params = Map<string, string | number>();
    setParametersDeprecated(location, params.set(key, value), asReplace);
}

function setParametersDeprecated(location: Location, params: Map<string, string | number>, asReplace = false): void {
    const { query } = location;

    const newParams = Map<string, string | number>(query).asMutable();
    params.forEach((value, key) => {
        if (value === undefined) {
            newParams.delete(key);
        } else {
            newParams.set(key, value);
        }
    });

    if (asReplace) {
        getBrowserHistoryDeprecated().replace(build(location.pathname, location.hash, newParams.asImmutable()));
    } else {
        getBrowserHistoryDeprecated().push(build(location.pathname, location.hash, newParams.asImmutable()));
    }
}

export function pushParameterDeprecated(location: Location, key: string, value: string | number): void {
    setParameterDeprecated(location, key, value);
}

export function removeParametersDeprecated(location: Location, ...params: string[]): void {
    if (!params) return;
    setParametersDeprecated(
        location,
        params.reduce((map, param) => map.set(param, undefined), Map<string, string>()),
        true
    );
}

export function replaceParameterDeprecated(location: Location, key: string, value: string | number): void {
    setParameterDeprecated(location, key, value, true);
}

export function replaceParametersDeprecated(location: Location, params: Map<string, string | number>): void {
    setParametersDeprecated(location, params, true);
}

export function resetParametersDeprecated(except?: List<string>): void {
    const location = getLocation();

    const emptyParams = location.query.map((value: string, key: string) => {
        if (except && except.contains(key)) {
            return value;
        } else {
            return undefined;
        }
    });

    setParametersDeprecated(location, emptyParams);
}

// We don't have a direct dependency on ReactRouter, so we do this for now.
type RRLocation = WithRouterProps['location'];

function setParameters(
    router: InjectedRouter,
    location: RRLocation,
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

export function removeParameters(router: InjectedRouter, location: RRLocation, ...params: string[]): void {
    if (!params) return;
    const paramsObj = params.reduce((result, param) => {
        result[param] = undefined;
        return result;
    }, {});
    setParameters(router, location, paramsObj, true);
}

export function replaceParameters(
    router: InjectedRouter,
    location: RRLocation,
    params: Record<string, string | number>
): void {
    setParameters(router, location, params, true);
}

export function pushParameters(
    router: InjectedRouter,
    location: RRLocation,
    params: Record<string, string | number>
): void {
    setParameters(router, location, params);
}

export function resetParameters(router: InjectedRouter, location: RRLocation, except: string[] = []): void {
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
