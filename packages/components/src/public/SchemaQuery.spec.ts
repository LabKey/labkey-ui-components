import { getSchemaQuery, resolveSchemaQuery, SchemaQuery } from './SchemaQuery';

describe('resolveSchemaQuery', () => {
    test('handle undefined schemaQuery', () => {
        expect(resolveSchemaQuery(undefined)).toBeNull();
    });

    test('schema without encoding required', () => {
        const schemaQuery = new SchemaQuery({
            schemaName: 'name',
            queryName: 'my favorite query',
        });
        expect(resolveSchemaQuery(schemaQuery)).toBe('name/my favorite query');
    });
});

describe('getSchemaQuery', () => {
    test('no decoding required', () => {
        const expected = new SchemaQuery({
            schemaName: 'name',
            queryName: 'query',
        });
        expect(getSchemaQuery('name/query')).toEqual(expected);
    });

    test('decoding required', () => {
        expect(getSchemaQuery('my$Sname/just$pask')).toEqual(
            new SchemaQuery({
                schemaName: 'my/name',
                queryName: 'just.ask',
            })
        );
        expect(getSchemaQuery('one$ptwo$pthree$d/q1')).toEqual(
            new SchemaQuery({
                schemaName: 'one.two.three$',
                queryName: 'q1',
            })
        );
    });
});
