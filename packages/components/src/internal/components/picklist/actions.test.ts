import { getPicklistUrl } from './actions';

describe('picklist actions', () => {
    test('getPicklistUrl', () => {
        expect(getPicklistUrl(1)).toBe('#/picklist/1');
        expect(getPicklistUrl('12' as any)).toBe('#/picklist/12');
        expect(getPicklistUrl(1, undefined, 'current')).toBe('#/picklist/1');
        expect(getPicklistUrl(1, 'product', undefined)).toBe('#/picklist/1');
        expect(getPicklistUrl(1, 'product', 'current')).toBe('/labkey/product/app.view#/picklist/1');
    });
});
