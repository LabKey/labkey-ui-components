/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useMemo } from 'react';
import { Filter } from '@labkey/api';

import { getContainerFilter } from '../../../internal/query/api';
import { DEFAULT_MAX_COUNT, QueryModel } from '../QueryModel';

import { ColumnFacetsRequest } from './models';

/**
 * Which of the grid's filters the server should read over. They differ by caller, and the choice decides both what
 * the answer describes and whether two callers share a cache entry on the server.
 *
 * - `base` leaves the view's filters out, so suggestions can reach past them. The user edits them like their own.
 * - `model` includes them, matching GridPanel.getSelectDistinctOptions, so an answer describes the rows on screen.
 */
export type GridFilterScope = 'base' | 'model';

export function getGridShapeRequest(model: QueryModel, scope: GridFilterScope): ColumnFacetsRequest {
    const filters: Filter.IFilter[] = scope === 'model' ? model.modelFilters : model.baseFilters;
    return {
        columns: model.displayColumns?.map(column => column.fieldKey) ?? [],
        // Same default as the grid's own rows request
        containerFilter: model.containerFilter ?? getContainerFilter(model.containerPath),
        containerPath: model.containerPath,
        filters,
        parameters: model.queryParameters,
        queryName: model.queryName,
        schemaName: model.schemaName,
        viewName: model.viewName,
    };
}

/**
 * The request, rebuilt only when the grid's shape changes rather than on every model update.
 *
 * `modelFilters` is deliberately absent from the dependencies even for the `model` scope: it is a getter that builds
 * a new array on every access, so depending on it would rebuild the request every render. The view filters it adds
 * over `baseFilters` derive from `queryInfo` and `viewName`, both of which are listed.
 */
export function useGridShapeRequest(model: QueryModel, scope: GridFilterScope): ColumnFacetsRequest {
    return useMemo(
        () => (model?.queryInfo ? getGridShapeRequest(model, scope) : undefined),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the grid's shape, not every model update
        [
            scope,
            model?.schemaName,
            model?.queryName,
            model?.viewName,
            model?.containerPath,
            model?.containerFilter,
            model?.baseFilters,
            // keyValue is listed because getModelFilters short-circuits to the key's own filters when it is set
            model?.keyValue,
            model?.queryParameters,
            model?.queryInfo,
            model?.omittedColumns,
        ]
    );
}

/**
 * Whether listing a column's values on this grid is likely to be expensive, judged by row count alone. Used only as
 * a fallback, when a column's own cached facts can't answer.
 *
 * Either count passing the threshold is enough, because each covers what the other misses. The grid's own count is
 * known the moment the dialog opens but is narrowed by every filter, so it can't see a large table filtered below
 * the cap. The server's answer covers the whole table but arrives a round trip later, and is absent entirely
 * for a query with no table of its own.
 */
export function isLargeGrid(model: QueryModel, largeTable?: boolean): boolean {
    if (largeTable) return true;
    const cap = model.maxCount > 0 ? model.maxCount : DEFAULT_MAX_COUNT;
    return model.includeTotalCount && !model.isLoadingTotalCount && model.rowCount >= cap;
}
