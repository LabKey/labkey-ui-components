// TODO: All of these methods should be moved to the editable folder.

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

/**
 * Sorts cell keys left to right, top to bottom.
 */
export function sortCellKeys(cellKeys: string[]): string[] {
    return cellKeys.sort((a, b) => {
        const aCoords = parseCellKey(a);
        const bCoords = parseCellKey(b);
        if (aCoords.rowIdx === bCoords.rowIdx) return aCoords.colIdx - bCoords.colIdx;
        return aCoords.rowIdx - bCoords.rowIdx;
    });
}

// https://stackoverflow.com/questions/10713878/decimal-subtraction-problems-in-javascript
export function decimalDifference(first, second, subtract = true): number {
    const multiplier = 10000; // this will only help/work to 4 decimal places
    return (first * multiplier + (subtract ? -1 : 1) * second * multiplier) / multiplier;
}
