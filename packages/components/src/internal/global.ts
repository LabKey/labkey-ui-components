/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS, Map } from 'immutable';

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
export function initQueryGridState(metadata?: Record<string, any>, columnRenderers?: Record<string, any>): void {
    if (metadata) {
        setQueryMetadata(fromJS(metadata));
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
