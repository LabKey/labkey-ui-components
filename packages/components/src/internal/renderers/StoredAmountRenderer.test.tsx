import { fromJS, List } from 'immutable';

import { ValueDescriptor } from '../components/editable/models';

import { StoredAmountRenderer } from './StoredAmountRenderer';

describe('StoredAmountRenderer', () => {
    test('getEditableRawValue', () => {
        expect(StoredAmountRenderer.getEditableRawValue(List.of())).toBe(undefined);
        expect(StoredAmountRenderer.getEditableRawValue(List.of({} as ValueDescriptor))).toBe(undefined);
        expect(StoredAmountRenderer.getEditableRawValue(List.of({} as ValueDescriptor, {} as ValueDescriptor))).toBe(
            undefined
        );
        expect(StoredAmountRenderer.getEditableRawValue(List.of({ raw: 1 } as ValueDescriptor))).toBe(undefined);
        expect(StoredAmountRenderer.getEditableRawValue(List.of({ raw: 1, display: 'test' } as ValueDescriptor))).toBe(
            'test'
        );
    });

    test('getOriginalRawValue', () => {
        expect(StoredAmountRenderer.getOriginalRawValue(1)).toBe(1);
        expect(StoredAmountRenderer.getOriginalRawValue('test')).toBe('test');
        expect(StoredAmountRenderer.getOriginalRawValue(List.of({}))).toBe(undefined);
        expect(StoredAmountRenderer.getOriginalRawValue(List.of({ value: 1 }))).toBe(undefined);
        expect(StoredAmountRenderer.getOriginalRawValue(List.of({ value: 1, displayValue: 'test' }))).toBe('test');
        expect(StoredAmountRenderer.getOriginalRawValue(List.of(fromJS({})))).toBe(undefined);
        expect(StoredAmountRenderer.getOriginalRawValue(List.of(fromJS({ value: 1 })))).toBe(undefined);
        expect(StoredAmountRenderer.getOriginalRawValue(List.of(fromJS({ value: 1, displayValue: 'test' })))).toBe(
            'test'
        );
    });
});
