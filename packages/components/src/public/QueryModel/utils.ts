/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
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

import { SchemaQuery, SELECTION_SNAPSHOT_SEP } from '../SchemaQuery';
import { getSelectedRows } from '../../internal/query/selectRows';
import { caseInsensitive } from '../../internal/util/utils';

import { ActionValue } from './grid/actions/Action';
import {
    getSettingsFromLocalStorage, InjectedQueryModels,
    locationHasQueryParamSettings,
    QueryModel,
    QueryModelMap,
    SavedSettings, saveSettingsToLocalStorage
} from './QueryModel';
import { Draft, produce } from 'immer';
import { RequestHandler } from '../../internal/request';
import { ComponentType, PureComponent } from 'react';
import { SearchParamsProps } from './withQueryModels';
import { LoadingState } from '../LoadingState';
import { naturalSort } from '../sort';
import { SetURLSearchParams } from 'react-router-dom';
import { getQueryParams } from '../../internal/util/URL';

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

export function filterArrayToString(filterArray: Filter.IFilter[]): string {
    if (!filterArray) {
        return '';
    }
    return filterArray.map(filterToString).sort().join(';');
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

export function createSnapshotSelectionKeyStr(selectionKey: string) {
    return selectionKey + SELECTION_SNAPSHOT_SEP + Utils.generateUUID();
}

// Do not use this directly, use createSnapshotSelectionKey or createOrderedSnapshotSelectionKey below
async function _createSnapshotSelectionKey(model: QueryModel, selections: string[]): Promise<string> {
    const key = createSnapshotSelectionKeyStr(model.selectionKey);
    await setSelected(key, true, selections, model.selectionContainerPath, false, model.schemaName, model.queryName);
    return key;
}

/**
 * Creates a new selection key with the current selections for a given model. Use this when calling an API that takes
 * a selectionKey in order to prevent taking action on values that have been filtered out of the view (See Issue 52393
 * as an example) . Using this method is not compatible with the useSnapshotSelections param supported by some of our
 * APIs. If you use this do not set the useSnapshotSelections flag in your API call.
 * @param model the QueryModel used to create a snapshot selection key
 * @param selections an array of rowIds to select,
 */
export function createSnapshotSelectionKey(model: QueryModel, selections?: string[]): Promise<string> {
    return _createSnapshotSelectionKey(model, selections ?? Array.from(model.selections));
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
        offset: 0,
        maxRows: -1,
        selections: model.selections,
    });
    const orderedRows = rows.map(row => caseInsensitive(row, pkFieldKey).value.toString());
    return _createSnapshotSelectionKey(model, orderedRows);
}

// N.B. This is similar to useRequestHandler() but we cannot use hooks in withQueryModels or QueryModelManager, so we
// have to use class variables instead. Additionally, we cannot make use of React.createRef() since that returns an
// immutable reference unlike React.useRef() which is mutable.
// Exported for unit tests
export class RequestManager {
    _requests: Record<string, Record<string, undefined | XMLHttpRequest>> = {};

    public cancelAllRequests = (): void => {
        Object.values(this._requests).forEach(allReq => {
            Object.values(allReq).forEach(req => {
                req?.abort();
            });
        });
        this._requests = {};
    };

    public getRequestHandler(id: string, requestType: string): RequestHandler {
        return request => {
            const bucket = this._requests[id] || (this._requests[id] = {});

            // Abort in-flight request
            bucket[requestType]?.abort();

            // If the bucket was detached during the abort() call,
            // then re-attach it before assigning the new request.
            if (this._requests[id] !== bucket) {
                this._requests[id] = bucket;
            }

            bucket[requestType] = request;

            // Remove the request once the request has completed
            request.addEventListener(
                'loadend',
                () => {
                    const bucket_ = this._requests[id];
                    if (bucket_?.[requestType] === request) {
                        delete bucket_[requestType];

                        if (Object.keys(bucket_).length === 0) {
                            delete this._requests[id];
                        }
                    }
                },
                { once: true }
            );
        };
    }
}

export function applySavedSettings(id: string, model: QueryModel): QueryModel {
    const settings = getSettingsFromLocalStorage(id, model.containerPath);
    if (settings !== undefined) {
        const { filterArray, maxRows, sorts, viewName } = settings;
        const mutations: Partial<Draft<QueryModel>> = { maxRows, sorts };

        if (model.useSavedSettings === SavedSettings.all) {
            mutations.filterArray = filterArray;

            if (viewName !== undefined) {
                mutations.schemaQuery = new SchemaQuery(model.schemaName, model.queryName, viewName);
            }
        }

        const modelWithSavedSettings = model.mutate(mutations as Partial<QueryModel>);

        if (model.useSavedSettings === SavedSettings.noFilters) {
            // If we're retrieving saved settings, but ignoring filters, we need to resave the settings without the
            // filters or app behavior will be confusing. For example: you create a sample, and are navigated to a grid
            // with no filters, then you edit a sample on that grid. When you navigate back, after editing, the filter
            // that was removed after creation is now back.
            saveSettingsToLocalStorage(modelWithSavedSettings);
        }

        return modelWithSavedSettings;
    }
    return model;
}

export function initModels(queryConfigs, searchParams): QueryModelMap {
    return Object.keys(queryConfigs).reduce((models, id) => {
        // We expect the key value for each QueryConfig to be the id. If a user were to mistakenly set the id
        // to something different on the QueryConfig then actions would break
        // e.g. actions.loadNextPage(model.id) would not work.
        let model = new QueryModel({ id, ...queryConfigs[id] });
        const hasQueryParamSettings = locationHasQueryParamSettings(model.urlPrefix, searchParams);

        if (model.bindURL && hasQueryParamSettings) {
            model = model.mutate(model.attributesForURLQueryParams(searchParams, true));
        } else if (model.useSavedSettings !== SavedSettings.none) {
            if (!model.containerPath) {
                console.error('A model.containerPath is required when useSavedSettings is true: ' + model.id);
            } else {
                model = applySavedSettings(model.id, model);
            }
        }

        models[id] = model;
        return models;
    }, {});
}

function columnHasFilter(fieldKey: string, filters: Filter.IFilter[]): boolean {
    fieldKey = fieldKey.toLowerCase();
    return filters.some(filter => filter.getColumnName().toLowerCase() === fieldKey);
}

export function columnsHaveFilter(columnFieldKeys: string[], filters: Filter.IFilter[]): boolean {
    return columnFieldKeys.some(fieldKey => columnHasFilter(fieldKey, filters));
}

/**
 * Resets queryInfo state to initialized state. Use this when you need to load/reload QueryInfo.
 * Note: This method intentionally has side effects, it is only to be used inside of an Immer produce() callback.
 * @param model The model to reset queryInfo state on.
 */
export function resetQueryInfoState(model: Draft<QueryModel>): void {
    model.queryInfo = undefined;
    model.queryInfoError = undefined;
    model.queryInfoLoadingState = LoadingState.INITIALIZED;
}

/**
 * Resets totalCount state to initialized state. Use this when you need to load/reload QueryInfo.
 * Note: This method intentionally has side effects, it is only to be used inside of an Immer produce() callback.
 * @param model The model to reset queryInfo state on.
 */
export function resetTotalCountState(model: Draft<QueryModel>): void {
    model.rowCount = undefined;
    model.totalCountError = undefined;
    model.totalCountLoadingState = LoadingState.INITIALIZED;
}

/**
 * Resets rows state to initialized state. Use this when you need to load/reload selections.
 * Note: This method intentionally has side effects, it is only to be used inside of an Immer produce() callback.
 * @param model The model to reset selection state on.
 */
export function resetRowsState(model: Draft<QueryModel>): void {
    model.messages = undefined;
    model.offset = 0;
    model.orderedRows = undefined;
    model.viewError = undefined;
    model.rowsError = undefined;
    model.rows = undefined;
    model.rowCount = undefined;
    model.rowsLoadingState = LoadingState.INITIALIZED;
}

/**
 * Resets selection state to initialized state. Use this when you need to load/reload selections.
 * Note: This method intentionally has side effects, it is only to be used inside of an Immer produce() callback.
 * @param model The model to reset selection state on.
 */
export function resetSelectionState(model: Draft<QueryModel>): void {
    model.selections = undefined;
    model.selectionsError = undefined;
    model.selectionsLoadingState = LoadingState.INITIALIZED;
    model.selectionPivot = undefined;
}

/**
 * Resets the model to the first page, resets the selection state, and resets the total count state.
 * @param model The model to reset
 */
export function resetModelState(model: Draft<QueryModel>): void {
    resetRowsState(model);
    resetSelectionState(model);
    resetTotalCountState(model);
}

/**
 * Compares two query params objects, returns true if they are equal, false otherwise.
 * @param oldParams
 * @param newParams
 */
export function paramsEqual(oldParams, newParams): boolean {
    const keys = Object.keys(oldParams);
    const oldKeyStr = keys.sort(naturalSort).join(';');
    const newKeyStr = Object.keys(newParams).sort(naturalSort).join(';');

    if (oldKeyStr === newKeyStr) {
        // If the keys are the same we need to do a deep comparison
        for (const key of Object.keys(oldParams)) {
            if (oldParams[key] !== newParams[key]) {
                return false;
            }
        }

        return true;
    }

    // If the keys have changed we can assume the params are different.
    return false;
}

export function bindURL(setSearchParams: SetURLSearchParams, prefix: string, params: Record<string, string>) {
    setSearchParams(
        currentParams => {
            const queryParams = getQueryParams(currentParams);
            return Object.keys(queryParams).reduce(
                (result, key) => {
                    // Only copy params that aren't related to the current model, we initialize the result with the
                    // updated params below.
                    if (!key.startsWith(prefix + '.')) {
                        result[key] = queryParams[key];
                    }
                    return result;
                },
                // QueryModel.urlQueryParams returns Record<string, string>, but getQueryParams and setSearchParams
                // use Record<string, string | string[]>
                params as Record<string, string | string[]>
            );
        },
        { replace: true }
    );
}
