import { Record } from 'immutable';

const APP_SELECTION_PREFIX = 'appkey';

// 36009: Case-insensitive variant of QueryKey.decodePart
export function decodePart(s: string): string {
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
    return s
        .replace(/\$/gi, '$D')
        .replace(/\//gi, '$S')
        .replace(/\&/gi, '$A')
        .replace(/\}/gi, '$B')
        .replace(/\~/gi, '$T')
        .replace(/\,/gi, '$C')
        .replace(/\./gi, '$P');
}

export function resolveKey(schema: string, query: string): string {
    /*
       It's questionable if we really need to encodePart schema here and the suspicion is that this would result in double encoding.
       Since schema is not recognisable by api when not encoded, it would be reasonable to assume the passed in schema is already QueryKey encoded.
       Though it won't hurt to double encode as long as resolveKey, resolveKeyFromJson and getSchemaQuery have the same assumption on the need to encode/decode
    */
    return [encodePart(schema), encodePart(query)].join('/').toLowerCase();
}

export function resolveKeyFromJson(json: { schemaName: string[]; queryName: string }): string {
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
        json.queryName
    );
}

export interface IParsedSelectionKey {
    keys: string;
    schemaQuery: SchemaQuery;
}

export class SchemaQuery extends Record({
    schemaName: undefined,
    queryName: undefined,
    viewName: undefined,
}) {
    declare schemaName: string;
    declare queryName: string;
    declare viewName: string;

    static create(schemaName: string, queryName: string, viewName?: string): SchemaQuery {
        return new SchemaQuery({ schemaName, queryName, viewName });
    }

    // TODO: remove unnecessary function, Records are Immutable and/or this can be a getter function.
    getSchema() {
        return this.schemaName;
    }

    // TODO: remove unnecessary function, Records are Immutable and/or this can be a getter function.
    getQuery() {
        return this.queryName;
    }

    // TODO: remove unnecessary function, Records are Immutable and/or this can be a getter function.
    getView() {
        return this.viewName;
    }

    isEqual(sq: SchemaQuery): boolean {
        if (!sq) return false;
        return this.toString().toLowerCase() === sq.toString().toLowerCase();
    }

    hasSchema(schemaName: string): boolean {
        if (schemaName) {
            return this.schemaName.toLowerCase() === schemaName.toLowerCase();
        }

        return false;
    }

    static parseSelectionKey(selectionKey: string): IParsedSelectionKey {
        const [appkey /* not used */, schemaQueryKey, keys] = selectionKey.split('|');

        return {
            keys,
            schemaQuery: getSchemaQuery(schemaQueryKey),
        };
    }

    static createAppSelectionKey(targetSQ: SchemaQuery, prefix?: string, keys?: any[]): string {
        let keyParts = [prefix ?? APP_SELECTION_PREFIX, resolveSchemaQuery(targetSQ)];
        if (keys) {
            keyParts = keyParts.concat(keys.join(';'))
        }
        return keyParts.join('|');
    }

    toString(): string {
        return [this.schemaName, this.queryName, this.viewName].join('|');
    }
}

// TODO: resolveSchemaQuery should have a better name, and it should be added as a property on the SchemaQuery record
//  class. I'm really not sure what resolve is supposed to mean in this context, but I think we can add this as a
//  property called "key", or something similar since it mostly seems to be used as a state key.
export function resolveSchemaQuery(schemaQuery: SchemaQuery): string {
    return schemaQuery ? resolveKey(schemaQuery.getSchema(), schemaQuery.getQuery()) : null;
}

export function getSchemaQuery(encodedKey: string): SchemaQuery {
    const [encodedSchema, encodedQuery] = encodedKey.split('/');
    return SchemaQuery.create(decodePart(encodedSchema), decodePart(encodedQuery));
}
