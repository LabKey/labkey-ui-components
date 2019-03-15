/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map } from 'immutable'
import { getBrowserHistory } from "./global";

import { AppURL } from "@glass/utils"

// This type is roughly equivalent to the Location object from this history package
// but here we have all fields optional to make it also compatible with the window.location object
export type Location = {
    action?: string
    hash?: string
    key?: string
    pathname?: string
    query?: Map<string, string>
    search?: string
    state?: any // {[key:string]: string}
}

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
        getBrowserHistory().replace(build(location.pathname, newParams));
    }
    else {
        getBrowserHistory().push(build(location.pathname, newParams));
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
        getBrowserHistory().replace(build(location.pathname, newParams.asImmutable()));
    }
    else {
        getBrowserHistory().push(build(location.pathname, newParams.asImmutable()))
    }
}

export function changeLocation(path: string | AppURL) {
    if (typeof path === 'string') {
        if (path.indexOf('#/') === 0) {
            path = path.replace('#/', '');
        }
    }

    getBrowserHistory().push(path.toString());
}

export function pushParameter(location: Location, key: string, value: string | number) {
    setParameter(location, key, value);
}

export function pushParameters(location: Location, params: Map<string, string | number>) {
    setParameters(location, params);
}

export function replaceLocation(path: string | AppURL) {
    getBrowserHistory().replace(path.toString())
}

export function replaceParameter(location: Location, key: string, value: string | number) {
    setParameter(location, key, value, true);
}

export function replaceParameters(location: Location, params: Map<string, string | number>) {
    setParameters(location, params, true);
}
