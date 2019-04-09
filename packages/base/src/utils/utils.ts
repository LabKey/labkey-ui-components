/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { SchemaQuery } from '../models/model'

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