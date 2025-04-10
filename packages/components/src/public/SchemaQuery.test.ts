import { getSchemaQuery, resolveKey, resolveKeyFromJson, SchemaQuery } from './SchemaQuery';

describe('getSchemaQuery', () => {
    test('no decoding required, no view', () => {
        expect(getSchemaQuery('name/query')).toEqual(new SchemaQuery('name', 'query'));
        expect(getSchemaQuery('name/query/view')).toEqual(new SchemaQuery('name', 'query', 'view'));
    });

    test('no decoding required, with view', () => {});

    test('decoding required', () => {
        expect(getSchemaQuery('my$Sname/just$pask')).toEqual(new SchemaQuery('my/name', 'just.ask'));
        expect(getSchemaQuery('one$ptwo$pthree$d/q1')).toEqual(new SchemaQuery('one.two.three$', 'q1'));
        expect(getSchemaQuery('one$ptwo$pthree$d/q1/view$s2$d')).toEqual(
            new SchemaQuery('one.two.three$', 'q1', 'view/2$')
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
        expect(resolveKeyFromJson({ schemaName: ['p&rtOne'], queryName: '//$Name', viewName: 'view' })).toBe(
            'p$dartone/$s$s$dname/view'
        );
        expect(resolveKeyFromJson({ schemaName: ['p&rtOne'], queryName: '//$Name', viewName: 'new/view$' })).toBe(
            'p$dartone/$s$s$dname/new$sview$d'
        );
    });

    test('schema name with multiple parts', () => {
        expect(resolveKeyFromJson({ schemaName: ['one', 'Two', 'thrEE$'], queryName: 'four' })).toBe(
            'one$ptwo$pthree$dd/four'
        );
    });
});

describe('parseSelectionKey', () => {
    test('selectionKey with Schema, Query, and View', () => {
        expect(SchemaQuery.parseSelectionKey('some-app-key|MySchema/MyQuery/MyView')).toEqual({
            keys: undefined,
            schemaQuery: new SchemaQuery('MySchema', 'MyQuery', 'MyView'),
        });
    });
    test('selectionKey with only Schema and Query', () => {
        expect(SchemaQuery.parseSelectionKey('some-app-key|MySchema/MyQuery')).toEqual({
            keys: undefined,
            schemaQuery: new SchemaQuery('MySchema', 'MyQuery'),
        });
    });
    test('selectionKey with keys', () => {
        expect(SchemaQuery.parseSelectionKey('some-app-key|MySchema/MyQuery/MyView|one;two;three')).toEqual({
            keys: 'one;two;three',
            schemaQuery: new SchemaQuery('MySchema', 'MyQuery', 'MyView'),
        });
    });
    test('selectionKey with encoded params', () => {
        expect(SchemaQuery.parseSelectionKey('some-app-key|My$PSchema/My$SQuery/My$BView|one;two;three')).toEqual({
            keys: 'one;two;three',
            schemaQuery: new SchemaQuery('My.Schema', 'My/Query', 'My}View'),
        });
    });
    test('selectionKey with snapshot ID', () => {
        const sk =
            'some-app-key|My$PSchema/My$SQuery/My$BView|one;two;three__snapshot__e4bdc808-f624-103d-8ba4-b314ec40030b';
        expect(SchemaQuery.parseSelectionKey(sk)).toEqual({
            keys: 'one;two;three',
            schemaQuery: new SchemaQuery('My.Schema', 'My/Query', 'My}View'),
        });
    });
});
