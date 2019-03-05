/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map, OrderedMap, Record } from 'immutable'
import { ActionURL, Filter, Utils } from '@labkey/api'

function applyURL(prop: string, options?: BuildURLOptions): string {
    if (options) {
        if (typeof(options[prop]) === 'string') {
            return options[prop];
        }
        else if (options[prop] instanceof AppURL) {
            return window.location.pathname + options[prop].toHref();
        }
    }
}

interface BuildURLOptions {
    cancelURL?: string | AppURL
    container?: string
    returnURL?: boolean | string | AppURL // defaults to true when action does not end in '.api'
    successURL?: string | AppURL
}

export function buildURL(controller: string, action: string, params?: any, options?: BuildURLOptions): string {

    let constructedParams = {
        // server expects camel-case URL (e.g. Url)
        cancelUrl: undefined,
        returnUrl: undefined,
        successUrl: undefined
    };

    const applyReturnURL = !options || (options && options.returnURL !== false);

    if (applyReturnURL) {
        if (options && (typeof(options.returnURL) === 'string' || options.returnURL instanceof AppURL)) {
            constructedParams.returnUrl = applyURL('returnURL', options);
        }
        else if (action.toLowerCase().indexOf('.api') === -1 && action.toLowerCase().indexOf('.post') === -1) {
            // use the current URL
            constructedParams.returnUrl = window.location.pathname + (window.location.hash ? window.location.hash : '');
        }
    }

    constructedParams.cancelUrl = applyURL('cancelURL', options);
    constructedParams.successUrl = applyURL('successURL', options);

    Object.keys(constructedParams).forEach((key) => {
        if (!constructedParams[key]) {
            // remove any param keys that do not have values
            delete constructedParams[key]
        }
    });

    const parameters = Object.assign(params ? params : {}, constructedParams);

    return ActionURL.buildURL(
        controller,
        action,
        options && options.container ? options.container : undefined,
        parameters
    );
}

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
    let { search } = window.location;
    const EQ = '=', SEP = '&';

    let keyValues = search.substr(1).split(SEP).reduce((map, part) => {
        const [ key, value ] = part.split(EQ).map(p => decodeURIComponent(p));

        if (!key) {
            return map;
        }

        if (map.has(key)) {
            if (!Utils.isArray(map.get(key))) {
                map.set(key, [map.get(key)]);
            }

            let arrValue = map.get(key);
            arrValue.push(value);

            return map.set(key, arrValue);
        }

        return map.set(key, value);
    }, OrderedMap<string, any>().asMutable());

    if (value !== undefined) {
        keyValues.set(parameterName, value);
    }
    else {
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
            value.forEach((v) => {
                search += sep + eKey + EQ + encodeURIComponent(v);
                sep = SEP;
            });

            return search;
        }, '?');
    }

    window.location.search = result;
}

export function imageURL(application: string, src: string): string {
    return [
        ActionURL.getContextPath(),
        application, // TODO get this from global state somewhere?
        'images',
        src
    ].join('/');
}

export function toggleParameter(parameterName: string, value: any): void {
    setParameter(parameterName, hasParameter(parameterName) ? undefined : value);
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