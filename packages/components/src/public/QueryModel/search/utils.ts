/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter } from '@labkey/api';

import { ComposeField, FilterKindSuggestion, SearchSuggestion } from './models';

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
