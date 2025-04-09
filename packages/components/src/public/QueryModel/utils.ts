/**
 * Returns value if it is not undefined, or defaultValue.
 * @param value
 * @param defaultValue
 */
import { Filter, Utils } from '@labkey/api';

import { List } from 'immutable';

import { ExportOptions, getExportParams, setSelected } from '../../internal/actions';

import { QuerySort } from '../QuerySort';

import { QueryColumn } from '../QueryColumn';
import { EXPORT_TYPES } from '../../internal/constants';

import { SELECTION_SNAPSHOT_SEP } from '../SchemaQuery';
import { getSelectedRows } from '../../internal/query/selectRows';
import { caseInsensitive } from '../../internal/util/utils';

import { ActionValue } from './grid/actions/Action';
import { QueryModel } from './QueryModel';

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

    if (pkCols?.length > 0) {
        return pkCols[0].fieldKey;
    }

    const columns: string[] =
        typeof rawColumns === 'string' ? rawColumns.split(',').map(col => col.trim()) : rawColumns;

    return columns[0];
}

// Do not use this directly, use createSnapshotSelectionKey or createOrderedSnapshotSelectionKey below
async function _createSnapshotSelectionKey(model: QueryModel, selections: string[]): Promise<string> {
    const key = model.selectionKey + SELECTION_SNAPSHOT_SEP + Utils.generateUUID();
    await setSelected(key, true, selections, model.selectionContainerPath, false, model.schemaName, model.queryName);
    return key;
}

/**
 * Creates a new selection key with the current selections for a given model. Use this when calling an API that takes
 * a selectionKey in order to prevent taking action on values that have been filtered out of the view (See Issue 52393
 * as an example) . Using this method is not compatible with the useSnapshotSelections param supported by some of our
 * APIs. If you use this do not set the useSnapshotSelections flag in your API call.
 * @param model the QueryModel used to create a snapshot selection key
 */
export function createSnapshotSelectionKey(model: QueryModel): Promise<string> {
    return _createSnapshotSelectionKey(model, Array.from(model.selections));
}

/**
 * Creates a new selection key via the same mechanism as createSnapshotSelectionKey, but sorts the rows via the sorts
 * from the underlying QueryModel.
 * @param model
 */
export async function createOrderedSnapshotSelectionKey(model: QueryModel): Promise<string> {
    const pkFieldKey = model.keyColumns[0].fieldKey;
    const { rows } = await getSelectedRows({
        ...model.loadRowsConfig,
        // We only need the key column for this request
        columns: pkFieldKey,
        includeTotalCount: false,
        selections: model.selections,
    });
    const orderedRows = rows.map(row => caseInsensitive(row, pkFieldKey).value.toString());
    return _createSnapshotSelectionKey(model, orderedRows);
}
