/**
 * Compares two string objects for doing alphanumeric (natural) sorting.
 * Returns a positive number if the first string comes after the second in a natural sort; 0 if they are equal
 * and a negative number if the second comes after the first.
 * For in-depth documentation and examples see components/docs/sort.md.
 * @param aso
 * @param bso
 * @param caseSensitive
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _naturalSort(aso: any, bso: any, caseSensitive?: boolean): number {
    // http://stackoverflow.com/questions/19247495/alphanumeric-sorting-an-array-in-javascript
    if (aso === bso) return 0;
    if (aso === undefined || aso === null || aso === '') return 1;
    if (bso === undefined || bso === null || bso === '') return -1;

    let a1,
        b1,
        i = 0,
        n;

    // If no matches are found in the group, then match() will return null
    const rx = /(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;
    const asoStr = caseSensitive ? aso.toString() : aso.toString().toLowerCase();
    const bsoStr = caseSensitive ? bso.toString() : bso.toString().toLowerCase();
    const a = asoStr.match(rx) ?? [];
    const b = bsoStr.match(rx) ?? [];

    const L = a.length;
    while (i < L) {
        if (!b[i]) return 1;
        a1 = a[i];
        b1 = b[i++];
        if (a1 !== b1) {
            n = a1 - b1;
            if (!isNaN(n)) return n;
            if (caseSensitive) {
                // Compare character by character
                const minLength = Math.min(a1.length, b1.length);
                for (let charIndex = 0; charIndex < minLength; charIndex++) {
                    const charCodeA = a1.charCodeAt(charIndex);
                    const charCodeB = b1.charCodeAt(charIndex);
                    if (charCodeA !== charCodeB) {
                        const lowerCharA = String.fromCharCode(charCodeA).toLowerCase();
                        const lowerCharB = String.fromCharCode(charCodeB).toLowerCase();
                        // First compare lowercase versions to handle case-insensitive comparison
                        if (lowerCharA !== lowerCharB) {
                            return lowerCharA.charCodeAt(0) - lowerCharB.charCodeAt(0);
                        }
                        // If lowercase versions are equal, compare original char codes for case-sensitive ordering
                        if (charCodeA !== charCodeB) {
                            return charCodeA - charCodeB;
                        }
                    }
                }
                // If all characters so far are equal, the shorter string is "less than" the longer one
                if (a1.length !== b1.length)
                    return a1.length - b1.length;
            }
            return a1 > b1 ? 1 : -1;
        }
    }
    return b[i] ? -1 : 0;
}

export function naturalSort(aso: any, bso: any): number {
    return _naturalSort(aso, bso);
}

export function caseSensitiveNaturalSort(aso: any, bso: any): number {
    return _naturalSort(aso, bso, true);
}

type SortFn<T> = (a: T, b: T) => number;

/**
 * Creates a sort function that will natural sort an array of objects by property.
 * For in-depth documentation and examples see components/docs/sort.md.
 * Ex:`
 *  const myArray = [{ displayName: 'Nick' }, { displayName: 'Alan' }, { displayName: 'Susan' }];
 *  myArray.sort(naturalSortByProperty('displayName'));
 * @param property
 * @param caseSensitive
 */
export function naturalSortByProperty<T>(property: keyof T, caseSensitive?: boolean): SortFn<T> {
    return (a, b) => (caseSensitive ? caseSensitiveNaturalSort : naturalSort)(a[property], b[property]);
}
