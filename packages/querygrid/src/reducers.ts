/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map } from 'immutable'

import { QueryGridModel } from './model'
import {SchemaQuery} from "./query/model";
import {resolveSchemaQuery} from "./query/utils";

/**
 * Initialize the global state object for this package.
 * @param state Component which has the global state object access
 */
export function initQueryGridState(state: any) {
    if (!state.global.QueryGrid) {
        state.setGlobal({
            QueryGrid: {
                metadata: Map<string, any>(), // TODO switch to using this and allowing it to be passed in to init
                models: Map<string, QueryGridModel>()
            }
        });
    }
}

/**
 * Get the latest QueryGridModel object from the global state for a given modelId.
 * @param state Component which has the global state object access
 * @param modelId QueryGridModel id to fetch
 */
export function getQueryGridModel(state: any, modelId: string, failIfNotFound: boolean = false): QueryGridModel {
    const model = getGlobalState(state).models.get(modelId);
    if (failIfNotFound && !model) {
        throw new Error('Unable to find QueryGridModel for modelId: ' + modelId);
    }

    return model;
}

export function getQueryGridModelsForSchema(state: any, schemaName: string): List<QueryGridModel> {
    return getGlobalState(state).models.filter(model => model.schema.toLowerCase() === schemaName.toLowerCase());
}

export function getQueryGridModelsForSchemaQuery(state: any, schemaQuery: SchemaQuery): List<QueryGridModel> {
    const modelName = resolveSchemaQuery(schemaQuery);
    return getGlobalState(state).models.filter(model => model.getModelName() === modelName);
}

/**
 * Helper function for all callers/actions that would like to update information for a QueryGridModel in the global state.
 * @param state Component which has the global state object access
 * @param model QueryGridModel in the global state to be updated, or to be added to global state if it does not already exist by Id
 * @param updates JS Object with the key/value pairs for updates to make to the model
 * @param failIfNotFound Boolean indicating if an error should be thrown if the model is not found in global state
 */
export function updateQueryGridModel(state: any, model: QueryGridModel, updates: any, failIfNotFound: boolean = true): QueryGridModel {
    if (failIfNotFound && !getGlobalState(state).models.has(model.getId())) {
        throw new Error('Unable to find QueryGridModel for modelId: ' + model.getId());
    }

    const updatedModel = model.merge(updates) as QueryGridModel;

    state.setGlobal({
        QueryGrid: {
            models: getGlobalState(state).models.set(model.getId(), updatedModel)
        }
    });

    return updatedModel;
}

/**
 * Remove a QueryGridModel from the global state
 * @param state Component which has the global state object access
 * @param model QueryGridModel to be removed
 */
export function removeQueryGridModel(state: any, model: QueryGridModel) {
    state.setGlobal({
        QueryGrid: {
            models: getGlobalState(state).models.delete(model.getId())
        }
    });
}

function getGlobalState(state: any) {
    if (!state.global || !state.global.QueryGrid) {
        throw new Error('Must call initQueryGridState before you can access anything from the global.QueryGrid object.');
    }

    return state.global.QueryGrid;
}