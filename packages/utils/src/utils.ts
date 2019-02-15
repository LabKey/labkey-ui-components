/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Set } from 'immutable'

const emptyList = List<string>();

/**
 * Compares two string objects for doing alphanumeric (natural) sorting.
 * Returns 1 if the first string comes after the second in a natural sort; 0 if they are equal
 * and -1 if the second comes after the first.
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