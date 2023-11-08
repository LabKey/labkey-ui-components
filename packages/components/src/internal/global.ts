/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Map } from 'immutable';

// Don't touch this directly, if you need access to it use getQueryMetadata, if you need to set the value use
// setQueryMetadata
let _queryMetadata = Map<string, any>();

// Don't touch this directly, if you need access to it use getQueryColumnRenderers, if you need to set the value use
// setQueryColumnRenderers
let _queryColumnRenderers = {};

/**
 * Initialize the global state object for this package.
 * @param metadata Optional Map to set the query metadata for this application
 * @param columnRenderers Optional Map to set the column renderers for this application
 */
export function initQueryGridState(metadata?: Map<string, any>, columnRenderers?: Record<string, any>): void {
    if (metadata) {
        setQueryMetadata(metadata);
    }

    if (columnRenderers) {
        setQueryColumnRenderers(columnRenderers);
    }
}

/**
 * Get the query metadata object from the global state.
 */
export function getQueryMetadata(): Map<string, any> {
    return _queryMetadata;
}

/**
 * Sets the query metadata object to be used for this application in the global state.
 * @param metadata Map of query metadata to be applied to the query infos and column infos
 */
export function setQueryMetadata(metadata: Map<string, any>): void {
    _queryMetadata = metadata;
}

/**
 * Get the query grid column renderers from the global state.
 */
export function getQueryColumnRenderers(): Record<string, any> {
    return _queryColumnRenderers;
}

/**
 * Sets the valid column renderers for this application in the global state.
 * @param columnRenderers Query grid column renderers to be bound to the queryInfo columns
 */
export function setQueryColumnRenderers(columnRenderers: Record<string, any>): void {
    _queryColumnRenderers = columnRenderers;
}
