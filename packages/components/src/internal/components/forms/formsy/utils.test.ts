// This file was originally derived from the "formsy-react" package, specifically, v2.3.2.
// Credit: Christian Alfoni and the Formsy Authors
// Repository: https://github.com/formsy/formsy-react/tree/0226fab133a25
import * as utils from './utils';

function getReadable(value, index) {
    return `${typeof value} at ${index}`;
}

const TYPES = {
    isDate: [new Date(1000), new Date(2000)],
    isFunction: [() => 2 + 2, () => 2 + 3, () => {}],
    isObject: [{}, { foo: 'bar' }, { foo: 'lounge' }],
    isString: ['', 'Hello', 'Goodbye'],
};

const VALUES = [null, ...TYPES.isDate, ...TYPES.isFunction, ...TYPES.isObject, ...TYPES.isString];

describe('utils', () => {
    // For each function in types
    Object.keys(TYPES).forEach(isFn => {
        // Create a test for that function
        it(isFn, () => {
            // For each value in values
            VALUES.forEach(value => {
                // Make sure that if it is in that types TYPES array, it returns true
                expect(utils[isFn](value)).toBe(TYPES[isFn].includes(value));
            });
        });
    });

    // For every value in values, run isSame(a, b) with every other value in the array.
    // Expect isSame to return true only if you are at the same point in the array.
    VALUES.forEach((a, idxa) => {
        VALUES.forEach((b, idxb) => {
            const isSame = idxa === idxb;

            it(`isSame: ${getReadable(a, idxa)} ${isSame ? '==' : '!='} ${getReadable(b, idxb)}`, () => {
                expect(utils.isSame(a, b)).toBe(isSame);
            });
        });
    });

    it('runRules', () => {
        expect(utils.runRules('', {}, {}, {})).toEqual({ errors: [], failed: [], success: [] });

        expect(() => utils.runRules('', {}, { rule: () => {} }, { rule: () => {} })).toThrow(
            'Formsy does not allow you to override default validations: rule'
        );

        expect(() => utils.runRules('', {}, { rule: true }, {})).toThrow(
            'Formsy does not have the validation rule: rule'
        );

        expect(utils.runRules('', {}, { rule: () => 'Error' }, {})).toEqual({
            errors: ['Error'],
            failed: ['rule'],
            success: [],
        });

        expect(utils.runRules('', {}, { rule: () => true }, {})).toEqual({
            errors: [],
            failed: [],
            success: ['rule'],
        });

        expect(utils.runRules('', {}, { rule: () => false }, {})).toEqual({
            errors: [],
            failed: ['rule'],
            success: [],
        });
        expect(utils.runRules('', {}, { rule: true }, { rule: () => false })).toEqual({
            errors: [],
            failed: ['rule'],
            success: [],
        });
        expect(utils.runRules('', {}, { rule: true }, { rule: () => true })).toEqual({
            errors: [],
            failed: [],
            success: ['rule'],
        });
        expect(utils.runRules('', {}, { rule: false }, { rule: () => false })).toEqual({
            errors: [],
            failed: ['rule'],
            success: [],
        });

        expect(utils.runRules('', {}, { rule: true }, { rule: (_cv, _v, validationsVal) => validationsVal })).toEqual({
            errors: [],
            failed: [],
            success: ['rule'],
        });
        expect(utils.runRules('', {}, { rule: false }, { rule: (_cv, _v, validationsVal) => validationsVal })).toEqual({
            errors: [],
            failed: ['rule'],
            success: [],
        });
        expect(utils.runRules('', {}, { rule: true }, { rule: (_cv, _v, _validationsVal) => 'Error' })).toEqual({
            errors: ['Error'],
            failed: ['rule'],
            success: [],
        });
    });

    describe('isShallowSame', () => {
        it('compares message maps by key set and value identity', () => {
            const message = 'This sequence has already been registered.';

            expect(utils.isShallowSame({ isUnique: message }, { isUnique: message })).toBe(true);
            expect(utils.isShallowSame({ isUnique: message }, { isUnique: 'Something else' })).toBe(false);
            expect(utils.isShallowSame({ isUnique: message }, { isUnique: message, isRequired: message })).toBe(false);
            expect(utils.isShallowSame({ isUnique: message }, { isValid: message })).toBe(false);
        });

        it('treats structurally equal but distinct values as changed, unlike isSame()', () => {
            // Stands in for a ReactNode message. Elements are rebuilt on every render, so identity is the only
            // signal that can be trusted -- isSame() would walk into React internals and report a false match.
            const messages = { isUnique: { type: 'span', props: { children: 'Already registered.' } } };
            const rebuilt = { isUnique: { type: 'span', props: { children: 'Already registered.' } } };

            expect(utils.isSame(messages, rebuilt)).toBe(true);
            expect(utils.isShallowSame(messages, rebuilt)).toBe(false);
        });

        it('compares resolved message arrays element-wise by identity', () => {
            const message = { type: 'span', props: { children: 'Already registered.' } };

            expect(utils.isShallowSame([message], [message])).toBe(true);
            expect(utils.isShallowSame([message], [{ ...message }])).toBe(false);
            expect(utils.isShallowSame(['Required'], ['Required'])).toBe(true);
            expect(utils.isShallowSame([], ['Required'])).toBe(false);
        });
    });
});
