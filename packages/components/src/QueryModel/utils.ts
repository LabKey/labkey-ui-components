/**
 * Returns value if it is not undefined, or defaultValue.
 * @param value
 * @param defaultValue
 */
import { Filter } from '@labkey/api';

import { QuerySort } from '..';
import { ActionValue } from '../components/omnibox/actions/Action';

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

    const aStr = a.map(filterToString).sort().join(';');
    const bStr = b.map(filterToString).sort().join(';');

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
        .sort()
        .join(';');
    const bStr = b
        .map(qs => qs.toRequestString())
        .sort()
        .join(';');
    return aStr === bStr;
}

export function flattenValuesFromRow(row: any, keys: string[]): { [key: string]: any } {
    let values = {};
    if (row && keys) {
        keys.forEach((key: string) => {
            if (row[key]) {
                values[key] = row[key].value;
            }
        });
    }
    return values;
}

export function actionValuesToString(actionValues: ActionValue[]): string {
    return actionValues
        .map(actionValue => actionValue.value.toString())
        .sort()
        .join(';');
}

export function offsetFromString(rowsPerPage: number, pageStr: string): number {
    if (pageStr === undefined) {
        return undefined;
    }

    let offset = 0;
    const page = parseInt(pageStr, 10);

    if (!isNaN(page)) {
        offset = (page - 1) * rowsPerPage;
    }

    return offset >= 0 ? offset : 0;
}

export function querySortFromString(sortStr: string): QuerySort {
    if (sortStr.startsWith('-')) {
        return new QuerySort({ dir: '-', fieldKey: sortStr.slice(1) });
    } else {
        return new QuerySort({ fieldKey: sortStr });
    }
}

export function querySortsFromString(sortsStr: string): QuerySort[] {
    return sortsStr?.split(',').map(querySortFromString);
}

export function searchFiltersFromString(searchStr: string): Filter.IFilter[] {
    return searchStr?.split(';').map(search => Filter.create('*', search, Filter.Types.Q));
}
