import { flattenValuesFromRow } from './utils';

describe('flattenValuesFromRow', () => {
    test('missing params', () => {
        expect(JSON.stringify(flattenValuesFromRow(undefined, undefined))).toBe('{}');
        expect(JSON.stringify(flattenValuesFromRow({ test: { value: 123 } }, undefined))).toBe('{}');
        expect(JSON.stringify(flattenValuesFromRow(undefined, ['test']))).toBe('{}');
    });

    test('with values', () => {
        const data = {
            test1: { value: 123, displayValue: 'TEST123' },
            test2: { value: 456 },
            test3: { value: null },
            test4: undefined,
        };

        expect(flattenValuesFromRow(data, Object.keys(data)).test0).toBe(undefined);
        expect(flattenValuesFromRow(data, Object.keys(data)).test1).toBe(123);
        expect(flattenValuesFromRow(data, Object.keys(data)).test2).toBe(456);
        expect(flattenValuesFromRow(data, Object.keys(data)).test3).toBe(null);
        expect(flattenValuesFromRow(data, Object.keys(data)).test4).toBe(undefined);
    });
});
