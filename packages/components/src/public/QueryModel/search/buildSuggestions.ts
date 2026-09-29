/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {
    ComposeField,
    ComposeSuggestion,
    FilterKindSuggestion,
    FilterSuggestion,
    SearchSuggestion,
    SuggestionColumn,
    SuggestionSource,
    SuggestionValueType,
} from './models';
import { DateSpan, SuggestionTerm } from './term';
import { getValueShape, nameExpressionToRegExp } from './utils';

export const DEFAULT_MAX_SUGGESTIONS = 10;
const MAX_PARTIAL_VALUE_SUGGESTIONS = 5;
const MAX_INTEGER_VALUE_SUGGESTIONS = 3;
const MIN_PARTIAL_MATCH_LENGTH = 2;
// Generated unique IDs are zero-padded to 9 digits; shorter digit runs are far more likely to be quantities
const BARCODE_PATTERN = /^\d{6,}$/;

const nameExpressionPatterns = new Map<string, RegExp>();

function matchesIdentity(column: SuggestionColumn, raw: string): boolean {
    if (column.isUniqueId && BARCODE_PATTERN.test(raw)) return true;
    if (!column.nameExpression) return false;

    if (!nameExpressionPatterns.has(column.nameExpression)) {
        nameExpressionPatterns.set(column.nameExpression, nameExpressionToRegExp(column.nameExpression));
    }
    return nameExpressionPatterns.get(column.nameExpression)?.test(raw) ?? false;
}

function inNumberRange(column: SuggestionColumn, value: number): boolean {
    if (column.rangeUnknown) return true;
    if (column.min === undefined || column.max === undefined) return false;
    return value >= Number(column.min) && value <= Number(column.max);
}

function overlapsDateRange(column: SuggestionColumn, span: DateSpan): boolean {
    if (column.rangeUnknown) return true;
    if (column.min === undefined || column.max === undefined) return false;
    return span.start <= String(column.max) && span.end >= String(column.min);
}

export function createSearchSuggestion(raw: string): SearchSuggestion {
    return { kind: 'search', label: `Search all columns for "${raw}"`, source: 'fallback', value: raw };
}

function createCompose(
    columns: SuggestionColumn[],
    fields: ComposeField[],
    value: string,
    valueType: SuggestionValueType,
    raw: string
): ComposeSuggestion {
    let label: string;
    if (fields.length === 1) {
        const caption = columns.find(column => column.fieldKey === fields[0].fieldKey)?.caption;
        label = `Compose a filter on ${caption}…`;
    } else {
        label = `Compose a ${valueType} filter for "${raw}"… (${fields.length} columns)`;
    }

    return { fields, kind: 'compose', label, source: 'compose', value, valueType };
}

/**
 * Ranks targeted filters for a single search term from what is known about each column. Direct filters are ordered
 * by tier (numeric key, identity, exact value, partial value, integer value, shape), then come the compose options,
 * and the Q filter is always last.
 */
export function buildSuggestions(
    term: SuggestionTerm,
    columns: SuggestionColumn[],
    maxSuggestions = DEFAULT_MAX_SUGGESTIONS
): FilterSuggestion[] {
    const { raw } = term;
    if (!raw) return [];

    const lcRaw = raw.toLowerCase();
    const direct: FilterKindSuggestion[] = [];
    const seen = new Set<string>();
    // Columns the term plausibly belongs to, mapped to the operator to seed when composing a string filter
    const stringSignals = new Map<string, string>();

    const addFilter = (column: SuggestionColumn, value: string, source: SuggestionSource): void => {
        const key = `${column.fieldKey}|${value}`.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        direct.push({
            fieldKey: column.fieldKey,
            kind: 'filter',
            label: `${column.caption} is ${value}`,
            op: 'eq',
            source,
            value,
        });
    };
    const addSignal = (column: SuggestionColumn, op: string): void => {
        if (!stringSignals.has(column.fieldKey)) stringSignals.set(column.fieldKey, op);
    };

    if (term.isInteger && !term.hasLeadingZero) {
        columns
            .filter(column => column.isKey && column.type === 'int')
            .forEach(column => addFilter(column, raw, 'key'));
    }

    columns.forEach(column => {
        if (column.type === 'string' && matchesIdentity(column, raw)) {
            addFilter(column, raw, 'identity');
            addSignal(column, 'eq');
        }
    });

    columns.forEach(column => {
        if (column.type === 'int' || !column.values) return;
        const exact = column.values.find(value => value.toLowerCase() === lcRaw);
        if (exact !== undefined) {
            addFilter(column, exact, 'exactValue');
            if (column.type === 'string') addSignal(column, 'contains');
        }
    });

    if (raw.length >= MIN_PARTIAL_MATCH_LENGTH) {
        const partials: { column: SuggestionColumn; isPrefix: boolean; value: string }[] = [];
        columns.forEach(column => {
            if (column.type !== 'string' || !column.values) return;
            column.values.forEach(value => {
                const lcValue = value.toLowerCase();
                if (lcValue !== lcRaw && lcValue.includes(lcRaw)) {
                    partials.push({ column, isPrefix: lcValue.startsWith(lcRaw), value });
                    addSignal(column, 'contains');
                }
            });
        });

        partials
            .sort((a, b) => Number(b.isPrefix) - Number(a.isPrefix) || a.value.length - b.value.length)
            .slice(0, MAX_PARTIAL_VALUE_SUGGESTIONS)
            .forEach(partial => addFilter(partial.column, partial.value, 'partialValue'));
    }

    if (term.isInteger && !term.hasLeadingZero) {
        const value = String(term.number);
        columns
            .filter(column => column.type === 'int' && !column.isKey && column.values?.includes(value))
            .slice(0, MAX_INTEGER_VALUE_SUGGESTIONS)
            .forEach(column => addFilter(column, value, 'integerValue'));
    }

    const shape = getValueShape(raw);
    columns.forEach(column => {
        if (column.type === 'string' && column.shapes?.includes(shape)) {
            addFilter(column, raw, 'shape');
            addSignal(column, 'eq');
        }
    });

    const compose: ComposeSuggestion[] = [];
    const isNumber = term.number !== undefined && !term.hasLeadingZero;

    if (stringSignals.size > 0) {
        const fields = Array.from(stringSignals.entries()).map(([fieldKey, op]) => ({ fieldKey, op }));
        compose.push(createCompose(columns, fields, raw, 'string', raw));
    }

    if (isNumber) {
        const fields = columns
            .filter(
                column =>
                    (column.type === 'float' || (column.type === 'int' && term.isInteger)) &&
                    !column.isKey &&
                    inNumberRange(column, term.number)
            )
            .map(column => ({ fieldKey: column.fieldKey, op: 'eq' }));
        if (fields.length) compose.push(createCompose(columns, fields, raw, 'number', raw));
    }

    if (term.dateSpan) {
        const { dateSpan } = term;
        const isDay = dateSpan.precision === 'day';
        const op = isDay ? 'dateeq' : 'between';
        const fields = columns
            .filter(column => column.type === 'date' && overlapsDateRange(column, dateSpan))
            .map(column => ({ fieldKey: column.fieldKey, op }));
        const value = isDay ? dateSpan.start : `${dateSpan.start},${dateSpan.end}`;
        if (fields.length) compose.push(createCompose(columns, fields, value, 'date', raw));
    }

    // A term with no string signal that also parses as a number or date belongs to those tiers, not to every string
    if (stringSignals.size === 0 && term.number === undefined && !term.dateSpan) {
        const fields = columns
            .filter(column => column.type === 'string')
            .sort((a, b) => Number(!!b.isTitle) - Number(!!a.isTitle))
            .map(column => ({ fieldKey: column.fieldKey, op: 'contains' }));
        if (fields.length) compose.push(createCompose(columns, fields, raw, 'string', raw));
    }

    const directLimit = Math.max(0, maxSuggestions - compose.length - 1);
    return [...direct.slice(0, directLimit), ...compose, createSearchSuggestion(raw)];
}
