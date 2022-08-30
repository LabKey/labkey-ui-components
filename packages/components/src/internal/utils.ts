export function genCellKey(colIdx: number, rowIdx: number): string {
    return [colIdx, rowIdx].join('-');
}

export function parseCellKey(cellKey: string): { colIdx: number; rowIdx: number } {
    const [colIdx, rowIdx] = cellKey.split('-');

    return {
        colIdx: parseInt(colIdx, 10),
        rowIdx: parseInt(rowIdx, 10),
    };
}

// exported for jest testing
export function getCellKeySortableIndex(cellKey: string, rowCount: number): number {
    const { rowIdx, colIdx } = parseCellKey(cellKey);
    return colIdx * rowCount + rowIdx;
}

// exported for jest testing
export function getSortedCellKeys(cellKeys: string[], rowCount: number): string[] {
    return cellKeys.sort((a, b) => {
        return getCellKeySortableIndex(a, rowCount) - getCellKeySortableIndex(b, rowCount);
    });
}

// https://stackoverflow.com/questions/10713878/decimal-subtraction-problems-in-javascript
export function decimalDifference(first, second, subtract = true): number {
    const multiplier = 10000; // this will only help/work to 4 decimal places
    return (first * multiplier + (subtract ? -1 : 1) * second * multiplier) / multiplier;
}
