const APP_SELECTION_PREFIX = 'appkey';

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

    isEqual(sq: SchemaQuery): boolean {
        if (!sq) return false;
        return this.toString().toLowerCase() === sq.toString().toLowerCase();
    }

    hasSchema(schemaName: string): boolean {
        if (schemaName) {
            return this.schemaName?.toLowerCase() === schemaName.toLowerCase();
        }

        return false;
    }

    hasSchemaQuery(sq: SchemaQuery): boolean {
        if (!sq) return false;
        return this.toString(false).toLowerCase() === sq.toString(false).toLowerCase();
    }

    getKey(includeViewName = true): string {
        return resolveKey(this.schemaName, this.queryName, includeViewName ? this.viewName : undefined);
    }

    static parseSelectionKey(selectionKey: string): IParsedSelectionKey {
        const [appkey /* not used */, schemaQueryKey, keys] = selectionKey.split('|');

        return {
            keys,
            schemaQuery: schemaQueryKey ? getSchemaQuery(schemaQueryKey) : undefined,
        };
    }

    static createAppSelectionKey(targetSQ: SchemaQuery, keys: any[]): string {
        return [APP_SELECTION_PREFIX, targetSQ.getKey(), keys.join(';')].join('|');
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
