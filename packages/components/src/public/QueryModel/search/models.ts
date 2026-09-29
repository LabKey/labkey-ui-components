/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Query } from '@labkey/api';

// Request/response shapes mirror the planned query-getFilterSuggestions.api endpoint, so the client engine can be
// swapped for a server call without touching any consumer.

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
    'compose' | 'exactValue' | 'fallback' | 'identity' | 'integerValue' | 'key' | 'partialValue' | 'shape';

export type SuggestionValueType = 'date' | 'number' | 'string';

export interface FilterKindSuggestion {
    fieldKey: string;
    kind: 'filter';
    label: string;
    op: string; // Filter type URL suffix
    source: SuggestionSource;
    value: string;
}

export interface ComposeField {
    fieldKey: string;
    op: string;
}

export interface ComposeSuggestion {
    // Ordered best-first; the first is selected when the filter modal opens
    fields: ComposeField[];
    kind: 'compose';
    label: string;
    source: 'compose';
    value: string;
    valueType: SuggestionValueType;
}

export interface SearchSuggestion {
    kind: 'search';
    label: string;
    source: 'fallback';
    value: string;
}

export type FilterSuggestion = ComposeSuggestion | FilterKindSuggestion | SearchSuggestion;

export interface FilterSuggestionsResponse {
    // False when the time budget elapsed before every data source finished loading
    complete: boolean;
    suggestions: FilterSuggestion[];
}

export type SuggestionColumnType = 'boolean' | 'date' | 'float' | 'int' | 'string';

/**
 * Everything the ranking step knows about a column: its metadata plus whatever data-derived facts (values, shapes,
 * ranges) have loaded. Absent facts simply disable the tiers that need them.
 */
export interface SuggestionColumn {
    caption: string;
    fieldKey: string;
    isKey?: boolean;
    isTitle?: boolean;
    isUniqueId?: boolean;
    max?: number | string; // ISO yyyy-MM-dd for date columns
    min?: number | string;
    nameExpression?: string;
    // Range stats failed to load, so range checks are skipped rather than excluding the column
    rangeUnknown?: boolean;
    shapes?: string[];
    type: SuggestionColumnType;
    values?: string[];
}
