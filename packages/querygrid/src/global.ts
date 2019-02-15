/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { getGlobal, setGlobal } from 'reactn'
import { List, Map } from 'immutable'
import { GRID_CHECKBOX_OPTIONS, QueryColumn, QueryGridModel, SchemaQuery, resolveSchemaQuery } from '@glass/models'

import { initBrowserHistoryState } from './util/global'
import { DataViewInfo, EditorModel, LookupStore } from './model'

/**
 * Initialize the global state object for this package.
 */
export function initQueryGridState() {
    if (!getGlobal().QueryGrid) {
        setGlobal({
            QueryGrid: {
                charts: Map<string, List<DataViewInfo>>(),
                editors: Map<string, EditorModel>(),
                lookups: Map<string, LookupStore>(),
                metadata: Map<string, any>(),
                models: Map<string, QueryGridModel>()
            }
        });
    }
    initBrowserHistoryState();
}

function getGlobalState() {
    if (!getGlobal().QueryGrid) {
        throw new Error('Must call initQueryGridState before you can access anything from the global.QueryGrid object.');
    }

    return getGlobal().QueryGrid;
}

/**
 * Get the latest QueryGridModel object from the global state for a given modelId.
 * @param modelId QueryGridModel id to fetch
 * @param failIfNotFound Boolean indicating if an error should be thrown if the model is not found in global state
 */
export function getQueryGridModel(modelId: string, failIfNotFound: boolean = false): QueryGridModel {
    const model = getGlobalState().models.get(modelId);
    if (failIfNotFound && !model) {
        throw new Error('Unable to find QueryGridModel for modelId: ' + modelId);
    }

    return model;
}

export function getQueryGridModelsForSchema(schemaName: string): List<QueryGridModel> {
    return getGlobalState().models.filter(model => model.schema.toLowerCase() === schemaName.toLowerCase());
}

export function getQueryGridModelsForSchemaQuery(schemaQuery: SchemaQuery): List<QueryGridModel> {
    const modelName = resolveSchemaQuery(schemaQuery);
    return getGlobalState().models.filter(model => model.getModelName() === modelName);
}

/**
 * Helper function for all callers/actions that would like to update information for a QueryGridModel in the global state.
 * @param model QueryGridModel in the global state to be updated, or to be added to global state if it does not already exist by Id
 * @param updates JS Object with the key/value pairs for updates to make to the model
 * @param failIfNotFound Boolean indicating if an error should be thrown if the model is not found in global state
 */
export function updateQueryGridModel(model: QueryGridModel, updates: any, failIfNotFound: boolean = true): QueryGridModel {
    if (failIfNotFound && !getGlobalState().models.has(model.getId())) {
        throw new Error('Unable to find QueryGridModel for modelId: ' + model.getId());
    }

    const updatedModel = model.merge(updates) as QueryGridModel;

    setGlobal({
        QueryGrid: {
            ...getGlobalState(),
            models: getGlobalState().models.set(model.getId(), updatedModel)
        }
    });

    return updatedModel;
}

/**
 * Remove a QueryGridModel from the global state
 * @param model QueryGridModel to be removed
 */
export function removeQueryGridModel(model: QueryGridModel) {
    setGlobal({
        QueryGrid: {
            ...getGlobalState(),
            models: getGlobalState().models.delete(model.getId())
        }
    });
}

/**
 * Get the query metadata object from the global QueryGrid state
 */
export function getQueryMetadata() {
    return getGlobalState().metadata;
}

/**
 * Sets the query metadata object to be used for this application in the global QueryGrid state
 * @param metadata Map of query metadata to be applied to the query infos and column infos
 */
export function setQueryMetadata(metadata: Map<string, any>) {
    setGlobal({
        QueryGrid: {
            ...getGlobalState(),
            metadata
        }
    });
}

/**
 * Get the list of DataViewInfos from the global state for a given schemaQuery key
 * @param schemaQueryKey Key for the charts map based on a schemaQuery
 */
export function getCharts(schemaQueryKey: string) {
    return getGlobalState().charts.get(schemaQueryKey);
}

/**
 * Sets the global state list of chart DataViewInfos for a given schemaQuery key
 * @param schemaQueryKey Key for the charts map based on a schemaQuery
 * @param dataViewInfos List of DataViewInfo objects defining the charts for the given key
 */
export function updateCharts(schemaQueryKey: string, dataViewInfos: List<DataViewInfo>) {
    setGlobal({
        QueryGrid: {
            ...getGlobalState(),
            charts: getGlobalState().charts.set(schemaQueryKey, dataViewInfos)
        }
    });
}

function getSelectedState(
    dataIds: List<string>,
    selected: List<string>,
    maxRows: number,
    totalRows: number
): GRID_CHECKBOX_OPTIONS {

    const selectedOnPage: number = dataIds.filter((id) => selected.indexOf(id) !== -1).size,
        totalSelected: number = selected.size;

    if (
        maxRows === selectedOnPage ||
        totalRows === totalSelected && totalRows !== 0 ||
        selectedOnPage === dataIds.size && selectedOnPage > 0
    ) {
        return GRID_CHECKBOX_OPTIONS.ALL;
    }
    else if (totalSelected > 0) {
        // if model has any selected show checkbox as indeterminate
        return GRID_CHECKBOX_OPTIONS.SOME;
    }

    return GRID_CHECKBOX_OPTIONS.NONE;
}

interface IGridSelectionResponse {
    selectedIds: List<any>
}

/**
 * Update model data with select changes
 * @param model
 * @param response
 */
export function updateSelections(model: QueryGridModel, response: IGridSelectionResponse)  {
    const selectedIds = response.selectedIds;
    const id = model.getId(),
        selectedLoaded: any = true;

    if (selectedIds !== undefined && selectedIds.size) {
        const { dataIds, maxRows, totalRows } = model;
        const selectedState = getSelectedState(dataIds, selectedIds, maxRows, totalRows);
        const updatedState = {
            selectedIds,
            selectedLoaded,
            selectedQuantity: selectedIds.size,
            selectedState
        } as any;

        setGlobal({
            QueryGrid: {
                ...getGlobalState(),
                models: getGlobalState().models.set(model.getId(), model.merge(updatedState))
            }
        });
    }
    else {
        setGlobal({
            QueryGrid: {
                ...getGlobalState(),
                models: getGlobalState().models.set(id, model.merge({selectedLoaded}))
            }
        });
    }
}

/**
 * Get the latest EditorModel object from the global state for a given modelId.
 * @param modelId QueryGridModel id to fetch
 * @param failIfNotFound Boolean indicating if an error should be thrown if the model is not found in global state
 */
export function getEditorModel(modelId: string, failIfNotFound: boolean = false): EditorModel {
    const model = getGlobalState().editors.get(modelId);
    if (failIfNotFound && !model) {
        throw new Error('Unable to find QueryGridModel for modelId: ' + modelId);
    }

    return model;
}

/**
 * Helper function for all callers/actions that would like to update information for an EditorModel in the global state.
 * @param model EditorModel in the global state to be updated, or to be added to global state if it does not already exist by Id
 * @param updates JS Object with the key/value pairs for updates to make to the model
 * @param failIfNotFound Boolean indicating if an error should be thrown if the model is not found in global state
 */
export function updateEditorModel(model: EditorModel, updates: any, failIfNotFound: boolean = true): EditorModel {
    if (failIfNotFound && !getGlobalState().editors.has(model.id)) {
        throw new Error('Unable to find EditorModel for modelId: ' + model.id);
    }

    const updatedModel = model.merge(updates) as EditorModel;

    setGlobal({
        QueryGrid: {
            ...getGlobalState(),
            editors: getGlobalState().editors.set(model.id, updatedModel)
        }
    });

    return updatedModel;
}

/**
 * Get the latest LookupStore object from the global state for a given QueryColumn.
 * @param col QueryColumn to fetch
 * @param failIfNotFound Boolean indicating if an error should be thrown if the store is not found in global state
 */
export function getLookupStore(col: QueryColumn, failIfNotFound: boolean = false): LookupStore {
    const key = LookupStore.key(col);
    const store = getGlobalState().lookups.get(key);
    if (failIfNotFound && !store) {
        throw new Error('Unable to find LookupStore for col: ' + key);
    }

    return store;
}

/**
 * Helper function for all callers/actions that would like to update information for a LookupStore in the global state.
 * @param store LookupStore in the global state to be updated, or to be added to global state if it does not already exist by col key
 * @param updates JS Object with the key/value pairs for updates to make to the store
 * @param failIfNotFound Boolean indicating if an error should be thrown if the store is not found in global state
 */
export function updateLookupStore(store: LookupStore, updates: any, failIfNotFound: boolean = true): LookupStore {
    if (failIfNotFound && !getGlobalState().lookups.has(store.key)) {
        throw new Error('Unable to find LookupStore for col: ' + store.key);
    }

    const updatedStore = store.merge(updates) as LookupStore;

    setGlobal({
        QueryGrid: {
            ...getGlobalState(),
            lookups: getGlobalState().lookups.set(store.key, updatedStore)
        }
    });

    return updatedStore;
}