/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {
    generateNamingExpressionConstant,
    generateRandomStr,
    getEscapedNameExpression,
    selectRandomN,
    shuffleArray,
    tsvStringFromRowMaps,
    tsvStringFromRows,
    tsvValue,
} from './utils';

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
            expect(tsvValue(['a', 'b', 3])).toBe('a,b,3');
            expect(tsvValue(['a\tb', 'c'])).toBe('"a\tb,c"');
        });

        test('quotes values the reader would split', () => {
            expect(tsvValue('a\tb')).toBe('"a\tb"');
            expect(tsvValue('a\nb')).toBe('"a\nb"');
            expect(tsvValue('a\rb')).toBe('"a\rb"');
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
            expect(tsv).toBe('"""B-By"\ta,b\tPlain\nx\tp,q\t"line1\nline2"\n');
        });

        test('no rows writes only the header', () => {
            expect(tsvStringFromRowMaps([], ['A', 'B'])).toBe('A\tB\n');
        });
    });

    describe('getEscapedNameExpression', () => {
        test('escapes name expression special characters', () => {
            expect(getEscapedNameExpression('a\\b$c/d&e}f~g,h.i')).toBe('a\\\\b\\$c\\/d\\&e\\}f\\~g\\,h\\.i');
        });

        test('leaves other characters alone', () => {
            expect(getEscapedNameExpression('Ab 1-_{"#')).toBe('Ab 1-_{"#');
        });
    });

    describe('generateRandomStr', () => {
        test('uses only the charset, minus exclusions', () => {
            for (let i = 0; i < 50; i++) {
                const str = generateRandomStr(20, 'abcxyz', 'xyz');
                expect(str).toMatch(/^[abc]{20}$/);
            }
        });

        test('trims surrounding whitespace', () => {
            for (let i = 0; i < 50; i++) {
                const str = generateRandomStr(10, 'a ');
                expect(str).toBe(str.trim());
                expect(str.length).toBeLessThanOrEqual(10);
            }
        });
    });

    describe('generateNamingExpressionConstant', () => {
        test('never contains braces or newlines', () => {
            for (let i = 0; i < 50; i++) {
                expect(generateNamingExpressionConstant(20)).not.toMatch(/[{}\r\n]/);
            }
        });
    });

    describe('shuffleArray', () => {
        test('returns a permutation without mutating the input', () => {
            const original = [1, 2, 3, 4, 5, 6, 7, 8];
            const shuffled = shuffleArray(original);
            expect(original).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
            expect(shuffled).not.toBe(original);
            expect([...shuffled].sort((a, b) => a - b)).toEqual(original);
        });
    });

    describe('selectRandomN', () => {
        test('selects distinct members', () => {
            const choices = ['a', 'b', 'c', 'd', 'e'];
            const selected = selectRandomN(choices, 3);
            expect(selected).toHaveLength(3);
            expect(new Set(selected).size).toBe(3);
            selected.forEach(s => expect(choices).toContain(s));
        });

        test('defaults to one', () => {
            expect(selectRandomN(['a', 'b'])).toHaveLength(1);
        });

        test('out-of-range counts return an empty array', () => {
            expect(selectRandomN(['a', 'b'], 3)).toEqual([]);
            expect(selectRandomN(['a', 'b'], -1)).toEqual([]);
            expect(selectRandomN(undefined, 1)).toEqual([]);
        });
    });
});
