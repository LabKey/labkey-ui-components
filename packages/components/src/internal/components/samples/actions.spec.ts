import { List } from 'immutable';

import { getSampleRowIdsFromSelection } from './actions';

describe('getSampleRowIdsFromSelection', () => {
    test('none', () => {
        expect(JSON.stringify(getSampleRowIdsFromSelection(undefined))).toBe('[]');
        expect(JSON.stringify(getSampleRowIdsFromSelection(List()))).toBe('[]');
    });
    test('not empty', () => {
        expect(JSON.stringify(getSampleRowIdsFromSelection(List.of('1', '2', '3')))).toBe('[1,2,3]');
        expect(JSON.stringify(getSampleRowIdsFromSelection(List.of(1, 2, 3)))).toBe('[1,2,3]');
    });
});
