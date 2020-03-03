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
import {List, Map} from 'immutable';

import { getBrowserHistory } from './global';

// This type is roughly equivalent to the Location object from this history package
// but here we have all fields optional to make it also compatible with the window.location object
export type Location = {
    action?: string
    hash?: string
    key?: string
    pathname?: string
    query?: any //{[key:string]: string}
    search?: string
    state?: any // {[key:string]: string}
}

export function getLocation() : Location {
    // FIXME: Instead of manipulating the location object like we do here (which has side effects) we should return a
    //  new object every time.
    let location : Location = getBrowserHistory().location;
    // FIXME: Side effect! location.query is only ever available after the first time this function is called becuase we
    //  manipulate the object in place.
    let query =  Map<string, string>(location.query).asMutable();
    const parseParams = (p => {
        const keyVal = p.split('=');
        query.set(decodeURIComponent(keyVal[0].trim()), decodeURIComponent(keyVal[1].trim()));
    });

    // FIXME: Why would there ever be a query string before the hash? We should consider dropping this case.
    // check for query params that are before the hash
    if (location.search && location.search.length > 0) {
        const params = location.search.substring(1).split('&');
        params.forEach(parseParams);
    }

    // and check for query params after the hash
    if (location.hash && location.hash.indexOf('?') > -1) {
        const index = location.hash.indexOf('?');
        const params = location.hash.substring(index + 1).split('&');
        params.forEach(parseParams);

        // FIXME: we should not be modifying this object in place, the next caller to getBrowserHistory() will get the
        //  modified location object.
        location.hash = location.hash.substring(0, index);
    }

    // FIXME: we should not be modifying this object in place, the next caller to getBrowserHistory() will get the
    //  modified location object.
    location.query = query.asImmutable();
    return location;
}

export function getRouteFromLocationHash(hash: string) {
    if (hash) {
        const index = hash.indexOf('?');
        if (index > -1) {
            return hash.substring(0, index);
        }

        return hash;
    }

    return undefined;
}

export function buildQueryString(params: Map<string, string | number>): string {
    let q = '', sep = '';
    params.forEach((v, k) => {
        q += sep + k + '=' + v;
        sep = '&';
    });

    return q.length > 0 ? '?' + q : '';
}

function build(pathname: string, hash?: string, params?: Map<string, string | number>): string {
    return pathname + (hash || '') + (params ? buildQueryString(params) : '');
}

function setParameter(location: Location, key: string, value: string | number, asReplace: boolean = false) {
    const params = Map<string, string | number>();
    setParameters(location, params.set(key, value), asReplace);
}

function setParameters(location: Location, params: Map<string, string | number>, asReplace: boolean = false) {
    const { query } = location;

    let newParams = Map<string, string | number>(query).asMutable();
    params.forEach((value, key) => {
        if (value === undefined) {
            newParams.delete(key);
        }
        else {
            newParams.set(key, value);
        }
    });

    if (asReplace) {
        getBrowserHistory().replace(build(location.pathname, location.hash, newParams.asImmutable()));
    }
    else {
        getBrowserHistory().push(build(location.pathname, location.hash, newParams.asImmutable()))
    }
}

export function pushParameter(location: Location, key: string, value: string | number) {
    setParameter(location, key, value);
}

export function pushParameters(location: Location, params: Map<string, string | number>) {
    setParameters(location, params);
}

export function replaceParameter(location: Location, key: string, value: string | number) {
    setParameter(location, key, value, true);
}

export function replaceParameters(location: Location, params: Map<string, string | number>) {
    setParameters(location, params, true);
}

export function resetParameters(except?: List<string>) {
    const location = getLocation();

    const emptyParams = location.query.map((value: string, key: string) => {
        if (except && except.contains(key)) {
            return value;
        } else {
            return undefined;
        }
    });

    setParameters(location, emptyParams);
}
