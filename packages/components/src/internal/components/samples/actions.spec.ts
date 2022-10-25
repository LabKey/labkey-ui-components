import { List, fromJS } from 'immutable';

import { getUpdatedLineageRows, getRowIdsFromSelection } from './actions';

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
DATA = DATA.setIn(
    ['1', 'MaterialInputs/One'],
    List.of({
        value: 1,
        displayValue: 'A',
    })
);
DATA = DATA.setIn(
    ['1', 'MaterialInputs/Two'],
    List.of(
        {
            value: 2,
            displayValue: 'B',
        },
        {
            value: 3,
            displayValue: 'C',
        }
    )
);

describe('getUpdatedLineageRows', () => {
    test('no changes', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'A', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
            ],
            DATA.toJS(),
            []
        );
        expect(updatedRows.length).toBe(0);
    });

    test('add to existing parent', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'A', 'MaterialInputs/Two': 'B, C, D' },
                { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
            ],
            DATA.toJS(),
            []
        );
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(1);
        expect(updatedRows[0]['MaterialInputs/One']).toBe('A');
        expect(updatedRows[0]['MaterialInputs/Two']).toBe('B, C, D');
    });

    test('replace existing parent', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'D', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
            ],
            DATA.toJS(),
            []
        );
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(1);
        expect(updatedRows[0]['MaterialInputs/One']).toBe('D');
        expect(updatedRows[0]['MaterialInputs/Two']).toBe('B, C');
    });

    test('remove existing parent', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': '', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': '', 'MaterialInputs/Two': '' },
            ],
            DATA.toJS(),
            []
        );
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(1);
        expect(updatedRows[0]['MaterialInputs/One']).toBe('');
        expect(updatedRows[0]['MaterialInputs/Two']).toBe('B, C');
    });

    test('add new parent', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'A', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': 'A, B', 'MaterialInputs/Two': '' },
            ],
            DATA.toJS(),
            []
        );
        expect(updatedRows.length).toBe(1);
        expect(updatedRows[0].RowId).toBe(2);
        expect(updatedRows[0]['MaterialInputs/One']).toBe('A, B');
        expect(updatedRows[0]['MaterialInputs/Two']).toBe('');
    });

    test('exclude aliquots', () => {
        const updatedRows = getUpdatedLineageRows(
            [
                { RowId: 1, 'MaterialInputs/One': 'A, B', 'MaterialInputs/Two': 'B, C' },
                { RowId: 2, 'MaterialInputs/One': 'A, B', 'MaterialInputs/Two': '' },
            ],
            DATA.toJS(),
            [1, 2]
        );
        expect(updatedRows.length).toBe(0);
    });
});

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
