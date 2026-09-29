/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

import { ComponentsAPIWrapper } from '../../../internal/APIWrapper';
import { QueryModel } from '../QueryModel';

import { createSearchSuggestion } from './buildSuggestions';
import { FilterSuggestion, FilterSuggestionsRequest } from './models';

export const SUGGESTION_DEBOUNCE_MS = 200;

export interface UseSearchSuggestions {
    complete: boolean;
    // True from the first keystroke until suggestions for the current term arrive, including the debounce window
    loading: boolean;
    suggestions: FilterSuggestion[];
}

interface SettledSuggestions {
    complete: boolean;
    suggestions: FilterSuggestion[];
    term: string;
}

export function getFilterSuggestionsRequest(model: QueryModel, term: string): FilterSuggestionsRequest {
    return {
        columns: model.displayColumns?.map(column => column.fieldKey) ?? [],
        containerFilter: model.containerFilter,
        containerPath: model.containerPath,
        parameters: model.queryParameters,
        queryName: model.queryName,
        schemaName: model.schemaName,
        term,
        viewName: model.viewName,
    };
}

export function useSearchSuggestions(
    api: ComponentsAPIWrapper,
    model: QueryModel,
    term: string,
    enabled: boolean
): UseSearchSuggestions {
    const trimmed = term?.trim() ?? '';
    const [settled, setSettled] = useState<SettledSuggestions>({ complete: true, suggestions: [], term: '' });
    const requestId = useRef(0);
    // A new request is only warranted when the term or the grid's shape changes, not on every model update
    const request = useMemo(
        () => getFilterSuggestionsRequest(model, trimmed),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            trimmed,
            model.schemaName,
            model.queryName,
            model.viewName,
            model.containerPath,
            model.containerFilter,
            model.queryParameters,
            model.queryInfo,
        ]
    );

    useEffect(() => {
        if (!enabled || !trimmed) return undefined;

        const id = ++requestId.current;
        const timer = setTimeout(async () => {
            let result: SettledSuggestions;
            try {
                const response = await api.query.getFilterSuggestions(request);
                result = { ...response, term: request.term };
            } catch (e) {
                console.error('Unable to load search suggestions', e);
                result = { complete: false, suggestions: [createSearchSuggestion(request.term)], term: request.term };
            }
            if (id === requestId.current) setSettled(result);
        }, SUGGESTION_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [api, enabled, request, trimmed]);

    return useMemo(() => {
        if (!trimmed) return { complete: true, loading: false, suggestions: [] };
        if (settled.term === trimmed)
            return { complete: settled.complete, loading: false, suggestions: settled.suggestions };
        return { complete: false, loading: true, suggestions: [createSearchSuggestion(trimmed)] };
    }, [settled, trimmed]);
}
