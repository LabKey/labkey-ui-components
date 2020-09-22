/**
 * Returns value if it is not undefined, or defaultValue.
 * @param value
 * @param defaultValue
 */
import { Filter } from '@labkey/api';

import { EXPORT_TYPES, QueryColumn, QueryModel, QuerySort } from '..';
import { ActionValue } from '../internal/components/omnibox/actions/Action';
import { List } from 'immutable';
import { ExportOptions, getExportParams } from '../internal/actions';

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

/**
 * Returns the columns needed to render an Assay Run Details Page. Adapted from components/assay/actions.ts
 * getRunDetailsQueryColumns
 * @param model: QueryModel
 * @param reRunSupport: string
 */
export function runDetailsColumnsForQueryModel(model: QueryModel, reRunSupport: string): QueryColumn[] {
    let columns = model.displayColumns;
    const includeRerunColumns = reRunSupport === 'ReRunAndReplace';
    const replacedByIndex = columns.findIndex(col => col.fieldKey === 'ReplacedByRun');

    if (replacedByIndex > -1) {
        if (includeRerunColumns) {
            // Direct manipulation by index is ok here because displayColumns returns a new array every time.
            columns[replacedByIndex] = columns[replacedByIndex].set('detailRenderer', 'assayrunreference') as QueryColumn;
        } else {
            columns = columns.filter((col, index): boolean => replacedByIndex !== index);
        }
    }

    if (includeRerunColumns) {
        const replaces = model.getColumn('ReplacesRun');

        if (replaces) {
            const column = replaces.set('detailRenderer', 'assayrunreference') as QueryColumn;

            if (replacedByIndex > -1) {
                columns = [...columns.slice(0, replacedByIndex + 1), column, ...columns.slice(replacedByIndex)];
            } else {
                columns.push(column);
            }
        }
    }

    return columns;
}

export function getQueryModelExportParams(model: QueryModel, type: EXPORT_TYPES, advancedOptions?: Record<string, any>): any {
    const {id, filters, hasSelections, schemaQuery, exportColumnString, sortString, selections} = model;
    const showRows = hasSelections && selections.size > 0 ? 'SELECTED' : 'ALL'
    const exportOptions: ExportOptions = {
        filters: List(filters),
        columns: exportColumnString,
        sorts: sortString,
        selectionKey: id,
        showRows,
    };
    return getExportParams(type, schemaQuery, exportOptions, advancedOptions);
}
