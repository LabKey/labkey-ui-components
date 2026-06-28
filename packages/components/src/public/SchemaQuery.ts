/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
const APP_SELECTION_PREFIX = 'appkey';
export const SELECTION_SNAPSHOT_SEP = '__snapshot__'; // Defined in this module to prevent circular imports

/**
 * selectionKeys for snapshot selections (created via createSnapshotSelectionKey) are postfixed with __snapshot__<uuid>,
 * this method strips the selection snapshot separator and uuid from the selectionKey.
 * @param value
 */
function stripSelectionSnapshotId(value: string): string {
    const snapshotIndex = value.indexOf(SELECTION_SNAPSHOT_SEP);
    if (snapshotIndex > -1) return value.slice(0, snapshotIndex);
    return value;
}

// 36009: Case-insensitive variant of QueryKey.decodePart
export function decodePart(s: string): string {
    if (!s) return s;

    return s
        .replace(/\$P/gi, '.')
        .replace(/\$C/gi, ',')
        .replace(/\$T/gi, '~')
        .replace(/\$B/gi, '}')
        .replace(/\$A/gi, '&')
        .replace(/\$S/gi, '/')
        .replace(/\$D/gi, '$');
}

// 36009: Case-insensitive variant of QueryKey.encodePart
export function encodePart(s: string): string {
    if (!s) return s;

    return s
        .replace(/\$/gi, '$D')
        .replace(/\//gi, '$S')
        .replace(/\&/gi, '$A')
        .replace(/\}/gi, '$B')
        .replace(/\~/gi, '$T')
        .replace(/\,/gi, '$C')
        .replace(/\./gi, '$P');
}

export function resolveKey(schema: string, query: string, viewName?: string): string {
    /*
       It's questionable if we really need to encodePart schema here and the suspicion is that this would result in
       double encoding. Since schema is not recognisable by api when not encoded, it would be reasonable to assume the
       passed in schema is already QueryKey encoded.  Though it won't hurt to double encode as long as resolveKey,
       resolveKeyFromJson and getSchemaQuery have the same assumption on the need to encode/decode
    */
    const parts = [encodePart(schema), encodePart(query)];
    if (viewName) parts.push(encodePart(viewName));
    return parts.join('/').toLowerCase();
}

export function resolveKeyFromJson(json: { queryName: string; schemaName: string[]; viewName?: string }): string {
    // if schema parts contain '.', replace with $P, to distinguish from '.' used to separate schema parts
    // similarly, encode '/' in schema parts, to distinguish from '/' used to separate schema and query parts
    // schemaName ['assay', 'general', 'a.b/c'] will be will processed to 'assay.general.a$pb$sc'
    // resolveKey will then further encode schema to assay$pgeneral$pa$dpb$sc
    return resolveKey(
        json.schemaName
            .map(schemaPart => {
                return encodePart(schemaPart);
            })
            .join('.'),
        json.queryName,
        json.viewName
    );
}

export interface IParsedSelectionKey {
    keys: string;
    schemaQuery: SchemaQuery;
}

export class SchemaQuery {
    schemaName: string;
    queryName: string;
    viewName: string;

    constructor(schemaName: string, queryName: string, viewName?: string) {
        this.schemaName = schemaName;
        this.queryName = queryName;
        this.viewName = viewName;
    }

    isEqual(sq: SchemaQuery, includeViewName = true): boolean {
        if (!sq) return false;
        return this.toString(includeViewName).toLowerCase() === sq.toString(includeViewName).toLowerCase();
    }

    hasSchema(schemaName: string): boolean {
        if (!schemaName) return false;
        return this.schemaName?.toLowerCase() === schemaName.toLowerCase();
    }

    hasSchemaQuery(sq: SchemaQuery): boolean {
        return this.isEqual(sq, false);
    }

    getKey(includeViewName = true): string {
        return resolveKey(this.schemaName, this.queryName, includeViewName ? this.viewName : undefined);
    }

    static parseSelectionKey(selectionKey: string): IParsedSelectionKey {
        selectionKey = stripSelectionSnapshotId(selectionKey);
        const parts = selectionKey.split('|');
        // first part will be app page model key, which we skip
        const schemaQueryKey = parts[1];
        // there may be a view name between the schemaQueryKey and the provided entity keys
        const keys = parts.length > 2 ? parts[parts.length - 1] : undefined;

        return {
            keys,
            schemaQuery: schemaQueryKey ? getSchemaQuery(schemaQueryKey) : undefined,
        };
    }

    static createAppSelectionKey(targetSQ: SchemaQuery, keys: any[]): string {
        return [APP_SELECTION_PREFIX, targetSQ.getKey(), keys.join(';')].join('|');
    }

    queryStartsWith(prefix: string): boolean {
        return !!this.queryName?.toLowerCase().startsWith(prefix?.toLowerCase());
    }

    schemaStartsWith(prefix: string): boolean {
        return !!this.schemaName?.toLowerCase().startsWith(prefix?.toLowerCase());
    }

    toString(includeViewName = true): string {
        const parts = [this.schemaName, this.queryName];
        if (includeViewName) {
            parts.push(this.viewName);
        }
        return parts.join('|');
    }
}

export function getSchemaQuery(encodedKey: string): SchemaQuery {
    const [encodedSchema, encodedQuery, encodedViewName] = encodedKey.split('/');

    return new SchemaQuery(decodePart(encodedSchema), decodePart(encodedQuery), decodePart(encodedViewName));
}
