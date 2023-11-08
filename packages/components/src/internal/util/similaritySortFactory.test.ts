import { naturalSort } from '../../public/sort';

import { contains, hasPrefix, similaritySortFactory } from './similaritySortFactory';

describe('contains', () => {
    test('Empty values', () => {
        expect(contains(undefined, undefined, undefined)).toBe(false);
        expect(contains('', '')).toBe(false);
        expect(contains('first', undefined)).toBe(false);
        expect(contains('', 'second')).toBe(false);
    });

    test('Case sensitivity', () => {
        expect(contains('S', 's')).toBe(true);
        expect(contains('S', 's', false)).toBe(true);
        expect(contains('S', 's', true)).toBe(false);
    });
});

describe('hasPrefix', () => {
    test('Empty values', () => {
        expect(hasPrefix(undefined, undefined, undefined)).toBe(false);
        expect(hasPrefix('', '')).toBe(false);
        expect(hasPrefix('here', '')).toBe(false);
        expect(hasPrefix('', 'there')).toBe(false);
    });

    test('Case sensitivity', () => {
        expect(hasPrefix('The', 't')).toBe(true);
        expect(hasPrefix('The', 't', true)).toBe(false);
        expect(hasPrefix('The', 'he')).toBe(false);
        expect(hasPrefix('The', 'he', true)).toBe(false);
        expect(hasPrefix('The', 'th', false)).toBe(true);
    });
});

describe('similaritySortFactory', () => {
    const values = ['S-11', '2015_08_09_13', '2015_08_09_12', 'S-1X', 'S-111', 'S-1', '6S-1', 'S-211'];

    function getValues(): string[] {
        return Array.from(values);
    }

    test('Empty token', () => {
        expect([].sort(similaritySortFactory(undefined))).toMatchObject([]);

        expect(getValues().sort(similaritySortFactory(''))).toMatchObject(getValues().sort(naturalSort));
    });

    test('Undefined/null', () => {
        expect([].sort(similaritySortFactory('no results'))).toMatchObject([]);
        expect([undefined].sort(similaritySortFactory('no results'))).toMatchObject([undefined]);
        expect(['cool', undefined, 'coolest', null, 'lame'].sort(similaritySortFactory(''))).toMatchObject([
            'cool',
            'coolest',
            'lame',
            null,
            undefined,
        ]);
    });

    test('Exact matching', () => {
        let result = getValues().sort(similaritySortFactory(''));
        expect(result[0]).toEqual('6S-1'); // degrade to natural sort

        // case-insensitive
        result = getValues().sort(similaritySortFactory('s-'));
        expect(result[0]).toEqual('S-1');
        expect(result[1]).toEqual('S-1X');

        result = getValues().sort(similaritySortFactory('S-1'));
        expect(result[0]).toEqual('S-1');

        result = getValues().sort(similaritySortFactory('S-11'));
        expect(result[0]).toEqual('S-11');

        // case-sensitive
        result = getValues().sort(similaritySortFactory('s-1', true));
        expect(result[0]).toEqual('6S-1'); // degrade to natural sort
    });

    test('non-string values', () => {
        const nonStringValues = [42, 3.14, jest.fn(), true, [], {}, undefined, null, NaN];

        // Don't particularly care how it sorts these ... just that it succeeds in processing them.
        expect(nonStringValues.sort(similaritySortFactory('x')).length).toEqual(nonStringValues.length);
        expect(nonStringValues.sort(similaritySortFactory('y', true)).length).toEqual(nonStringValues.length);
    });
});
