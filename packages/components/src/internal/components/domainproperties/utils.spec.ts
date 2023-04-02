import { parentAliasInvalid } from './utils';

describe('domain property utils', () => {
    test('parentAliasInvalid', () => {
        expect(parentAliasInvalid(undefined)).toBeTruthy();
        expect(parentAliasInvalid(null)).toBeTruthy();
        expect(parentAliasInvalid({})).toBeTruthy();
        expect(parentAliasInvalid({ alias: 'ali', parentValue: { value: 'val' } })).toBeFalsy();

        expect(
            parentAliasInvalid({
                alias: undefined,
                parentValue: { value: 'val' },
            })
        ).toBeTruthy();
        expect(parentAliasInvalid({ alias: null, parentValue: { value: 'val' } })).toBeTruthy();
        expect(parentAliasInvalid({ alias: '', parentValue: { value: 'val' } })).toBeTruthy();
        expect(parentAliasInvalid({ alias: ' ', parentValue: { value: 'val' } })).toBeTruthy();

        expect(parentAliasInvalid({ alias: 'ali', parentValue: undefined })).toBeTruthy();
        expect(
            parentAliasInvalid({
                alias: 'ali',
                parentValue: { value: undefined },
            })
        ).toBeTruthy();
        expect(parentAliasInvalid({ alias: 'ali', parentValue: { value: null } })).toBeTruthy();
        expect(parentAliasInvalid({ alias: 'ali', parentValue: { value: '' } })).toBeTruthy();

        expect(
            parentAliasInvalid({
                alias: 'ali',
                parentValue: { value: 'val' },
                isDupe: true,
            })
        ).toBeTruthy();
        expect(
            parentAliasInvalid({
                alias: 'ali',
                parentValue: { value: 'val' },
                isDupe: false,
            })
        ).toBeFalsy();
    });
});
