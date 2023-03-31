import {SampleTypeModel} from "./samples/models";

describe('domain property utils', () => {
    test('parentAliasInvalid', () => {
        expect(SampleTypeModel.create().parentAliasInvalid(undefined)).toBeTruthy();
        expect(SampleTypeModel.create().parentAliasInvalid(null)).toBeTruthy();
        expect(SampleTypeModel.create().parentAliasInvalid({})).toBeTruthy();
        expect(
            SampleTypeModel.create().parentAliasInvalid({ alias: 'ali', parentValue: { value: 'val' } })
        ).toBeFalsy();

        expect(
            SampleTypeModel.create().parentAliasInvalid({
                alias: undefined,
                parentValue: { value: 'val' },
            })
        ).toBeTruthy();
        expect(
            SampleTypeModel.create().parentAliasInvalid({ alias: null, parentValue: { value: 'val' } })
        ).toBeTruthy();
        expect(SampleTypeModel.create().parentAliasInvalid({ alias: '', parentValue: { value: 'val' } })).toBeTruthy();
        expect(SampleTypeModel.create().parentAliasInvalid({ alias: ' ', parentValue: { value: 'val' } })).toBeTruthy();

        expect(SampleTypeModel.create().parentAliasInvalid({ alias: 'ali', parentValue: undefined })).toBeTruthy();
        expect(
            SampleTypeModel.create().parentAliasInvalid({
                alias: 'ali',
                parentValue: { value: undefined },
            })
        ).toBeTruthy();
        expect(
            SampleTypeModel.create().parentAliasInvalid({ alias: 'ali', parentValue: { value: null } })
        ).toBeTruthy();
        expect(SampleTypeModel.create().parentAliasInvalid({ alias: 'ali', parentValue: { value: '' } })).toBeTruthy();

        expect(
            SampleTypeModel.create().parentAliasInvalid({
                alias: 'ali',
                parentValue: { value: 'val' },
                isDupe: true,
            })
        ).toBeTruthy();
        expect(
            SampleTypeModel.create().parentAliasInvalid({
                alias: 'ali',
                parentValue: { value: 'val' },
                isDupe: false,
            })
        ).toBeFalsy();
    });

});

