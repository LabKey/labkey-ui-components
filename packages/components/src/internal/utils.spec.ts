import { genCellKey, sortCellKeys, parseCellKey } from './utils';

describe('CellKey', () => {
    test('genCellKey', () => {
        expect(genCellKey(0, 0)).toBe('0-0');
        expect(genCellKey(1, 2)).toBe('1-2');
    });

    test('parseCellKey', () => {
        expect(parseCellKey('0-0').colIdx).toBe(0);
        expect(parseCellKey('0-0').rowIdx).toBe(0);
        expect(parseCellKey('1-2').colIdx).toBe(1);
        expect(parseCellKey('1-2').rowIdx).toBe(2);
    });

    test('getSortedCellKeys', () => {
        expect(sortCellKeys(['0-0', '1-1', '0-1', '1-0'])).toStrictEqual(['0-0', '1-0', '0-1', '1-1']);
        expect(sortCellKeys(['1-1', '1-15', '0-10', '1-5'])).toStrictEqual(['1-1', '1-5', '0-10', '1-15']);
    });
});
