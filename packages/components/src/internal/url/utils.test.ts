import { encodeFormDataQuote, getIntegerSearchParam } from './utils';

describe('encodeFormDataQuote', () => {
    test('empty', () => {
        expect(encodeFormDataQuote(null)).toBeNull();
        expect(encodeFormDataQuote(undefined)).toBeUndefined();
        expect(encodeFormDataQuote('')).toBe('');
    });

    test('no relevant special character', () => {
        expect(encodeFormDataQuote('a')).toBe('a');
        expect(encodeFormDataQuote('$')).toBe('$');
        expect(encodeFormDataQuote('9')).toBe('9');
        expect(encodeFormDataQuote('[a]')).toBe('[a]');
    });

    test('encoded', () => {
        expect(encodeFormDataQuote('"')).toBe('%_%22');
        expect(encodeFormDataQuote('%')).toBe('%_%25');
        expect(encodeFormDataQuote('%_beep')).toBe('%_%25_beep');
        expect(encodeFormDataQuote('""')).toBe('%_%22%22');
        expect(encodeFormDataQuote('"22')).toBe('%_%2222');
        expect(encodeFormDataQuote('"a"')).toBe('%_%22a%22');
        expect(encodeFormDataQuote('a%22')).toBe('%_a%2522');
        expect(encodeFormDataQuote('"a%22')).toBe('%_%22a%2522');
        expect(encodeFormDataQuote('"a%222')).toBe('%_%22a%25222');
    });
});

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
