import { encodeFormDataQuote } from './utils';

describe('encodeFormDataQuote', () => {
    test('empty', () => {
        expect(encodeFormDataQuote(null)).toBeNull();
        expect(encodeFormDataQuote(undefined)).toBeUndefined();
        expect(encodeFormDataQuote('')).toBe('');
    });

    test('no relevant special character', () => {
        expect(encodeFormDataQuote('a')).toBe('a')
        expect(encodeFormDataQuote('$')).toBe('$');
        expect(encodeFormDataQuote('%')).toBe('%');
        expect(encodeFormDataQuote('%2522')).toBe('%2522');
    });

    test('encoded', () => {
        expect(encodeFormDataQuote('"')).toBe('%22')
        expect(encodeFormDataQuote('""')).toBe('%22%22');
        expect(encodeFormDataQuote('"22')).toBe('%2222');
        expect(encodeFormDataQuote('"a"')).toBe('%22a%22');
        expect(encodeFormDataQuote('a%22')).toBe('a%2522');
        expect(encodeFormDataQuote('"a%22')).toBe('%22a%2522');
        expect(encodeFormDataQuote('"a%222')).toBe('%22a%25222');
    });
});
