import { fromJS } from 'immutable';

import { DomainDesign, DomainDetails } from '../models';

import { SampleTypeModel } from './models';

describe('SampleTypeModel', () => {
    test('isNew', () => {
        expect(SampleTypeModel.create().isNew()).toBeTruthy();
        expect(SampleTypeModel.create({ options: fromJS({ rowId: undefined }) } as DomainDetails).isNew()).toBeTruthy();
        expect(SampleTypeModel.create({ options: fromJS({ rowId: null }) } as DomainDetails).isNew()).toBeTruthy();
        expect(SampleTypeModel.create({ options: fromJS({ rowId: 0 }) } as DomainDetails).isNew()).toBeTruthy();
        expect(SampleTypeModel.create({ options: fromJS({ rowId: 1 }) } as DomainDetails).isNew()).toBeFalsy();
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
            SampleTypeModel.create({ options: fromJS({ metricUnit: 'ml' }) } as DomainDetails, undefined).metricUnit
        ).toBe('ml');
    });

    test('containerPath', () => {
        expect(SampleTypeModel.create().containerPath).toBeUndefined();
        expect(SampleTypeModel.create({ containerPath: 'Bam' } as any).containerPath).toBeUndefined();

        const expectedContainerPath = '/Some/Container/Path';
        const model = SampleTypeModel.create().set(
            'domain',
            DomainDesign.create({ container: expectedContainerPath })
        ) as SampleTypeModel;
        expect(model.containerPath).toEqual(expectedContainerPath);
    });
});
