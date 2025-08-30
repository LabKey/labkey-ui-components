import { Map } from 'immutable';

import { initializeValue } from './FileInput';

describe('FileInput', () => {
    test('initializeValue', () => {
        expect(initializeValue(undefined)).toEqual({ data: undefined, formValue: undefined });
        expect(initializeValue(null)).toEqual({ data: undefined, formValue: undefined });
        expect(initializeValue('')).toEqual({ data: undefined, formValue: undefined });
        expect(initializeValue('   ')).toEqual({ data: undefined, formValue: undefined });
        expect(initializeValue('  some/file/path1 ')).toEqual({
            data: 'some/file/path1',
            formValue: 'some/file/path1',
        });
        expect(initializeValue(Map())).toEqual({ data: Map(), formValue: undefined });
        expect(initializeValue(Map({ path: 'some/file/path' }))).toEqual({
            data: Map({ path: 'some/file/path' }),
            formValue: undefined,
        });
        expect(initializeValue(Map({ value: 'some/file/path' }))).toEqual({
            data: Map({ value: 'some/file/path' }),
            formValue: 'some/file/path',
        });
    });
});
