import { naturalSort } from '../..';

function indexOf(source: string, token: string, caseSensitive?: boolean): number {
    if (!source || !token) return -1;

    const ss = caseSensitive === true ? source : source.toLowerCase();
    const tt = caseSensitive === true ? token : token.toLowerCase();

    return ss.indexOf(tt);
}

export function contains(s: string, token: string, caseSensitive?: boolean): boolean {
    return indexOf(s, token, caseSensitive) > -1;
}

export function hasPrefix(s: string, prefix: string, caseSensitive?: boolean): boolean {
    return indexOf(s, prefix, caseSensitive) === 0;
}

export function similaritySortFactory(token: string, caseSensitive?: boolean): (rawA: any, rawB: any) => number {
    if (!token) return naturalSort;

    // Derived from https://stackoverflow.com/a/47132167
    return (rawA, rawB) => {
        if (!rawA) return 1;
        if (!rawB) return -1;

        const a = caseSensitive === true ? rawA : rawA.toLowerCase();
        const b = caseSensitive === true ? rawB : rawB.toLowerCase();

        if (a === b) return 0;
        if (a === token && b !== token) return -1;

        const ahp = hasPrefix(a, token, caseSensitive);
        const bhp = hasPrefix(b, token, caseSensitive);

        if (ahp && !bhp) return -1;
        if (!ahp && bhp) return 1;
        if (ahp && bhp) return naturalSort(rawA, rawB);

        const ac = contains(a, token, caseSensitive);
        const bc = contains(b, token, caseSensitive);

        if (ac && !bc) return -1;
        if (!ac && bc) return 1;

        return naturalSort(rawA, rawB);
    };
}
