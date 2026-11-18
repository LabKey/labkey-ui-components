/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

import { ComponentsAPIWrapper } from '../../../internal/APIWrapper';
import { DEFAULT_MAX_COUNT, QueryModel } from '../QueryModel';

import { QuerySizeRequest } from './models';

const SIZE_WAIT_MS = 2000;

export interface UseQuerySize {
    // The table behind the query is too big to list values from speculatively. Undefined until the answer arrives.
    largeTable?: boolean;
    loading: boolean;
}

export function useQuerySize(api: ComponentsAPIWrapper, request: QuerySizeRequest): UseQuerySize {
    const [settled, setSettled] = useState<UseQuerySize & { request: QuerySizeRequest }>({
        largeTable: undefined,
        loading: false,
        request: undefined,
    });
    const requestId = useRef(0);
    // The request whose answer took too long to wait on, so the grid's own row count has to stand in for it. The
    // request itself, not a flag: a flag set for one request is still set on the first render of the next one.
    const [givenUpFor, setGivenUpFor] = useState<QuerySizeRequest>(undefined);

    useEffect(() => {
        if (!request?.queryName) return undefined;

        const id = ++requestId.current;
        let cancelled = false;

        const waited = setTimeout(() => {
            if (!cancelled) setGivenUpFor(request);
        }, SIZE_WAIT_MS);

        const load = async (): Promise<void> => {
            let largeTable: boolean;
            try {
                largeTable = (await api.query.getQuerySize(request)).largeTable;
            } catch {
                // An answer for an earlier request describes a different grid, so a failure settles on nothing
                // rather than being stamped with this one. It is not retried.
                largeTable = undefined;
            }
            // An answer ends the wait, so the timer must not outlive it and give up on whatever comes next
            clearTimeout(waited);
            if (cancelled || id !== requestId.current) return;

            setSettled({ largeTable, loading: false, request });
        };

        load();

        return () => {
            cancelled = true;
            clearTimeout(waited);
        };
    }, [api, request]);

    return useMemo(() => {
        // Nothing to ask about, so nothing to wait for
        if (!request?.queryName) return { loading: false };
        // An answer about a different grid shape says nothing about this one
        if (settled.request !== request) return { loading: givenUpFor !== request };
        return { largeTable: settled.largeTable, loading: false };
    }, [givenUpFor, request, settled]);
}

/**
 * Whether listing a column's values on this grid is likely to be expensive, judged by row count alone.
 *
 * Either count passing the threshold is enough, because each covers what the other misses. The grid's own count is
 * known the moment the dialog opens but is narrowed by every filter, so it can't see a large table filtered below
 * the cap. The server's answer covers the whole table but arrives a round trip later.
 *
 * Deliberate: when the server has no estimate — a query with no provisioned table such as an assay run, an
 * unanalyzed table, a database it can't estimate, or a wait that was abandoned — this falls back to the grid's own
 * count alone and so reads as "not large". Those grids open on the value list and pay for the distinct query. That
 * is an accepted edge case, not an oversight: biasing the unknown case to "large" would push every column on a
 * whole class of grids onto the Filter tab to save a query that is usually cheap anyway.
 */
export function isLargeDataset(model: QueryModel, largeTable?: boolean): boolean {
    if (largeTable) return true;
    const cap = model.maxCount > 0 ? model.maxCount : DEFAULT_MAX_COUNT;
    return model.includeTotalCount && !model.isLoadingTotalCount && model.rowCount >= cap;
}
