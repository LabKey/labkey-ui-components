import {caseSensitiveNaturalSort, naturalSort} from './sort';

describe('naturalSort', () => {
    test('alphabetic', () => {
        expect(naturalSort('', 'anything')).toBe(1);
        expect(naturalSort('anything', '')).toBe(-1);
        expect(naturalSort(undefined, 'anything')).toBe(1);
        expect(naturalSort('a', 'a')).toBe(0);
        expect(naturalSort('alpha', 'aLPha')).toBe(0);
        expect(naturalSort(' ', 'anything')).toBe(-1);
        expect(naturalSort('a', 'b')).toBe(-1);
        expect(naturalSort('A', 'b')).toBe(-1);
        expect(naturalSort('A', 'Z')).toBe(-1);
        expect(naturalSort('alpha', 'zeta')).toBe(-1);
        expect(naturalSort('zeta', 'atez')).toBe(1);
        expect(naturalSort('Zeta', 'Atez')).toBe(1);
    });

    test('alphanumeric', () => {
        expect(naturalSort('a1.2', 'a1.3')).toBeLessThan(0);
        expect(naturalSort('1.431', '14.31')).toBeLessThan(0);
        expect(naturalSort('10', '1.0')).toBeGreaterThan(0);
        expect(naturalSort('1.2ABC', '1.2XY')).toBeLessThan(0);
    });

    test('non-string values', () => {
        const nonStringValues = [42, 3.14, jest.fn(), true, [], {}, undefined, null, NaN];

        // Don't particularly care how it sorts these ... just that it succeeds in processing them.
        expect(nonStringValues.sort(naturalSort).length).toEqual(nonStringValues.length);
    });
});

describe('caseSensitiveNaturalSort', () => {
    test('case sensitive equality and ordering', () => {
        // exact same string and case => equal
        expect(caseSensitiveNaturalSort('alpha', 'alpha')).toBe(0);

        // same letters but different case => not equal (case-sensitive)
        // 'l' (lowercase) has a higher char code than 'L' (uppercase), so 'alpha' should come after 'aLPha'
        expect(caseSensitiveNaturalSort('alpha', 'aLPha')).toBeGreaterThan(0);

        // 'A' is less than 'a' in ASCII ordering
        expect(caseSensitiveNaturalSort('A', 'a')).toBeLessThan(0);
        expect(caseSensitiveNaturalSort('a', 'A')).toBeGreaterThan(0);
    });

    test('numeric/alphanumeric behavior preserved', () => {
        // numeric/alphanumeric comparison should still behave as natural sort
        expect(caseSensitiveNaturalSort('a1.2', 'a1.3')).toBeLessThan(0);
        expect(caseSensitiveNaturalSort('10', '1.0')).toBeGreaterThan(0);
    });
});
