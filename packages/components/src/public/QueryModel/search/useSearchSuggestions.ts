/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

import { ComponentsAPIWrapper } from '../../../internal/APIWrapper';
import { QueryModel } from '../QueryModel';

import { FilterSuggestion, FilterSuggestionsRequest } from './models';
import { applyColumnCaption, createSearchSuggestion, getColumnCaptions } from './utils';

export const SUGGESTION_DEBOUNCE_MS = 200;

export interface UseSearchSuggestions {
    complete: boolean;
    // True from the first keystroke until suggestions for the current term arrive, including the debounce window
    loading: boolean;
    suggestions: FilterSuggestion[];
}

interface SettledSuggestions {
    complete: boolean;
    request: FilterSuggestionsRequest;
    suggestions: FilterSuggestion[];
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
    const [settled, setSettled] = useState<SettledSuggestions>({ complete: true, request: undefined, suggestions: [] });
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
            model.omittedColumns,
        ]
    );

    const captions = useMemo(
        () => getColumnCaptions(model.displayColumns),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [model.queryInfo, model.viewName, model.omittedColumns]
    );

    useEffect(() => {
        if (!enabled || !trimmed) return undefined;

        const id = ++requestId.current;
        const timer = setTimeout(async () => {
            let result: SettledSuggestions;
            try {
                const response = await api.query.getFilterSuggestions(request);
                result = { ...response, request };
            } catch {
                result = { complete: false, request, suggestions: [createSearchSuggestion(request.term)] };
            }
            if (id === requestId.current) setSettled(result);
        }, SUGGESTION_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [api, enabled, request, trimmed]);

    return useMemo(() => {
        if (!trimmed) return { complete: true, loading: false, suggestions: [] };
        // Suggestions for the same term on a different view or column set name fields the grid may no longer show
        if (settled.request === request) {
            const suggestions = settled.suggestions.map(suggestion => applyColumnCaption(suggestion, captions));
            return { complete: settled.complete, loading: false, suggestions };
        }
        return { complete: false, loading: true, suggestions: [createSearchSuggestion(trimmed)] };
    }, [captions, request, settled, trimmed]);
}
