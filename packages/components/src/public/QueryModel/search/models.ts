/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Query } from '@labkey/api';

// Request/response shapes of query-getFilterSuggestions.api

export interface FilterSuggestionsRequest {
    // Display column fieldKeys of the grid; only these (plus numeric primary keys) are considered
    columns: string[];
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    maxSuggestions?: number;
    parameters?: Record<string, unknown>;
    queryName: string;
    schemaName: string;
    term: string;
    viewName?: string;
}

export type SuggestionSource =
    | 'compose'
    | 'exactValue'
    | 'fallback'
    | 'identity'
    | 'identityContains'
    | 'integerValue'
    | 'key'
    | 'partialValue'
    | 'shape'
    | 'shapeContains';

export type SuggestionValueType = 'date' | 'number' | 'string';

// Where the label shows the search term; end is exclusive
export interface SuggestionMatch {
    end: number;
    start: number;
}

// Where the label shows a column's caption; fieldKey is the grid column as the request named it
export interface ColumnMatch extends SuggestionMatch {
    fieldKey: string;
}

export interface FilterKindSuggestion {
    colMatch?: ColumnMatch;
    fieldKey: string;
    kind: 'filter';
    label: string;
    match?: SuggestionMatch;
    op: string; // Filter type URL suffix
    source: SuggestionSource;
    value: string;
}

export interface ComposeField {
    fieldKey: string;
    op: string;
}

export interface ComposeSuggestion {
    colMatch?: ColumnMatch;
    // Ordered best-first; the first is selected when the filter modal opens
    fields: ComposeField[];
    kind: 'compose';
    label: string;
    match?: SuggestionMatch;
    source: 'compose';
    value: string;
    valueType: SuggestionValueType;
}

export interface SearchSuggestion {
    kind: 'search';
    label: string;
    match?: SuggestionMatch;
    source: 'fallback';
    value: string;
}

export type FilterSuggestion = ComposeSuggestion | FilterKindSuggestion | SearchSuggestion;

export interface FilterSuggestionsResponse {
    // False when the time budget elapsed before every data source finished loading
    complete: boolean;
    suggestions: FilterSuggestion[];
}
