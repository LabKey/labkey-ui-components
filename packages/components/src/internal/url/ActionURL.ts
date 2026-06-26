/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { OrderedMap } from 'immutable';
import { ActionURL, Utils } from '@labkey/api';

import { AppURL } from './AppURL';

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
    const { search } = window.location;
    const EQ = '=',
        SEP = '&';

    const keyValues = search
        .substr(1)
        .split(SEP)
        .reduce((map, part) => {
            const [key, value] = part.split(EQ).map(p => decodeURIComponent(p));

            if (!key) {
                return map;
            }

            if (map.has(key)) {
                if (!Utils.isArray(map.get(key))) {
                    map.set(key, [map.get(key)]);
                }

                const arrValue = map.get(key);
                arrValue.push(value);

                return map.set(key, arrValue);
            }

            return map.set(key, value);
        }, OrderedMap<string, any>().asMutable());

    if (value !== undefined) {
        keyValues.set(parameterName, value);
    } else {
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
            value.forEach(v => {
                search += sep + eKey + EQ + encodeURIComponent(v);
                sep = SEP;
            });

            return search;
        }, '?');
    }

    window.location.search = result;
}

export function imageURL(iconDir: string, src: string): string {
    return [ActionURL.getContextPath(), iconDir, src].join('/');
}

export function toggleParameter(parameterName: string, value: any): void {
    setParameter(parameterName, hasParameter(parameterName) ? undefined : value);
}

// GitHub Issue #1023: Navigate the browser to the given URL, guarding against open-redirect vulnerabilities.
//  - AppURL: always constructed by us to point at one of our apps, so it is inherently local and we navigate directly.
//  - A string that resolves to the current origin (relative URLs, buildURL() results, same-host absolute URLs):
//    inherently local, so we navigate directly.
//  - Any other string (a different origin, or an unparseable/opaque value such as a javascript: URL): treated as a
//    potential open-redirect target and routed through core/safeRedirect for authoritative server-side validation
//    (URLHelper.isAllowableHost, which also honors the admin external-redirect allowlist and the home-page fallback).
// Note: For those rare cases where we do need to go to a trusted external URL, set window.location.href directly instead of using redirect().
export function redirect(url: AppURL | string): void {
    window.location.href = getRedirectUrl(url);
}

export function getRedirectUrl(url: AppURL | string): string {
    if (url instanceof AppURL) {
        return url.toHref();
    }

    if (isSameOrigin(url)) {
        return url;
    }

    return ActionURL.buildURL('core', 'safeRedirect', undefined, { returnUrl: url });
}

function isSameOrigin(url: string): boolean {
    try {
        return new URL(url, window.location.href).origin === window.location.origin;
    } catch {
        return false;
    }
}
