/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { useEffect, useMemo, useRef, useState } from 'react';

import { ComponentsAPIWrapper } from '../../../internal/APIWrapper';
import { getContainerFilter } from '../../../internal/query/api';
import { QueryModel } from '../QueryModel';

import { FilterSuggestion, FilterSuggestionsRequest } from './models';
import { applyColumnCaption, createSearchSuggestion, getColumnCaptions } from './utils';

export const SUGGESTION_DEBOUNCE_MS = 200;
// Waits between polls while the server reports facts still loading, each counted from the previous response
export const SUGGESTION_POLL_DELAYS_MS = [1000, 2000, 5000, 10000];

export interface UseSearchSuggestions {
    complete: boolean;
    // True from the first keystroke until suggestions for the current term arrive, including the debounce window
    loading: boolean;
    // True while another poll is scheduled or in flight
    polling: boolean;
    suggestions: FilterSuggestion[];
}

interface SettledSuggestions {
    complete: boolean;
    polling: boolean;
    request: FilterSuggestionsRequest;
    suggestions: FilterSuggestion[];
}

export function getFilterSuggestionsRequest(model: QueryModel, term: string): FilterSuggestionsRequest {
    return {
        columns: model.displayColumns?.map(column => column.fieldKey) ?? [],
        // Same default as the grid's own rows request
        containerFilter: model.containerFilter ?? getContainerFilter(model.containerPath),
        containerPath: model.containerPath,
        // View filters are left out: the user edits them like their own, so suggestions may reach past them
        filters: model.baseFilters,
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
    const [settled, setSettled] = useState<SettledSuggestions>({
        complete: true,
        polling: false,
        request: undefined,
        suggestions: [],
    });
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
            model.baseFilters,
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
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;

        const load = async (attempt: number): Promise<void> => {
            let result: SettledSuggestions;
            let failed = false;
            try {
                const response = await api.query.getFilterSuggestions(request);
                result = { ...response, polling: false, request };
            } catch {
                failed = true;
                result = {
                    complete: false,
                    polling: false,
                    request,
                    suggestions: [createSearchSuggestion(request.term)],
                };
            }
            if (id !== requestId.current) return;

            // Polling waits on facts the server is still loading; a failed request isn't retried
            result.polling = !cancelled && !failed && !result.complete && attempt < SUGGESTION_POLL_DELAYS_MS.length;
            if (result.polling) {
                timer = setTimeout(() => load(attempt + 1), SUGGESTION_POLL_DELAYS_MS[attempt]);
            }

            // An unchanged poll keeps the same list, so the menu doesn't reset what the user has highlighted
            setSettled(prev => {
                if (
                    prev.request !== request ||
                    JSON.stringify(prev.suggestions) !== JSON.stringify(result.suggestions)
                ) {
                    return result;
                }
                if (prev.complete === result.complete && prev.polling === result.polling) return prev;
                return { ...prev, complete: result.complete, polling: result.polling };
            });
        };

        timer = setTimeout(() => load(0), SUGGESTION_DEBOUNCE_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [api, enabled, request, trimmed]);

    const suggestions = useMemo(
        () => settled.suggestions.map(suggestion => applyColumnCaption(suggestion, captions)),
        [captions, settled.suggestions]
    );

    return useMemo(() => {
        if (!trimmed) return { complete: true, loading: false, polling: false, suggestions: [] };
        // Suggestions for the same term on a different view or column set name fields the grid may no longer show
        if (settled.request === request) {
            // Closing the menu cancels the next poll
            return { complete: settled.complete, loading: false, polling: enabled && settled.polling, suggestions };
        }
        return { complete: false, loading: true, polling: false, suggestions: [createSearchSuggestion(trimmed)] };
    }, [enabled, request, settled, suggestions, trimmed]);
}
