import { getSchemaQuery, resolveKey, resolveKeyFromJson, resolveSchemaQuery, SchemaQuery } from './SchemaQuery';

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

describe('resolveKey', () => {
    test('no encodings', () => {
        expect(resolveKey('schema', 'query')).toBe('schema/query');
        expect(resolveKey('Schema', 'Query')).toBe('schema/query');
        expect(resolveKey('ScheMa', 'QueRy')).toBe('schema/query');
    });

    test('with encodings', () => {
        expect(resolveKey('$chem&', '{query,/.more~less}')).toBe('$dchem$a/{query$c$s$pmore$tless$b');
        expect(resolveKey('$,hema$', 'q&x&&&d')).toBe('$d$chema$d/q$ax$a$a$ad');
    });
});

describe('resolveKeyFromJson', () => {
    test('schema name with one part', () => {
        expect(resolveKeyFromJson({ schemaName: ['partOne'], queryName: 'q/Name' })).toBe('partone/q$sname');
        expect(resolveKeyFromJson({ schemaName: ['p&rtOne'], queryName: '//$Name' })).toBe('p$dartone/$s$s$dname');
    });

    test('schema name with multiple parts', () => {
        expect(resolveKeyFromJson({ schemaName: ['one', 'Two', 'thrEE$'], queryName: 'four' })).toBe(
            'one$ptwo$pthree$dd/four'
        );
    });
});
