/**
 * Compares two string objects for doing alphanumeric (natural) sorting.
 * Returns a positive number if the first string comes after the second in a natural sort; 0 if they are equal
 * and a negative number if the second comes after the first.
 * @param aso
 * @param bso
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function naturalSort(aso: any, bso: any): number {
    // http://stackoverflow.com/questions/19247495/alphanumeric-sorting-an-array-in-javascript
    if (aso === bso) return 0;
    if (aso === undefined || aso === null || aso === '') return 1;
    if (bso === undefined || bso === null || bso === '') return -1;

    let a,
        b,
        a1,
        b1,
        i = 0,
        n,
        L,
        rx = /(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;

    a = aso.toString().toLowerCase().match(rx);
    b = bso.toString().toLowerCase().match(rx);

    L = a.length;
    while (i < L) {
        if (!b[i]) return 1;
        a1 = a[i];
        b1 = b[i++];
        if (a1 !== b1) {
            n = a1 - b1;
            if (!isNaN(n)) return n;
            return a1 > b1 ? 1 : -1;
        }
    }
    return b[i] ? -1 : 0;
}

type SortFn<T> = (a: T, b: T) => number;

/**
 * Creates a sort function that will natural sort an array of objects by property.
 * Ex:`
 *  const myArray = [{ displayName: 'Nick' }, { displayName: 'Alan' }, { displayName: 'Susan' }];
 *  myArray.sort(naturalSortByProperty('displayName'));
 * @param property: string, the property you want to sort on.
 */
export function naturalSortByProperty<T>(property: keyof T): SortFn<T> {
    return (a, b) => naturalSort(a[property], b[property]);
}
