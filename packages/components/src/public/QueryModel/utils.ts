/**
 * Returns value if it is not undefined, or defaultValue.
 * @param value
 * @param defaultValue
 */
import { Filter } from '@labkey/api';

import { List } from 'immutable';

import { ExportOptions, getExportParams } from '../../internal/actions';

import { QuerySort } from '../QuerySort';

import { QueryColumn } from '../QueryColumn';
import { EXPORT_TYPES } from '../../internal/constants';

import { QueryModel } from './QueryModel';
import { ActionValue } from './grid/actions/Action';

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

export function actionValuesToString(actionValues: ActionValue[]): string {
    return actionValues
        .map(actionValue => actionValue.value.toString())
        .sort()
        .join(';');
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
            columns[replacedByIndex] = columns[replacedByIndex].mutate({ detailRenderer: 'assayrunreference' });
        } else {
            columns = columns.filter((col, index): boolean => replacedByIndex !== index);
        }
    }

    if (includeRerunColumns) {
        const replaces = model.getColumn('ReplacesRun');

        if (replaces) {
            const column = replaces.mutate({ detailRenderer: 'assayrunreference' });

            if (replacedByIndex > -1) {
                columns = [...columns.slice(0, replacedByIndex + 1), column, ...columns.slice(replacedByIndex)];
            } else {
                columns.push(column);
            }
        }
    }

    return columns;
}

export function getQueryModelExportParams(
    model: QueryModel,
    type: EXPORT_TYPES,
    advancedOptions?: Record<string, any>
): Record<string, any> {
    const {
        containerFilter,
        containerPath,
        exportColumnString,
        filters,
        hasSelections,
        schemaQuery,
        sortString,
        selectionKey,
        queryParameters,
    } = model;
    const exportOptions: ExportOptions = {
        filters: List(filters),
        columns: exportColumnString,
        containerFilter,
        containerPath,
        sorts: sortString,
        selectionKey,
        showRows: hasSelections ? 'SELECTED' : 'ALL',
    };
    return getExportParams(type, schemaQuery, exportOptions, advancedOptions, queryParameters);
}

export function getSelectRowCountColumnsStr(
    rawColumns?: string | string[],
    filterArray?: Filter.IFilter[],
    pkCols?: QueryColumn[]
): string | string[] {
    if (!rawColumns || rawColumns === '*') return rawColumns;

    if (filterArray?.length > 0) {
        const qFilter = filterArray.some(filter => filter.getColumnName() === '*');
        if (qFilter) return rawColumns;
    }

    if (pkCols?.length > 0)
        return pkCols[0].fieldKey;

    const columns: string[] =
        typeof rawColumns === 'string' ? rawColumns.split(',').map(col => col.trim()) : rawColumns;

    return columns[0];
}
