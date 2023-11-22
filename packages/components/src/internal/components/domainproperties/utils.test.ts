import { Set, OrderedMap } from 'immutable';

import { IParentAlias } from '../entities/models';

import { getDuplicateAlias, parentAliasInvalid } from './utils';

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

describe('getDuplicateAlias', () => {
    test('without parentAliases', () => {
        expect(getDuplicateAlias(undefined)).toEqual(new Set());
    });

    test('with parentAliases', () => {
        const parentAliases = new OrderedMap({
            alias1: { id: 'id1', alias: 'alias1', parentValue: { value: 'val1' } } as IParentAlias,
            alias2: { id: 'id2', alias: 'alias2', parentValue: { value: 'val2' } } as IParentAlias,
            alias3: { id: 'id3', alias: 'alias1', parentValue: { value: 'val3' } } as IParentAlias,
        });
        expect(getDuplicateAlias(parentAliases)).toEqual(new Set(['id3']));
        expect(getDuplicateAlias(parentAliases, true)).toEqual(new Set(['alias1']));
    });
});
