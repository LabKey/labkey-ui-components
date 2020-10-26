import { fromJS } from 'immutable';

import { DomainDetails } from '../models';

import { IParentAlias, SampleTypeModel } from './models';

describe('SampleTypeModel', () => {
    test('isNew', () => {
        expect(SampleTypeModel.create().isNew()).toBeTruthy();
        expect(SampleTypeModel.create({ options: fromJS({ rowId: undefined }) } as DomainDetails).isNew()).toBeTruthy();
        expect(SampleTypeModel.create({ options: fromJS({ rowId: null }) } as DomainDetails).isNew()).toBeTruthy();
        expect(SampleTypeModel.create({ options: fromJS({ rowId: 0 }) } as DomainDetails).isNew()).toBeTruthy();
        expect(SampleTypeModel.create({ options: fromJS({ rowId: 1 }) } as DomainDetails).isNew()).toBeFalsy();
    });

    test('parentAliasInvalid', () => {
        expect(SampleTypeModel.create().parentAliasInvalid(undefined)).toBeTruthy();
        expect(SampleTypeModel.create().parentAliasInvalid(null)).toBeTruthy();
        expect(SampleTypeModel.create().parentAliasInvalid({} as IParentAlias)).toBeTruthy();
        expect(
            SampleTypeModel.create().parentAliasInvalid({ alias: 'ali', parentValue: { value: 'val' } } as IParentAlias)
        ).toBeFalsy();

        expect(
            SampleTypeModel.create().parentAliasInvalid({
                alias: undefined,
                parentValue: { value: 'val' },
            } as IParentAlias)
        ).toBeTruthy();
        expect(
            SampleTypeModel.create().parentAliasInvalid({ alias: null, parentValue: { value: 'val' } } as IParentAlias)
        ).toBeTruthy();
        expect(
            SampleTypeModel.create().parentAliasInvalid({ alias: '', parentValue: { value: 'val' } } as IParentAlias)
        ).toBeTruthy();
        expect(
            SampleTypeModel.create().parentAliasInvalid({ alias: ' ', parentValue: { value: 'val' } } as IParentAlias)
        ).toBeTruthy();

        expect(
            SampleTypeModel.create().parentAliasInvalid({ alias: 'ali', parentValue: undefined } as IParentAlias)
        ).toBeTruthy();
        expect(
            SampleTypeModel.create().parentAliasInvalid({
                alias: 'ali',
                parentValue: { value: undefined },
            } as IParentAlias)
        ).toBeTruthy();
        expect(
            SampleTypeModel.create().parentAliasInvalid({ alias: 'ali', parentValue: { value: null } } as IParentAlias)
        ).toBeTruthy();
        expect(
            SampleTypeModel.create().parentAliasInvalid({ alias: 'ali', parentValue: { value: '' } } as IParentAlias)
        ).toBeTruthy();

        expect(
            SampleTypeModel.create().parentAliasInvalid({
                alias: 'ali',
                parentValue: { value: 'val' },
                isDupe: true,
            } as IParentAlias)
        ).toBeTruthy();
        expect(
            SampleTypeModel.create().parentAliasInvalid({
                alias: 'ali',
                parentValue: { value: 'val' },
                isDupe: false,
            } as IParentAlias)
        ).toBeFalsy();
    });

    test('hasValidProperties', () => {
        expect(
            SampleTypeModel.create({ options: fromJS({ rowId: 1 }) } as DomainDetails, undefined).hasValidProperties()
        ).toBeFalsy();
        expect(
            SampleTypeModel.create({ options: fromJS({ rowId: 1 }) } as DomainDetails, null).hasValidProperties()
        ).toBeFalsy();
        expect(
            SampleTypeModel.create({ options: fromJS({ rowId: 1 }) } as DomainDetails, '').hasValidProperties()
        ).toBeFalsy();
        expect(
            SampleTypeModel.create({ options: fromJS({ rowId: 1 }) } as DomainDetails, ' ').hasValidProperties()
        ).toBeFalsy();
        expect(
            SampleTypeModel.create({ options: fromJS({ rowId: 1 }) } as DomainDetails, 'test').hasValidProperties()
        ).toBeTruthy();
    });

    test('labelColor value', () => {
        expect(SampleTypeModel.create({ options: fromJS({}) } as DomainDetails, undefined).labelColor).toBe(undefined);
        expect(
            SampleTypeModel.create({ options: fromJS({ labelColor: undefined }) } as DomainDetails, undefined)
                .labelColor
        ).toBe(undefined);
        expect(
            SampleTypeModel.create({ options: fromJS({ labelColor: null }) } as DomainDetails, undefined).labelColor
        ).toBe(undefined);
        expect(
            SampleTypeModel.create({ options: fromJS({ labelColor: '#000000' }) } as DomainDetails, undefined)
                .labelColor
        ).toBe('#000000');
    });

    test('metricUnit value', () => {
        expect(SampleTypeModel.create({ options: fromJS({}) } as DomainDetails, undefined).metricUnit).toBe(undefined);
        expect(
            SampleTypeModel.create({ options: fromJS({ metricUnit: undefined }) } as DomainDetails, undefined)
                .metricUnit
        ).toBe(undefined);
        expect(
            SampleTypeModel.create({ options: fromJS({ metricUnit: null }) } as DomainDetails, undefined).metricUnit
        ).toBe(undefined);
        expect(
            SampleTypeModel.create({ options: fromJS({ metricUnit: 'ml' }) } as DomainDetails, undefined)
                .metricUnit
        ).toBe('ml');
    });

    // TODO add tests for getDuplicateAlias
});
