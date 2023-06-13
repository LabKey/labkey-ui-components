import { genCellKey, getCellKeySortableIndex, getSortedCellKeys, parseCellKey } from './utils';

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

    test('getCellKeySortableIndex', () => {
        expect(getCellKeySortableIndex('0-0', 0)).toBe(0);
        expect(getCellKeySortableIndex('0-0', 10)).toBe(0);
        expect(getCellKeySortableIndex('1-0', 10)).toBe(10);
        expect(getCellKeySortableIndex('0-1', 10)).toBe(1);
        expect(getCellKeySortableIndex('1-1', 10)).toBe(11);
        expect(getCellKeySortableIndex('10-10', 10)).toBe(110);
    });

    test('getSortedCellKeys', () => {
        expect(getSortedCellKeys(['0-0', '1-1', '0-1', '1-0'], 0)).toStrictEqual(['0-0', '1-0', '1-1', '0-1']);
        expect(getSortedCellKeys(['0-0', '1-1', '0-1', '1-0'], 10)).toStrictEqual(['0-0', '0-1', '1-0', '1-1']);
        expect(getSortedCellKeys(['1-1', '1-15', '0-10', '1-5'], 10)).toStrictEqual(['0-10', '1-1', '1-5', '1-15']);
    });
});
