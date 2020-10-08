import { Record } from 'immutable';
import { getSchemaQuery, resolveSchemaQuery } from '..';

const APP_SELECTION_PREFIX = 'appkey';

export interface IParsedSelectionKey {
    keys: string;
    schemaQuery: SchemaQuery;
}

export class SchemaQuery extends Record({
    schemaName: undefined,
    queryName: undefined,
    viewName: undefined,
}) {
    static create(schemaName: string, queryName: string, viewName?: string): SchemaQuery {
        return new SchemaQuery({ schemaName, queryName, viewName });
    }

    schemaName: string;
    queryName: string;
    viewName: string;

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

    static createAppSelectionKey(targetSQ: SchemaQuery, keys: any[]): string {
        return [APP_SELECTION_PREFIX, resolveSchemaQuery(targetSQ), keys.join(';')].join('|');
    }

    toString(): string {
        return [this.schemaName, this.queryName, this.viewName].join('|');
    }
}
