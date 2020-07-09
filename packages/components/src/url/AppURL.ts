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
import { List, Map, Record } from 'immutable';
import { Filter } from '@labkey/api';

export class AppURL extends Record({
    _baseUrl: undefined,
    _filters: undefined,
    _params: undefined,
}) {
    _baseUrl: string;
    _filters: List<Filter.IFilter>;
    _params: Map<string, any>;

    static create(...parts): AppURL {
        let baseUrl = '';
        for (let i = 0; i < parts.length; i++) {
            if (parts[i] === undefined || parts[i] === null || parts[i] === '') {
                let sep = '';
                throw (
                    'AppURL: Unable to create URL with empty parts. Parts are [' +
                    parts.reduce((str, part) => {
                        str += sep + part;
                        sep = ', ';
                        return str;
                    }, '') +
                    '].'
                );
            }

            const stringPart = parts[i].toString();
            const newPart = encodeURIComponent(stringPart);

            if (i === 0) {
                if (stringPart.indexOf('/') === 0) {
                    baseUrl += newPart;
                } else {
                    baseUrl += '/' + newPart;
                }
            } else {
                baseUrl += '/' + newPart;
            }
        }

        return new AppURL({ _baseUrl: baseUrl });
    }

    addFilters(...filters: Filter.IFilter[]): AppURL {
        return this.merge({
            _filters: this._filters ? this._filters.concat(filters) : List(filters),
        }) as AppURL;
    }

    addParam(key: string, value: any): AppURL {
        return this.addParams({
            [key]: value,
        });
    }

    addParams(params: any): AppURL {
        if (params) {
            let mapParams = Map<string, any>();
            mapParams = mapParams.merge(params);
            let encodedParams = Map<string, any>();
            mapParams.forEach((value, key) => {
                encodedParams = encodedParams.set(encodeURIComponent(key), encodeURIComponent(value));
            });
            return this.merge({
                _params: this._params ? this._params.merge(encodedParams) : encodedParams,
            }) as AppURL;
        }

        return this;
    }

    toHref(urlPrefix?: string): string {
        return '#' + this.toString(urlPrefix);
    }

    toQuery(urlPrefix?: string): { [key: string]: any } {
        const query = {};

        if (this._params) {
            this._params.forEach((value: any, key: string) => {
                query[key] = value;
            });
        }

        if (this._filters) {
            this._filters.forEach(f => {
                query[f.getURLParameterName(urlPrefix)] = f.getURLParameterValue();
            });
        }

        return query;
    }

    toString(urlPrefix?: string): string {
        const url = this._baseUrl;
        const parts = [];

        if (this._params) {
            this._params.forEach((value: any, key: string) => {
                parts.push(key + '=' + value);
            });
        }

        if (this._filters) {
            this._filters.forEach(f => {
                parts.push(f.getURLParameterName(urlPrefix) + '=' + f.getURLParameterValue());
            });
        }

        return url + (parts.length > 0 ? '?' + parts.join('&') : '');
    }
}

/**
 * Helper method to splice into the parts of an AppURL what needs to be replaced.
 * E.g. "/me/go/here/43" -> "/john/goes/43"
 * parts ["me", "go", "here" 43"]
 * newParts ["john", "goes"]
 * startIndex 0
 * numToReplace 2 (replace "me" and "go")
 *
 * @param parts - the original parts of the URL
 * @param newParts - the new (and only new) parts of the URL that are to be spliced in
 * @param startIndex - where in the "parts" to start replacement
 * @param numToReplace - how far in the "parts" to replace (default is 1)
 * @returns {AppURL}
 */
export function spliceURL(parts: any[], newParts: any[], startIndex: number, numToReplace?: number): AppURL {
    parts.splice(startIndex, numToReplace === undefined ? 1 : numToReplace, ...newParts);
    const decodedParts = [];
    for (var i = 0; i < parts.length; i++) {
        decodedParts.push(decodeURIComponent(parts[i]));
    }
    return AppURL.create(...decodedParts);
}
