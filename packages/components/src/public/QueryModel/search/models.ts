/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter, Query } from '@labkey/api';

// Request/response shapes of query-getFilterSuggestions.api

export interface FilterSuggestionsRequest {
    // Display column fieldKeys of the grid; only these (plus numeric primary keys) are considered
    columns: string[];
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    // The grid's base filters, which bound the rows suggestions are drawn from
    filters?: Filter.IFilter[];
    // Most suggestions the server should return; it defaults to 10 and caps this at 100
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
    | 'partialMatch'
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

export type ColumnFacetsRequest = Omit<FilterSuggestionsRequest, 'maxSuggestions' | 'term'>;

export interface ColumnFacet {
    distinctCount?: number;
    fieldKey: string;
    // The grid column as the request named it, which differs from fieldKey for a lookup filtered on its display column
    gridFieldKey: string;
    hasBlank: boolean;
    // A value was too long to cache, so values is incomplete and callers must query instead
    truncated: boolean;
    type: 'BOOLEAN' | 'DATE' | 'FLOAT' | 'INT' | 'STRING';
    values?: string[];
    // values were read from the rows the request selects. When false they are the column's allowed options, or a
    // lookup's values read without this grid's filters, so they don't describe what the grid shows.
    valuesFromData: boolean;
}

export interface ColumnFacetsResponse {
    columns: ColumnFacet[];
    complete: boolean;
    // The table behind the query is too big for any grid to list values from speculatively
    largeTable?: boolean;
}
