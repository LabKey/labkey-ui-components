import { List, fromJS } from 'immutable';

import { getUpdatedLineageRows } from './SamplesEditableGrid';
import { QueryGridModel } from '../../QueryGridModel';

let DATA = fromJS({
    '1': {
        RowId: 1,
        'MaterialInputs/One': List(),
        'MaterialInputs/Two': List(),
    },
    '2': {
        RowId: 2,
        'MaterialInputs/One': List(),
        'MaterialInputs/Two': List(),
    },
});
DATA = DATA.setIn(['1', 'MaterialInputs/One'], List.of({
    value: 1,
    displayValue: 'A'
}));
DATA = DATA.setIn(['1', 'MaterialInputs/Two'], List.of({
    value: 2,
    displayValue: 'B'
},{
    value: 3,
    displayValue: 'C'
}));
const ORIGINAL_MODEL = new QueryGridModel({ data: DATA });

describe('getUpdatedLineageRows', () => {
    test('no changes', () => {
        const updatedRows = getUpdatedLineageRows([
            { RowId: 1, 'MaterialInputs/One': 'A', 'MaterialInputs/Two': 'B, C' },
            { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
        ], ORIGINAL_MODEL, []);
        expect(updatedRows.length).toBe(0);
    });

    test('add to existing parent', () => {
        const updatedRows = getUpdatedLineageRows([
            { RowId: 1, 'MaterialInputs/One': 'A', 'MaterialInputs/Two': 'B, C, D' },
            { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
        ], ORIGINAL_MODEL, []);
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(1);
    });

    test('replace existing parent', () => {
        const updatedRows = getUpdatedLineageRows([
            { RowId: 1, 'MaterialInputs/One': 'D', 'MaterialInputs/Two': 'B, C' },
            { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
        ], ORIGINAL_MODEL, []);
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(1);
    });

    test('remove existing parent', () => {
        const updatedRows = getUpdatedLineageRows([
            { RowId: 1, 'MaterialInputs/One': '', 'MaterialInputs/Two': 'B, C' },
            { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
        ], ORIGINAL_MODEL, []);
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(1);
    });

    test('add new parent', () => {
        const updatedRows = getUpdatedLineageRows([
            { RowId: 1, 'MaterialInputs/One': 'A', 'MaterialInputs/Two': 'B, C' },
            { RowId: 2, 'MaterialInputs/One': 'A, B', 'MaterialInputs/Two': '' },
        ], ORIGINAL_MODEL, []);
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(2);
    });

    test('exclude aliquots', () => {
        const updatedRows = getUpdatedLineageRows([
            { RowId: 1, 'MaterialInputs/One': 'A, B', 'MaterialInputs/Two': 'B, C' },
            { RowId: 2, 'MaterialInputs/One': 'A, B', 'MaterialInputs/Two': '' },
        ], ORIGINAL_MODEL, [1,2]);
        expect(updatedRows.length).toBe(0);
    });
});
