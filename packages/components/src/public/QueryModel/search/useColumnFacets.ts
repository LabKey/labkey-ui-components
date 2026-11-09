/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

import { ComponentsAPIWrapper } from '../../../internal/APIWrapper';
import { ColumnFacet, ColumnFacetsRequest } from './models';

/**
 * Waits between polls while the server reports facts still loading, each counted from the previous response.
 *
 * Shorter than the search box's schedule, and deliberately so: the dialog holds a spinner while these run, and once
 * the facts look slow, waiting longer for them only delays the ordinary query that will be needed anyway.
 */
const FACTS_POLL_DELAYS_MS = [500, 1500, 3000];

// Keyed by lower-cased fieldKey AND gridFieldKey: a lookup is filtered on its display column, so the two differ
// and the caller may hold either
export type ColumnFacets = Record<string, ColumnFacet>;

export interface UseColumnFacets {
    facets: ColumnFacets;
    // The table behind the query is too big to list values from speculatively. False until the first answer.
    largeTable?: boolean;
    // No answer has come back yet. The first one always carries largeTable, whatever the facts cost, so a caller
    // deciding by table size waits only this long rather than for the facts themselves.
    loading: boolean;
    // More facts may still arrive. False once the server reports them finished, once polling gives up, or on failure,
    // so a caller waiting on them is never left waiting forever.
    pending: boolean;
}

export function useColumnFacets(api: ComponentsAPIWrapper, request: ColumnFacetsRequest): UseColumnFacets {
    const [settled, setSettled] = useState<UseColumnFacets & { request: ColumnFacetsRequest }>({
        largeTable: false,
        facets: {},
        loading: false,
        pending: true,
        request: undefined,
    });
    const requestId = useRef(0);

    useEffect(() => {
        if (!request?.queryName) return undefined;

        const id = ++requestId.current;
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;

        const load = async (attempt: number): Promise<void> => {
            let complete = false;
            let facets: ColumnFacets = {};
            let largeTable = false;
            try {
                const response = await api.query.getColumnFacets(request);
                complete = response.complete;
                largeTable = response.largeTable;
                facets = response.columns.reduce<ColumnFacets>((result, column) => {
                    result[column.gridFieldKey.toLowerCase()] = column;
                    // An alias only fills a free slot: another column's gridFieldKey must not be overwritten
                    result[column.fieldKey.toLowerCase()] ??= column;
                    return result;
                }, {});
            } catch {
                // Keep whatever earlier polls delivered for this same request; discarding it would send the caller
                // back to querying for columns already answered. Facts for an earlier request describe a different
                // grid, so they are dropped rather than stamped with this one. A failure is not retried.
                if (!cancelled && id === requestId.current)
                    setSettled(previous =>
                        previous.request === request
                            ? { ...previous, loading: false, pending: false }
                            : { facets: {}, largeTable: undefined, loading: false, pending: false, request }
                    );
                return;
            }
            if (cancelled || id !== requestId.current) return;

            // A large table's missing facts are scans that won't land inside this schedule, and the tab was decided
            // by the answer already in hand, so waiting for them only delays the query the user will need anyway
            const polling = !cancelled && !complete && !largeTable && attempt < FACTS_POLL_DELAYS_MS.length;
            setSettled({ facets, largeTable, loading: false, pending: polling, request });
            if (polling) timer = setTimeout(() => load(attempt + 1), FACTS_POLL_DELAYS_MS[attempt]);
        };

        load(0);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [api, request]);

    return useMemo(() => {
        // Nothing to ask for, so nothing to wait for
        if (!request?.queryName) return { facets: {}, loading: false, pending: false };
        // Facts for a different grid shape name columns this one may not show
        if (settled.request !== request) return { facets: {}, loading: true, pending: true };
        return { facets: settled.facets, largeTable: settled.largeTable, loading: false, pending: settled.pending };
    }, [request, settled]);
}
