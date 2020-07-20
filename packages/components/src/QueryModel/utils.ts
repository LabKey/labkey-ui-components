/**
 * Returns value if it is not undefined, or defaultValue.
 * @param value
 * @param defaultValue
 */
import { Filter } from '@labkey/api';

import { QueryConfig, QuerySort } from '..';
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

// Produces a stable string representation of an object.
export function recordToString(record: Record<string, any>): string {
    return Object.keys(record)
        .sort()
        .map(key => `${key}=${record[key]}`)
        .join('_');
}

export function hashQueryConfig(config: QueryConfig): string {
    return [
        config.baseFilters?.map(filterToString).join('_'),
        config.containerFilter,
        config.containerPath,
        config.id,
        config.includeDetailsColumn,
        config.includeUpdateColumn,
        config.keyValue,
        config.omittedColumns?.join('_'),
        recordToString(config.queryParameters ?? {}),
        config.requiredColumns?.join('_'),
        config.schemaQuery.toString(),
        config.sorts?.map(sort => sort.toRequestString()).join('_'),
    ].join(';');
}

export function queryConfigsEqual(a: QueryConfig, b: QueryConfig): boolean {
    return hashQueryConfig(a) === hashQueryConfig(b);
}
