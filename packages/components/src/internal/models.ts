import { List, Map } from 'immutable';
import { SchemaQuery } from '../public/SchemaQuery';

export function createGridModelId(gridId: string, schemaQuery: SchemaQuery, keyValue?: any): string {
    const parts = [gridId, schemaQuery.getKey()];

    if (schemaQuery && schemaQuery.viewName) {
        parts.push(schemaQuery.viewName);
    }
    if (keyValue !== undefined) {
        parts.push(keyValue);
    }

    return parts.join('|').toLowerCase();
}

export interface GridData {
    data: Map<any, Map<string, any>>;
    dataKeys: List<any>;
}
