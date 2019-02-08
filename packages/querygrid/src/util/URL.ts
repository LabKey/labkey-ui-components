/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map, Record } from 'immutable'
import createHistory from 'history/createBrowserHistory'
import { Filter } from '@labkey/api'

export type Location = {
    pathname?: string
    search?: string
    query?: Map<string, string>
    state?: any // {[key:string]: string}
}

// TODO put this in the global state?
export const history = createHistory();

history.listen((location, action) => {
    // location is an object like window.location
    console.log("History change", action, location.pathname, location.search, location.state)
});

export function getLocation() : Location
{
    let location : Location = window.location;
    let query =  Map<string, string>().asMutable();
    if (location.search.length > 0)
    {
        let params = location.search.substring(1).split("&");
        params.forEach( (p) => {
            let keyVal = p.split("=");
            query.set(decodeURI(keyVal[0].trim()), decodeURI(keyVal[1].trim()));
        });
    }
    location.query = query.asImmutable();
    return location;
}

function build(pathname: string, params: Map<string, string | number>): string {
    var q = '', sep = '';

    params.forEach((v, k) => {
        q += sep + k + '=' + v;
        sep = '&';
    });

    return pathname + (q.length > 0 ? '?' + q : '');
}

function setParameter(location: Location, key: string, value: string | number, asReplace: boolean = false) {
    const { query } = location;

    let newParams;
    let queryMap = Map<string, string | number>(query);

    // this allows for removing blank parameters
    if (value === undefined || value === '') {
        newParams = queryMap.delete(key);
    }
    else {
        newParams = queryMap.set(key, value);
    }

    // will this version of replace and push from history interfere with the react router versions?
    if (asReplace) {
        history.replace(build(location.pathname, newParams));
    }
    else {
        history.push(build(location.pathname, newParams));
    }
}

function setParameters(location: Location, params: Map<string, string | number>, asReplace: boolean = false) {
    const { query } = location;

    let newParams = Map<string, string | number>(query).asMutable();


    params.forEach((value, key) => {
        if (value === undefined || value === '') {
            newParams.delete(key);
        }
        else {
            newParams.set(key, value);
        }
    });

    if (asReplace) {
        history.replace(build(location.pathname, newParams.asImmutable()));
    }
    else {
        history.push(build(location.pathname, newParams.asImmutable()))
    }
}

export function changeLocation(path: string | AppURL) {
    if (typeof path === 'string') {
        if (path.indexOf('#/') === 0) {
            path = path.replace('#/', '');
        }
    }

    history.push(path.toString());
}

export function pushParameter(location: Location, key: string, value: string | number) {
    return setParameter(location, key, value);
}

export function pushParameters(location: Location, params: Map<string, string | number>) {
    return setParameters(location, params);
}

export function replaceLocation(path: string | AppURL) {
    history.replace(path.toString())
}

export function replaceParameter(location: Location, key: string, value: string | number) {
    return setParameter(location, key, value, true);
}

export function replaceParameters(location: Location, params: Map<string, string | number>) {
    return setParameters(location, params, true);
}

export class AppURL extends Record({
    _baseUrl: undefined,
    _filters: undefined,
    _params: undefined
}) {
    _baseUrl: string;
    _filters: List<Filter.Filter>;
    _params: Map<string, any>;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(...parts): AppURL {

        let baseUrl = '';
        for (let i=0; i < parts.length; i++) {
            if (parts[i] === undefined || parts[i] === null || parts[i] === '') {
                let sep = '';
                throw 'AppURL: Unable to create URL with empty parts. Parts are [' + parts.reduce((str, part) => {
                    str += sep + part;
                    sep = ', ';
                    return str;
                }, '') + '].';
            }

            const stringPart = parts[i].toString();
            let newPart = encodeURIComponent(stringPart);

            if (i == 0) {
                if (stringPart.indexOf('/') === 0) {
                    baseUrl += newPart;
                }
                else {
                    baseUrl += '/' + newPart;
                }
            }
            else {
                baseUrl += '/' + newPart;
            }
        }

        // TODO: Stop toLowerCase as it can break case-sensitive keys (e.g. /q/lists/someList/myKeyField)
        return new AppURL({
            _baseUrl: baseUrl.toLowerCase()
        })
    }

    addFilters(...filters: Array<Filter.Filter>): AppURL {
        return this.merge({
            _filters: this._filters ? this._filters.concat(filters) : List(filters)
        }) as AppURL;
    }

    addParam(key: string, value: any): AppURL {
        return this.addParams({
            [key]: value
        });
    }

    addParams(params: any): AppURL {
        if (params) {
            return this.merge({
                _params: this._params ? this._params.merge(params) : Map(params)
            }) as AppURL;
        }

        return this;
    }

    toHref(urlPrefix?: string): string {
        return '#' + this.toString(urlPrefix);
    }

    toQuery(urlPrefix?: string): {[key: string]: any} {
        let query = {};

        if (this._params) {
            this._params.forEach((value: any, key: string) => {
                query[key] = value;
            });
        }

        if (this._filters) {
            this._filters.forEach((f) => {
                query[f.getURLParameterName(urlPrefix)] = f.getURLParameterValue();
            });
        }

        return query;
    }

    toString(urlPrefix?: string): string {
        let url = this._baseUrl;
        let parts = [];

        if (this._params) {
            this._params.forEach((value: any, key: string) => {
                parts.push(key + '=' + value);
            });
        }

        if (this._filters) {
            this._filters.forEach((f) => {
                parts.push(f.getURLParameterName(urlPrefix) + '=' + f.getURLParameterValue());
            });
        }

        return url + (parts.length > 0 ? '?' + parts.join('&') : '');
    };
}
