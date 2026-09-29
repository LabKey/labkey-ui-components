/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter } from '@labkey/api';

import { ComposeField, FilterKindSuggestion, SearchSuggestion } from './models';

let searchSuggestionsEnabled = false;

/**
 * Opt every GridPanel into search suggestions unless a grid sets showSearchSuggestions explicitly. Intended to be
 * called once when an application starts.
 */
export function setGridSearchSuggestionsEnabled(enabled: boolean): void {
    searchSuggestionsEnabled = enabled;
}

export function isGridSearchSuggestionsEnabled(): boolean {
    return searchSuggestionsEnabled;
}

/** Letters become "A" and digits "9", so "SUBJ-028504" and "SUBJ-044304" share the shape "AAAA-999999". */
export function getValueShape(value: string): string {
    return value.replace(/[A-Za-z]/g, 'A').replace(/\d/g, '9');
}

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Compiles a name expression into a pattern where each ${...} substitution matches anything. Returns undefined when
 * the constant parts carry no letter or digit, since a bare separator (e.g. "${Parent}-${genId}") matches too much.
 */
export function nameExpressionToRegExp(expression: string): RegExp {
    if (!expression) return undefined;

    let pattern = '';
    let literal = '';
    let i = 0;
    while (i < expression.length) {
        if (expression.startsWith('${', i)) {
            let depth = 1;
            let j = i + 2;
            while (j < expression.length && depth > 0) {
                if (expression.startsWith('${', j)) {
                    depth++;
                    j += 2;
                } else {
                    if (expression[j] === '}') depth--;
                    j++;
                }
            }
            pattern += '.+?';
            i = j;
        } else {
            literal += expression[i];
            pattern += escapeRegExp(expression[i]);
            i++;
        }
    }

    if (!/[A-Za-z0-9]/.test(literal)) return undefined;

    return new RegExp('^' + pattern + '$', 'i');
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
