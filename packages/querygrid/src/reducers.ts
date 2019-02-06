/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { getGlobal, setGlobal } from 'reactn'
import { List, Map } from 'immutable'

import { SchemaQuery } from './query/model'
import { resolveSchemaQuery } from './query/utils'
import { QueryGridModel } from './model'

/**
 * Initialize the global state object for this package.
 */
export function initQueryGridState() {
    if (!getGlobal().QueryGrid) {
        setGlobal({
            QueryGrid: {
                metadata: Map<string, any>(),
                models: Map<string, QueryGridModel>()
            }
        });
    }
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

function getGlobalState() {
    if (!getGlobal().QueryGrid) {
        throw new Error('Must call initQueryGridState before you can access anything from the global.QueryGrid object.');
    }

    return getGlobal().QueryGrid;
}