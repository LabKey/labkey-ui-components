/**
 * Returns value if it is not undefined, or defaultValue.
 * @param value
 * @param defaultValue
 */
import { Filter } from '@labkey/api';

import { IDataViewInfo } from '../models';
import { naturalSort, QuerySort } from '..';

export function dataViewInfoSorter(a: IDataViewInfo, b: IDataViewInfo): number {
    return naturalSort(a.name, b.name);
}

export function filterToString(filter: Filter.IFilter): string {
    return `${filter.getColumnName()}-${filter.getFilterType().getURLSuffix()}-${filter.getValue()}`;
}

export function filtersEqual(a: Filter.IFilter, b: Filter.IFilter): boolean {
    return filterToString(a) === filterToString(b);
}

export function filterArraysEqual(a: Filter.IFilter[], b: Filter.IFilter[]): boolean {
    if (a.length !== b.length) {
        return false;
    }

    const aStr = a.map(filterToString).sort(naturalSort).join(';');
    const bStr = b.map(filterToString).sort(naturalSort).join(';');

    return aStr === bStr;
}

export function sortsEqual(a: QuerySort, b: QuerySort): boolean {
    return a.toRequestString() === b.toRequestString();
}

export function sortArraysEqual(a: QuerySort[], b: QuerySort[]): boolean {
    if (a.length !== b.length) {
        return false;
    }

    const aStr = a
        .map(qs => qs.toRequestString())
        .sort(naturalSort)
        .join(';');
    const bStr = b
        .map(qs => qs.toRequestString())
        .sort(naturalSort)
        .join(';');
    return aStr === bStr;
}
