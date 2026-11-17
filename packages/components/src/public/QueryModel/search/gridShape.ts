/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useMemo } from 'react';
import { Filter } from '@labkey/api';

import { getContainerFilter } from '../../../internal/query/api';
import { DEFAULT_MAX_COUNT, QueryModel } from '../QueryModel';

import { GridShapeRequest } from './models';

/** The view's filters are left out, so suggestions can reach past them. The user edits them like their own. */
export function getGridShapeRequest(model: QueryModel): GridShapeRequest {
    return {
        columns: model.displayColumns?.map(column => column.fieldKey) ?? [],
        containerFilter: model.containerFilter ?? getContainerFilter(model.containerPath),
        containerPath: model.containerPath,
        filters: model.baseFilters,
        parameters: model.queryParameters,
        queryName: model.queryName,
        schemaName: model.schemaName,
        viewName: model.viewName,
    };
}

/** The request, rebuilt only when the grid's shape changes rather than on every model update. */
export function useGridShapeRequest(model: QueryModel): GridShapeRequest {
    return useMemo(
        () => (model.queryInfo ? getGridShapeRequest(model) : undefined),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the grid's shape, not every model update
        [
            model.schemaName,
            model.queryName,
            model.viewName,
            model.containerPath,
            model.containerFilter,
            model.baseFilters,
            model.queryParameters,
            model.queryInfo,
            model.omittedColumns,
        ]
    );
}

/**
 * Whether listing a column's values on this grid is likely to be expensive, judged by row count alone.
 *
 * Either count passing the threshold is enough, because each covers what the other misses. The grid's own count is
 * known the moment the dialog opens but is narrowed by every filter, so it can't see a large table filtered below
 * the cap. The server's answer covers the whole table but arrives a round trip later, and is absent entirely
 * for a query with no table of its own.
 */
export function isLargeDataset(model: QueryModel, largeTable?: boolean): boolean {
    if (largeTable) return true;
    const cap = model.maxCount > 0 ? model.maxCount : DEFAULT_MAX_COUNT;
    return model.includeTotalCount && !model.isLoadingTotalCount && model.rowCount >= cap;
}
