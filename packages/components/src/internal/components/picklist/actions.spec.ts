import { convertPicklistSampleTypeData, getPicklistUrl } from './actions';

describe('picklist actions', () => {
    describe('convertPicklistSampleTypeData', () => {
        test('without sample types', () => {
            const response = convertPicklistSampleTypeData([]);
            expect(Object.keys(response).length).toBe(0);
        });

        test('with sample types', () => {
            const response = convertPicklistSampleTypeData([
                { SampleType: { displayValue: 'test1' } },
                { SampleType: { displayValue: 'test2' } },
                { SampleType: { displayValue: 'test3' } },
            ]);
            expect(Object.keys(response).length).toBe(3);
            expect(response[0]).toBe('test1');
            expect(response[1]).toBe('test2');
            expect(response[2]).toBe('test3');
        });
    });

    test('getPicklistUrl', () => {
        expect(getPicklistUrl(1)).toBe('#/picklist/1');
        expect(getPicklistUrl('12' as any)).toBe('#/picklist/12');
        expect(getPicklistUrl(1, undefined, 'current')).toBe('#/picklist/1');
        expect(getPicklistUrl(1, 'product', undefined)).toBe('#/picklist/1');
        expect(getPicklistUrl(1, 'product', 'current')).toBe('/labkey/product/app.view#/picklist/1');
    });
});
