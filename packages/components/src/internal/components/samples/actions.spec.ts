import { List } from 'immutable';

import { getRowIdsFromSelection } from './actions';

describe('getSampleRowIdsFromSelection', () => {
    test('none', () => {
        expect(JSON.stringify(getRowIdsFromSelection(undefined))).toBe('[]');
        expect(JSON.stringify(getRowIdsFromSelection(List()))).toBe('[]');
    });
    test('not empty', () => {
        expect(JSON.stringify(getRowIdsFromSelection(List.of('1', '2', '3')))).toBe('[1,2,3]');
        expect(JSON.stringify(getRowIdsFromSelection(List.of(1, 2, 3)))).toBe('[1,2,3]');
    });
});
