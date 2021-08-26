import { List } from 'immutable';

import { getSampleIdsFromSelection } from './actions';

describe('getSampleIdsFromSelection', () => {
    test('none', () => {
        expect(JSON.stringify(getSampleIdsFromSelection(undefined))).toBe('[]');
        expect(JSON.stringify(getSampleIdsFromSelection(List()))).toBe('[]');
    });
    test('not empty', () => {
        expect(JSON.stringify(getSampleIdsFromSelection(List.of('1', '2', '3')))).toBe('[1,2,3]');
        expect(JSON.stringify(getSampleIdsFromSelection(List.of(1, 2, 3)))).toBe('[1,2,3]');
    });
});
