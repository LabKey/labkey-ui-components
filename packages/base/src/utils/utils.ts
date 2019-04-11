/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Set } from 'immutable'

import { SchemaQuery, User } from '../models/model'
import { hasParameter, toggleParameter } from '../url/ActionURL'

const emptyList = List<string>();

// 36009: Case-insensitive variant of QueryKey.decodePart
export function decodePart(s: string): string {
    return s.replace(/\$P/ig, '.')
        .replace(/\$C/ig, ',')
        .replace(/\$T/ig, '~')
        .replace(/\$B/ig, '}')
        .replace(/\$A/ig, '&')
        .replace(/\$S/ig, '/')
        .replace(/\$D/ig, '$');
}

// 36009: Case-insensitive variant of QueryKey.encodePart
export function encodePart(s: string): string {
    return s.replace(/\$/ig, '$D')
        .replace(/\//ig, '$S')
        .replace(/\&/ig, '$A')
        .replace(/\}/ig, '$B')
        .replace(/\~/ig, '$T')
        .replace(/\,/ig, '$C')
        .replace(/\./ig, '$P');
}

export function resolveKey(schema: string, query: string): string {
    return [encodePart(schema), encodePart(query)].join('/').toLowerCase();
}

export function resolveKeyFromJson(json: {schemaName: Array<string>, queryName: string}): string {
    return resolveKey(json.schemaName.join('.'), json.queryName);
}

export function resolveSchemaQuery(schemaQuery: SchemaQuery): string {
    return schemaQuery ? resolveKey(schemaQuery.getSchema(), schemaQuery.getQuery()) : null;
}

export function getSchemaQuery(encodedKey: string): SchemaQuery {
    const [ encodedSchema, encodedQuery ] = encodedKey.split('/');
    return SchemaQuery.create(decodePart(encodedSchema), decodePart(encodedQuery));
}

/**
 * Compares two string objects for doing alphanumeric (natural) sorting.
 * Returns a positive number if the first string comes after the second in a natural sort; 0 if they are equal
 * and a negative number if the second comes after the first.
 * @param aso
 * @param bso
 */
export function naturalSort(aso: string, bso: string): number {
    // http://stackoverflow.com/questions/19247495/alphanumeric-sorting-an-array-in-javascript
    if (aso === bso) return 0;
    if (aso === undefined || aso === null || aso === '') return 1;
    if (bso === undefined || bso === null || bso === '') return -1;

    let a, b, a1, b1, i = 0, n, L,
        rx=/(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;

    a = aso.toString().toLowerCase().match(rx);
    b = bso.toString().toLowerCase().match(rx);

    L = a.length;
    while (i < L) {
        if (!b[i]) return 1;
        a1 = a[i]; b1 = b[i++];
        if (a1 !== b1) {
            n = a1 - b1;
            if (!isNaN(n)) return n;
            return a1 > b1 ? 1 : -1;
        }
    }
    return b[i] ? -1 : 0;
}

/**
 * Returns a case-insensitive intersection of two List<string>.
 * @param a
 * @param b
 */
export function intersect(a: List<string>, b: List<string>): List<string> {
    if (!a || !b || a.size === 0 || b.size === 0) {
        return emptyList;
    }

    const sa = a.reduce(toLowerReducer, Set<string>().asMutable()).asImmutable();
    const sb = b.reduce(toLowerReducer, Set<string>().asMutable()).asImmutable();

    return sa.intersect(sb).toList();
}

/**
 * Returns a copy of List<string> and ensures that in copy all values are lower case strings.
 * @param a
 */
export function toLowerSafe(a: List<string>): List<string> {
    if (a) {
        return a
            .filter(v => typeof v === 'string')
            .map(v => v.toLowerCase())
            .toList();
    }

    return emptyList;
}

function toLowerReducer(s: Set<string>, v: string) {
    if (typeof v === 'string') {
        s.add(v.toLowerCase());
    }
    return s;
}

export function not(predicate: (...args: any[]) => boolean): (...args: any[]) => boolean {
    return function () {
        return !predicate.apply(this, arguments);
    };
}

export function applyDevTools() {
    if (devToolsActive() && window['devToolsExtension']) {
        return window['devToolsExtension']();
    }

    return f => f;
}

const DEV_TOOLS_URL_PARAMETER = 'devTools';

export function devToolsActive(): boolean {
    return LABKEY.devMode === true && hasParameter(DEV_TOOLS_URL_PARAMETER);
}

export function toggleDevTools() {
    if (LABKEY.devMode) {
        toggleParameter(DEV_TOOLS_URL_PARAMETER, 1);
    }
}

let DOM_COUNT = 0;
const DOM_PREFIX = 'labkey-app-';

// Generate an id with a dom-unique integer suffix
export function generateId(prefix?: string): string {
    return (prefix ? prefix : DOM_PREFIX) + DOM_COUNT++;
}

// http://davidwalsh.name/javascript-debounce-function
export function debounce(func, wait, immediate?: boolean) {
    let timeout: number;
    return function () {
        const context = this, args = arguments;
        const later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = window.setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

/**
 * Determines if a user has all of the permissions given.  If the user has only some
 * of these permissions, returns false.
 * @param user the user in question
 * @param perms the list of permission strings (See models/constants
 */
export function hasAllPermissions(user: User, perms: Array<string>): boolean {

    let allow = false;

    if (perms) {
        const allPerms = user.get('permissionsList');

        let hasAll = true;
        for (let i=0; i < perms.length; i++) {
            if (allPerms.indexOf(perms[i]) === -1) {
                hasAll = false;
                break;
            }
        }
        allow = hasAll || user.isAdmin;
    }

    return allow;
}