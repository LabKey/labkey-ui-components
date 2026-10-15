/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter } from '@labkey/api';

import { QueryColumn } from '../../QueryColumn';

import { ComposeField, FilterKindSuggestion, FilterSuggestion, SearchSuggestion } from './models';

export function createSearchSuggestion(raw: string): SearchSuggestion {
    const prefix = 'Search all columns for ';
    return {
        kind: 'search',
        label: prefix + raw,
        match: { end: prefix.length + raw.length, start: prefix.length },
        source: 'fallback',
        value: raw,
    };
}

// Keyed by lowercase fieldKey, with the caption the grid header shows
export function getColumnCaptions(columns: QueryColumn[] = []): Record<string, string> {
    return columns.reduce<Record<string, string>>((captions, column) => {
        if (column.fieldKey) captions[column.fieldKey.toLowerCase()] = column.caption || column.name;
        return captions;
    }, {});
}

// The server labels with its own captions, which query metadata and the view may override
export function applyColumnCaption(suggestion: FilterSuggestion, captions: Record<string, string>): FilterSuggestion {
    if (suggestion.kind === 'search' || !suggestion.colMatch) return suggestion;

    const { colMatch, label, match } = suggestion;
    const caption = captions[colMatch.fieldKey.toLowerCase()];
    if (!caption) return suggestion;

    const shift = caption.length - (colMatch.end - colMatch.start);
    let shiftedMatch = match;
    if (match && match.start >= colMatch.end) {
        shiftedMatch = { end: match.end + shift, start: match.start + shift };
    }

    return {
        ...suggestion,
        colMatch: { ...colMatch, end: colMatch.start + caption.length },
        label: label.slice(0, colMatch.start) + caption + label.slice(colMatch.end),
        match: shiftedMatch,
    };
}

function toFilterValue(filterType: Filter.IFilterType, value: string): string | string[] {
    return filterType.isMultiValued() ? value.split(',') : value;
}

export function composeFieldToFilter(field: ComposeField, value: string): Filter.IFilter {
    const filterType = Filter.getFilterTypeForURLSuffix(field.op);
    return Filter.create(field.fieldKey, toFilterValue(filterType, value), filterType);
}

export function suggestionToFilter(suggestion: FilterKindSuggestion | SearchSuggestion): Filter.IFilter {
    if (suggestion.kind === 'search') {
        return Filter.create('*', suggestion.value, Filter.Types.Q);
    }

    return composeFieldToFilter(suggestion, suggestion.value);
}
