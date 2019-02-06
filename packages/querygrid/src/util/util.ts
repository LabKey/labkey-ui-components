
let DOM_COUNT = 0;

// Generate an id with a dom-unique integer suffix
export function generateId(prefix: string): string {
    return prefix + DOM_COUNT++;
}

// Compares two string objects for doing alphanumeric (natural) sorting.
// Returns 1 if the first string comes after the second in a natural sort; 0 if they are equal
// and -1 if the second comes after the first.
export function naturalSort(aso: string, bso: string): number {
    // http://stackoverflow.com/questions/19247495/alphanumeric-sorting-an-array-in-javascript
    if (aso === bso) return 0;
    if (aso === undefined || aso === null || aso === '') return 1;
    if (bso === undefined || bso === null || bso === '') return -1;

    let a, b, a1, b1, i = 0, n, L,
        rx=/(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;

    a = aso.toString().toLowerCase().match(rx);
    b = bso.toString().toLowerCase().match(rx);

    L = a.length;
    while (i < L) {
        if (!b[i]) return 1;
        a1 = a[i]; b1 = b[i++];
        if (a1 !== b1) {
            n = a1 - b1;
            if (!isNaN(n)) return n;
            return a1 > b1 ? 1 : -1;
        }
    }
    return b[i] ? -1 : 0;
}
