/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

import { ComponentsAPIWrapper } from '../../../internal/APIWrapper';
import { ColumnFacet, ColumnFacetsRequest } from './models';

// Keyed by lower-cased fieldKey AND gridFieldKey: a lookup is filtered on its display column, so the two differ
// and the caller may hold either
export type ColumnFacets = Record<string, ColumnFacet>;

export interface UseColumnFacets {
    facets: ColumnFacets;
    // The table behind the query is too big to list values from speculatively. False until the answer arrives.
    largeTable?: boolean;
    loading: boolean;
}

export function useColumnFacets(api: ComponentsAPIWrapper, request: ColumnFacetsRequest): UseColumnFacets {
    const [settled, setSettled] = useState<UseColumnFacets & { request: ColumnFacetsRequest }>({
        largeTable: false,
        facets: {},
        loading: false,
        request: undefined,
    });
    const requestId = useRef(0);

    useEffect(() => {
        if (!request?.queryName) return undefined;

        const id = ++requestId.current;
        let cancelled = false;

        const load = async (): Promise<void> => {
            let facets: ColumnFacets = {};
            let largeTable = false;
            try {
                const response = await api.query.getColumnFacets(request);
                largeTable = response.largeTable;
                facets = response.columns.reduce<ColumnFacets>((result, column) => {
                    result[column.gridFieldKey.toLowerCase()] = column;
                    // An alias only fills a free slot: another column's gridFieldKey must not be overwritten
                    result[column.fieldKey.toLowerCase()] ??= column;
                    return result;
                }, {});
            } catch {
                // Facts for an earlier request describe a different grid, so they are dropped rather than stamped
                // with this one. A failure is not retried.
                if (!cancelled && id === requestId.current)
                    setSettled({ facets: {}, largeTable: undefined, loading: false, request });
                return;
            }
            if (cancelled || id !== requestId.current) return;

            setSettled({ facets, largeTable, loading: false, request });
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [api, request]);

    return useMemo(() => {
        // Nothing to ask for, so nothing to wait for
        if (!request?.queryName) return { facets: {}, loading: false };
        // Facts for a different grid shape name columns this one may not show
        if (settled.request !== request) return { facets: {}, loading: true };
        return { facets: settled.facets, largeTable: settled.largeTable, loading: false };
    }, [request, settled]);
}
