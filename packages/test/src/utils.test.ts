/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { tsvStringFromRowMaps, tsvStringFromRows, tsvValue } from './utils';

describe('utils', () => {
    describe('tsvValue', () => {
        test('plain values', () => {
            expect(tsvValue('abc')).toBe('abc');
            expect(tsvValue(42)).toBe('42');
            expect(tsvValue(false)).toBe('false');
            expect(tsvValue('a,b')).toBe('a,b');
            expect(tsvValue('a b')).toBe('a b');
            expect(tsvValue('a#b')).toBe('a#b');
        });

        test('empty values', () => {
            expect(tsvValue(null)).toBe('');
            expect(tsvValue(undefined)).toBe('');
            expect(tsvValue('')).toBe('');
        });

        test('arrays are comma-joined', () => {
            expect(tsvValue(['a', 'b', 3])).toBe('a, b, 3');
            expect(tsvValue(['a\tb', 'c'])).toBe('"a\tb, c"');
            expect(tsvValue([])).toBe('');
        });

        test('quotes array elements like quoteValueWithDelimiters', () => {
            expect(tsvValue(['a,b', 'c'])).toBe('"""a,b"", c"');
            expect(tsvValue(['S-1', 'a,b'])).toBe('"S-1, ""a,b"""');
            expect(tsvValue(['a\nb', 'c'])).toBe('"""a\nb"", c"');
            expect(tsvValue(['a\\b', 'c'])).toBe('"""a\\b"", c"');
            expect(tsvValue([' a', 'b'])).toBe('""" a"", b"');
            expect(tsvValue([null, 'b'])).toBe(', b');
        });

        // Cells the GH Issue 950 integration tests import successfully
        test('matches server-verified multi-value cells', () => {
            expect(tsvValue(['comma', 'comma, with'])).toBe('"comma, ""comma, with"""');
            expect(tsvValue(['comma, with'])).toBe('"""comma, with"""');
            expect(tsvValue(['"comma, with"'])).toBe('"""""""comma, with"""""""');
        });

        test('quotes values the reader would split', () => {
            expect(tsvValue('a\tb')).toBe('"a\tb"');
            expect(tsvValue('a\nb')).toBe('"a\nb"');
        });

        test('rejects \\r, which the server stores as \\n', () => {
            expect(() => tsvValue('a\rb')).toThrow('contains \\r');
            expect(() => tsvValue('a\r\nb')).toThrow('contains \\r');
            expect(() => tsvValue(['a\rb'])).toThrow('contains \\r');
        });

        test('quotes a literal \\N, which the reader treats as null', () => {
            expect(tsvValue('\\N')).toBe('"\\N"');
            expect(tsvValue('a\\N')).toBe('a\\N');
        });

        test('writes dates as ISO-8601 instants', () => {
            const date = new Date(Date.UTC(2026, 0, 5, 6, 7, 8, 9));
            expect(tsvValue(date)).toBe('2026-01-05T06:07:08.009Z');
            expect(tsvValue([date])).toBe('2026-01-05T06:07:08.009Z');
        });

        test('rejects objects', () => {
            expect(() => tsvValue({ a: 1 })).toThrow("Can't write an object");
            expect(() => tsvValue([{ a: 1 }])).toThrow("Can't write an object");
            expect(() => tsvValue([['a', 'b']])).toThrow("Can't write an object");
        });

        test('doubles embedded quotes', () => {
            expect(tsvValue('"B-By')).toBe('"""B-By"');
            expect(tsvValue('o"k')).toBe('"o""k"');
            expect(tsvValue('""')).toBe('""""""');
        });

        test('quotes values the reader would trim', () => {
            expect(tsvValue(' pad')).toBe('" pad"');
            expect(tsvValue('pad ')).toBe('"pad "');
            expect(tsvValue(' ')).toBe('" "');
        });

        test('quotes values the reader would treat as a comment', () => {
            expect(tsvValue('#c')).toBe('"#c"');
        });
    });

    describe('tsvStringFromRows', () => {
        test('tab-separated lines with a trailing newline', () => {
            expect(tsvStringFromRows([['Name', 'Value'], ['a', 1], ['b', null]])).toBe('Name\tValue\na\t1\nb\t\n');
        });

        test('quotes cells as needed', () => {
            expect(tsvStringFromRows([['#Name', 'a\tb'], ['x"y', ' z']])).toBe('"#Name"\t"a\tb"\n"x""y"\t" z"\n');
        });

        test('no rows', () => {
            expect(tsvStringFromRows([])).toBe('');
        });

        test('rejects a row whose cells are all empty', () => {
            expect(() => tsvStringFromRows([['A', 'B'], ['x', 'y'], [null, '']])).toThrow('Row 2 has no values');
            expect(() => tsvStringFromRows([['A'], [[]]])).toThrow('Row 1 has no values');
            expect(() => tsvStringFromRows([['A'], []])).toThrow('Row 1 has no values');
        });

        test('keeps a row with any non-empty cell', () => {
            expect(tsvStringFromRows([['A', 'B'], ['', 'y'], [' ', null]])).toBe('A\tB\n\ty\n" "\t\n');
        });
    });

    describe('tsvStringFromRowMaps', () => {
        test('columns default to every key across the rows, in order', () => {
            const tsv = tsvStringFromRowMaps([{ A: 1, B: 2 }, { C: 3, A: 4 }]);
            expect(tsv).toBe('A\tB\tC\n1\t2\t\n4\t\t3\n');
        });

        test('explicit columns select and order the output', () => {
            const tsv = tsvStringFromRowMaps([{ A: 1, B: 2, C: 3 }], ['C', 'A']);
            expect(tsv).toBe('C\tA\n3\t1\n');
        });

        test('quotes headers and values', () => {
            const tsv = tsvStringFromRowMaps([{ '"B-By': 'x', 'a,b': ['p', 'q'], Plain: 'line1\nline2' }]);
            expect(tsv).toBe('"""B-By"\ta,b\tPlain\nx\tp, q\t"line1\nline2"\n');
        });

        test('no rows writes only the header', () => {
            expect(tsvStringFromRowMaps([], ['A', 'B'])).toBe('A\tB\n');
        });

        test('rejects a row with no values', () => {
            expect(() => tsvStringFromRowMaps([{ A: 'x' }, { A: null }])).toThrow('Row 2 has no values');
        });

        test('rejects having no columns', () => {
            expect(() => tsvStringFromRowMaps([])).toThrow('No columns to write');
            expect(() => tsvStringFromRowMaps([{}])).toThrow('No columns to write');
            expect(() => tsvStringFromRowMaps([{ A: 'x' }], [])).toThrow('No columns to write');
        });
    });
});
