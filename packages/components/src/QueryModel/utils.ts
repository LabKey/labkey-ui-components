/**
 * Returns value if it is not undefined, or defaultValue.
 * @param value
 * @param defaultValue
 */
import { IDataViewInfo } from '../models';
import { naturalSort, QuerySort } from '..';
import { Filter } from '@labkey/api';

export function getOrDefault(value, defaultValue?) {
    return value ?? defaultValue;
}

export function dataViewInfoSorter(a: IDataViewInfo, b: IDataViewInfo): number {
    return naturalSort(a.name, b.name);
}

export function filterToString(filter: Filter.IFilter) {
    return `${filter.getColumnName()}-${filter.getFilterType().getURLSuffix()}-${filter.getValue()}`;
}

export function filtersEqual(a: Filter.IFilter, b: Filter.IFilter) {
    return filterToString(a) === filterToString(b);
}

export function filterArraysEqual(a: Filter.IFilter[], b: Filter.IFilter[]) {
    if (a.length !== b.length) {
        return false;
    }

    const aStr = a.map(filterToString).sort(naturalSort).join(';');
    const bStr = b.map(filterToString).sort(naturalSort).join(';');

    return aStr === bStr;
}

export function sortsEqual(a: QuerySort, b: QuerySort) {
    return a.toRequestString() === b.toRequestString();
}

export function sortArraysEqual(a: QuerySort[], b: QuerySort[]) {
    if (a.length !== b.length) {
        return false;
    }

    const aStr = a.map(qs => qs.toRequestString()).sort(naturalSort).join(';');
    const bStr = b.map(qs => qs.toRequestString()).sort(naturalSort).join(';');
    return aStr === bStr;
}
