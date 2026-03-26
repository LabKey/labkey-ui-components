import { getIntegerSearchParam } from './utils';

describe('getInterSearchParam', () => {
    test('no param', () => {
        expect(getIntegerSearchParam(new URLSearchParams(), 'test')).toBeUndefined();
        expect(getIntegerSearchParam(new URLSearchParams({ other: '1' }), 'test')).toBeUndefined();
    });

    test('not a number', () => {
        expect(getIntegerSearchParam(new URLSearchParams({ test: 'a' }), 'test')).toBeUndefined();
    });

    test('is numeric value', () => {
        expect(getIntegerSearchParam(new URLSearchParams({ test: '1' }), 'test')).toBe(1);
        expect(getIntegerSearchParam(new URLSearchParams({ test: '1.4' }), 'test')).toBe(1);
        expect(getIntegerSearchParam(new URLSearchParams({ test: '1123' }), 'test')).toBe(1123);
    });
});
