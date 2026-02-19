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
import { ActionURL, Filter, getServerContext } from '@labkey/api';

import { getPrimaryAppProductId } from '../app/products';

export function applyURL(prop: string, options?: BuildURLOptions): string {
    if (options) {
        if (typeof options[prop] === 'string') {
            return options[prop];
        } else if (options[prop] instanceof AppURL) {
            return window.location.pathname + options[prop].toHref();
        }
    }
}

interface BuildURLOptions {
    cancelUrl?: string | AppURL;
    container?: string;
    returnUrl?: boolean | string | AppURL; // defaults to true when action does not end in '.api'
    successUrl?: string | AppURL;
}

export function buildURL(controller: string, action: string, params?: any, options?: BuildURLOptions): string {
    const constructedParams = {
        // server expects camel-case URL (e.g. Url)
        cancelUrl: undefined,
        returnUrl: undefined,
        successUrl: undefined,
    };

    const applyReturnURL = !options || (options && options.returnUrl !== false);

    if (applyReturnURL) {
        if (options && (typeof options.returnUrl === 'string' || options.returnUrl instanceof AppURL)) {
            constructedParams.returnUrl = applyURL('returnUrl', options);
        } else if (action.toLowerCase().indexOf('.api') === -1 && action.toLowerCase().indexOf('.post') === -1) {
            // use the current URL
            constructedParams.returnUrl = window.location.pathname + (window.location.hash ? window.location.hash : '');
        }
    }

    constructedParams.cancelUrl = applyURL('cancelUrl', options);
    constructedParams.successUrl = applyURL('successUrl', options);

    Object.keys(constructedParams).forEach(key => {
        if (!constructedParams[key]) {
            // remove any param keys that do not have values
            delete constructedParams[key];
        }
    });

    const parameters = Object.assign(params ? params : {}, constructedParams);

    return ActionURL.buildURL(controller, action, options?.container, parameters);
}

type BaseQueryParamValue = string | number | boolean | null | undefined;
export type QueryParamValue = BaseQueryParamValue | BaseQueryParamValue[];

export class AppURL {
    declare _basePath: string;
    declare _filters: Filter.IFilter[];
    declare _params: Record<string, QueryParamValue>;
    declare _containerPath: string;
    declare _productId: string;

    constructor(partial: Partial<AppURL>) {
        Object.assign(this, partial);
    }

    static create(...parts): AppURL {
        let basePath = '';
        for (let i = 0; i < parts.length; i++) {
            if (parts[i] === undefined || parts[i] === null || parts[i] === '') {
                if (getServerContext().devMode) {
                    throw (
                        'AppURL: Unable to create URL with empty parts. Parts are [' +
                        parts.map(p => p + '').join(', ') +
                        '].'
                    );
                } else {
                    console.error(
                        'Unable to create URL with empty parts. Parts are [' + parts.map(p => p + '').join(', ') + '].'
                    );
                }
            }

            if (parts[i]) {
                const stringPart = parts[i].toString();
                const newPart = encodeURIComponent(stringPart);

                if (i === 0) {
                    if (stringPart.indexOf('/') === 0) {
                        basePath += newPart;
                    } else {
                        basePath += '/' + newPart;
                    }
                } else {
                    basePath += '/' + newPart;
                }
            }
        }

        return new AppURL({ _basePath: basePath });
    }

    /**
     * Creates an AppURL from a URL returned by our MenuSections API
     */
    static fromMenuUrl(url: string, productId: string, containerPath: string): AppURL {
        if (url === undefined) return undefined;
        if (!url.startsWith('#')) return undefined;
        let path = url.replace('#', '');
        if (path.indexOf('?') > -1) path = path.substring(0, path.indexOf('?'));

        return new AppURL({ _basePath: path, _containerPath: containerPath, _productId: productId });
    }

    addFilters(...filters: Filter.IFilter[]): AppURL {
        return new AppURL({
            ...this,
            _filters: this._filters ? this._filters.concat(filters) : filters,
        });
    }

    addParam(key: string, value: QueryParamValue): AppURL {
        return this.addParams({ [key]: value });
    }

    addParams(params: Record<string, QueryParamValue>): AppURL {
        if (params) {
            const nonEmptyParams = Object.keys(params).reduce(
                (result, key) => {
                    const value = params[key];
                    if (value !== null && value !== undefined) result[key] = value;
                    return result;
                },
                { ...this._params } as Record<string, QueryParamValue>
            );
            return new AppURL({ ...this, _params: nonEmptyParams });
        }

        return this;
    }

    setContainerPath(containerPath: string): AppURL {
        return new AppURL({ ...this, _containerPath: containerPath });
    }

    getContainerPath(): string {
        return this._containerPath ?? ActionURL.getContainer();
    }

    setProductId(productId: string): AppURL {
        return new AppURL({ ...this, _productId: productId });
    }

    getProductId(): string {
        return this._productId ?? getPrimaryAppProductId() ?? '';
    }

    /**
     * Returns true if the AppURL points to a path for the current app in the current container
     */
    isAppPath(): boolean {
        const currentContainerPath = ActionURL.getContainer();
        const targetContainerPath = this.getContainerPath();
        const currentProductId = ActionURL.getController().toLowerCase();
        const targetProductId = this.getProductId()?.toLowerCase() ?? '';
        return currentContainerPath === targetContainerPath && currentProductId === targetProductId;
    }

    /**
     * @deprecated You should only need this if you're rendering an anchor tag, and you should not do that. If you are
     * trying to use this for something other than rendering an anchor tag update your code to use AppURL objects and
     * render AppLink.
     * @param urlPrefix
     */
    toHref(urlPrefix?: string): string {
        const href = this.toString(urlPrefix);
        if (this.isAppPath()) return '#' + href;
        return href;
    }

    /**
     * Returns the base URL needed to generate a full LKS URL to one of our apps. If you did not set productId it will
     * assume the primary product id (e.g. SM, Bio).
     * e.g. for SM it returns: /MyContainer/samplemanagement-app.view#
     */
    baseUrl(): string {
        const controller = this.getProductId().toLowerCase();
        const currentController = ActionURL.getController().toLowerCase();
        const currentAction = ActionURL.getAction().toLowerCase();
        let action = 'app';

        if (controller === currentController && currentAction === 'appdev') {
            action = 'appDev';
        }

        return ActionURL.buildURL(controller, action, this._containerPath);
    }

    /**
     * Returns the string of the app path needed to navigate within one of our apps. If this AppURL points to a
     * different app
     * @param urlPrefix
     */
    toString(urlPrefix?: string): string {
        let appPath = this._basePath;
        const allParams = { ...this._params };

        if (this._filters) {
            this._filters.forEach(f => {
                allParams[f.getURLParameterName(urlPrefix)] = f.getURLParameterValue();
            });
        }

        const queryString = ActionURL.queryString(allParams);
        if (queryString) appPath += `?${queryString}`;

        if (!this.isAppPath()) return `${this.baseUrl()}#${appPath}`;
        return appPath;
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
    const decodedParts = parts.map(p => decodeURIComponent(p)).filter(p => !!p);
    return AppURL.create(...decodedParts);
}
