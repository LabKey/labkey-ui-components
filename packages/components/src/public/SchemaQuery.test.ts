/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { getSchemaQuery, resolveKey, resolveKeyFromJson, SchemaQuery } from './SchemaQuery';

describe('SchemaQuery', () => {
    const UNDEF_SQ = new SchemaQuery(undefined, undefined);
    const SQ = new SchemaQuery('schema.subschema', 'query');

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
        test('selectionKey with view name', () => {
            const sk = 'sample-detail|samples/biotest/$t$tdetails$t$t|~~details~~|3933964';
            expect(SchemaQuery.parseSelectionKey(sk)).toEqual({
                keys: '3933964',
                schemaQuery: new SchemaQuery('samples', 'biotest', '~~details~~'),
            });
        });
    });

    describe('queryStartsWith', () => {
        test('invalid and blank values', () => {
            expect(UNDEF_SQ.queryStartsWith(undefined)).toEqual(false);
            expect(UNDEF_SQ.queryStartsWith(null)).toEqual(false);
            expect(UNDEF_SQ.queryStartsWith('')).toEqual(false);
            expect(UNDEF_SQ.queryStartsWith(' ')).toEqual(false);

            expect(SQ.queryStartsWith(undefined)).toEqual(false);
            expect(SQ.queryStartsWith(null)).toEqual(false);
            expect(SQ.queryStartsWith('')).toEqual(false);
            expect(SQ.queryStartsWith(' ')).toEqual(false);
        });

        test('case-insensitive match', () => {
            expect(SQ.queryStartsWith('Q')).toEqual(true);
            expect(new SchemaQuery('Samples', 'MixTures').queryStartsWith('mIx')).toEqual(true);
        });

        test('full-string prefix', () => {
            expect(SQ.queryStartsWith('query')).toEqual(true);
        });

        test('multi-char partial prefix', () => {
            expect(SQ.queryStartsWith('que')).toEqual(true);
        });

        test('non-match', () => {
            expect(SQ.queryStartsWith('x')).toEqual(false);
            expect(SQ.queryStartsWith('uery')).toEqual(false);
        });

        test('prefix longer than value', () => {
            expect(SQ.queryStartsWith('queryextra')).toEqual(false);
        });

        test('nullish prefix never matches regardless of value', () => {
            expect(new SchemaQuery('s', 'undefinedQuery').queryStartsWith(undefined)).toEqual(false);
            expect(new SchemaQuery('s', 'nullQuery').queryStartsWith(null)).toEqual(false);
            expect(new SchemaQuery('s', 'undefinedQuery').queryStartsWith(null)).toEqual(false);
        });

        test('trailing space in prefix', () => {
            expect(new SchemaQuery('s', 'my query').queryStartsWith('my ')).toEqual(true);
            expect(SQ.queryStartsWith('query ')).toEqual(false);
        });

        test('does not inspect view name', () => {
            expect(new SchemaQuery('s', 'q', 'viewX').queryStartsWith('view')).toEqual(false);
        });
    });

    describe('schemaStartsWith', () => {
        test('invalid and blank values', () => {
            expect(UNDEF_SQ.schemaStartsWith(undefined)).toEqual(false);
            expect(UNDEF_SQ.schemaStartsWith(null)).toEqual(false);
            expect(UNDEF_SQ.schemaStartsWith('')).toEqual(false);
            expect(UNDEF_SQ.schemaStartsWith(' ')).toEqual(false);

            expect(SQ.schemaStartsWith(undefined)).toEqual(false);
            expect(SQ.schemaStartsWith(null)).toEqual(false);
            expect(SQ.schemaStartsWith('')).toEqual(false);
            expect(SQ.schemaStartsWith(' ')).toEqual(false);
        });

        test('case-insensitive match', () => {
            expect(SQ.schemaStartsWith('S')).toEqual(true);
            expect(new SchemaQuery('Samples', 'MixTures').schemaStartsWith('SAMP')).toEqual(true);
        });

        test('full-string prefix', () => {
            expect(SQ.schemaStartsWith('schema.subschema')).toEqual(true);
        });

        test('multi-char partial prefix', () => {
            expect(SQ.schemaStartsWith('schema.')).toEqual(true);
            expect(SQ.schemaStartsWith('schema.sub')).toEqual(true);
        });

        test('non-match', () => {
            expect(SQ.schemaStartsWith('sub')).toEqual(false);
            expect(SQ.schemaStartsWith('x')).toEqual(false);
        });

        test('prefix longer than value', () => {
            expect(SQ.schemaStartsWith('schema.subschema.more')).toEqual(false);
        });

        test('nullish prefix never matches regardless of value', () => {
            expect(new SchemaQuery('undefinedSchema', 'q').schemaStartsWith(undefined)).toEqual(false);
            expect(new SchemaQuery('nullSchema', 'q').schemaStartsWith(null)).toEqual(false);
            expect(new SchemaQuery('undefinedSchema', 'q').schemaStartsWith(null)).toEqual(false);
        });

        test('trailing space in prefix', () => {
            expect(new SchemaQuery('my schema', 'q').schemaStartsWith('my ')).toEqual(true);
            expect(SQ.schemaStartsWith('schema.subschema ')).toEqual(false);
        });

        test('does not inspect view name', () => {
            expect(new SchemaQuery('s', 'q', 'viewX').schemaStartsWith('view')).toEqual(false);
        });
    });

    describe('isEqual', () => {
        test('null or undefined argument', () => {
            expect(SQ.isEqual(undefined)).toEqual(false);
            expect(SQ.isEqual(null)).toEqual(false);
        });

        test('identical schema query', () => {
            expect(SQ.isEqual(SQ)).toEqual(true);
            expect(SQ.isEqual(new SchemaQuery('schema.subschema', 'query'))).toEqual(true);
        });

        test('both schema and query undefined', () => {
            expect(UNDEF_SQ.isEqual(new SchemaQuery(undefined, undefined))).toEqual(true);
        });

        test('case-insensitive match', () => {
            expect(new SchemaQuery('Schema', 'Query').isEqual(new SchemaQuery('schema', 'query'))).toEqual(true);
            expect(
                new SchemaQuery('Schema', 'Query', 'View').isEqual(new SchemaQuery('schema', 'query', 'view'))
            ).toEqual(true);
        });

        test('different schema', () => {
            expect(SQ.isEqual(new SchemaQuery('other', 'query'))).toEqual(false);
        });

        test('different query', () => {
            expect(SQ.isEqual(new SchemaQuery('schema.subschema', 'other'))).toEqual(false);
        });

        test('different view name', () => {
            const a = new SchemaQuery('s', 'q', 'viewA');
            const b = new SchemaQuery('s', 'q', 'viewB');
            expect(a.isEqual(b)).toEqual(false);
            expect(a.isEqual(b, false)).toEqual(true);
        });

        test('one with view name, one without', () => {
            const withView = new SchemaQuery('s', 'q', 'view');
            const withoutView = new SchemaQuery('s', 'q');
            expect(withView.isEqual(withoutView)).toEqual(false);
            expect(withView.isEqual(withoutView, false)).toEqual(true);
        });

        test('nullish and empty view names are equivalent', () => {
            expect(new SchemaQuery('s', 'q').isEqual(new SchemaQuery('s', 'q', ''))).toEqual(true);
            expect(new SchemaQuery('s', 'q', null).isEqual(new SchemaQuery('s', 'q', ''))).toEqual(true);
            expect(new SchemaQuery('s', 'q', undefined).isEqual(new SchemaQuery('s', 'q', null))).toEqual(true);
        });

        test('nullish and empty schema and query are equivalent', () => {
            expect(new SchemaQuery(undefined, undefined).isEqual(new SchemaQuery('', ''))).toEqual(true);
            expect(new SchemaQuery(null, null).isEqual(new SchemaQuery('', ''))).toEqual(true);
        });

        test('whitespace view name is not equivalent to empty', () => {
            expect(new SchemaQuery('s', 'q', ' ').isEqual(new SchemaQuery('s', 'q', ''))).toEqual(false);
        });

        test('field boundary collision', () => {
            expect(new SchemaQuery('a', 'b|c').isEqual(new SchemaQuery('a|b', 'c'))).toEqual(false);
        });
    });

    describe('hasSchema', () => {
        test('invalid and blank values', () => {
            expect(SQ.hasSchema(undefined)).toEqual(false);
            expect(SQ.hasSchema(null)).toEqual(false);
            expect(SQ.hasSchema('')).toEqual(false);
            expect(SQ.hasSchema(' ')).toEqual(false);

            expect(UNDEF_SQ.hasSchema(undefined)).toEqual(false);
            expect(UNDEF_SQ.hasSchema(null)).toEqual(false);
            expect(UNDEF_SQ.hasSchema('')).toEqual(false);
        });

        test('undefined schema name never matches a non-blank argument', () => {
            expect(UNDEF_SQ.hasSchema('schema.subschema')).toEqual(false);
        });

        test('exact match', () => {
            expect(SQ.hasSchema('schema.subschema')).toEqual(true);
        });

        test('case-insensitive match', () => {
            expect(SQ.hasSchema('Schema.SubSchema')).toEqual(true);
            expect(new SchemaQuery('Samples', 'q').hasSchema('samples')).toEqual(true);
        });

        test('partial schema name is not a match', () => {
            expect(SQ.hasSchema('schema')).toEqual(false);
            expect(SQ.hasSchema('subschema')).toEqual(false);
        });

        test('does not inspect query or view name', () => {
            expect(new SchemaQuery('s', 'q', 'view').hasSchema('q')).toEqual(false);
            expect(new SchemaQuery('s', 'q', 'view').hasSchema('view')).toEqual(false);
        });
    });

    describe('toString', () => {
        test('schema and query, no view name', () => {
            expect(new SchemaQuery('s', 'q').toString()).toEqual('s|q|');
        });

        test('schema, query, and view name', () => {
            expect(new SchemaQuery('s', 'q', 'view').toString()).toEqual('s|q|view');
        });

        test('excludes view name when includeViewName is false', () => {
            expect(new SchemaQuery('s', 'q', 'view').toString(false)).toEqual('s|q');
            expect(new SchemaQuery('s', 'q').toString(false)).toEqual('s|q');
        });

        test('preserves case', () => {
            expect(new SchemaQuery('Schema', 'Query', 'View').toString()).toEqual('Schema|Query|View');
        });

        test('undefined schema and query', () => {
            expect(UNDEF_SQ.toString()).toEqual('||');
            expect(UNDEF_SQ.toString(false)).toEqual('|');
        });

        test('empty-string view name matches undefined view name', () => {
            expect(new SchemaQuery('s', 'q', '').toString()).toEqual(new SchemaQuery('s', 'q').toString());
        });
    });
});
