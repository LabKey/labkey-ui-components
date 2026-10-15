/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter } from '@labkey/api';

import { QueryColumn } from '../../QueryColumn';

import { ComposeSuggestion, FilterKindSuggestion } from './models';
import {
    applyColumnCaption,
    composeFieldToFilter,
    createSearchSuggestion,
    getColumnCaptions,
    suggestionToFilter,
} from './utils';

describe('suggestion filters', () => {
    test('search becomes a Q filter', () => {
        const filter = suggestionToFilter({
            kind: 'search',
            label: '',
            source: 'fallback',
            value: 'foo',
        });
        expect(filter.getColumnName()).toBe('*');
        expect(filter.getFilterType()).toBe(Filter.Types.Q);
        expect(filter.getValue()).toBe('foo');
    });

    test('direct filter', () => {
        const filter = suggestionToFilter({
            fieldKey: 'SampleState/Label',
            kind: 'filter',
            label: '',
            op: 'eq',
            source: 'exactValue',
            value: 'Available',
        });
        expect(filter.getColumnName()).toBe('SampleState/Label');
        expect(filter.getFilterType()).toBe(Filter.Types.EQUAL);
        expect(filter.getValue()).toBe('Available');
    });

    test('multi-valued operators split the value', () => {
        const filter = composeFieldToFilter({ fieldKey: 'Collected', op: 'between' }, '2023-01-01,2023-12-31');
        expect(filter.getFilterType()).toBe(Filter.Types.BETWEEN);
        expect(filter.getValue()).toEqual(['2023-01-01', '2023-12-31']);
    });
});

describe('createSearchSuggestion', () => {
    test('searches all columns for the raw term', () => {
        expect(createSearchSuggestion('Sodium')).toEqual({
            kind: 'search',
            label: 'Search all columns for Sodium',
            match: { end: 29, start: 23 },
            source: 'fallback',
            value: 'Sodium',
        });
    });
});

describe('getColumnCaptions', () => {
    test('keys by lowercase fieldKey and falls back to the name', () => {
        const captions = getColumnCaptions([
            new QueryColumn({ caption: 'Sample ID', fieldKey: 'Name', name: 'Name' }),
            new QueryColumn({ fieldKey: 'SampleState', name: 'SampleState' }),
        ]);
        expect(captions).toEqual({ name: 'Sample ID', samplestate: 'SampleState' });
    });

    test('no columns', () => {
        expect(getColumnCaptions(undefined)).toEqual({});
    });
});

describe('applyColumnCaption', () => {
    const FILTER: FilterKindSuggestion = {
        colMatch: { end: 4, fieldKey: 'Name', start: 0 },
        fieldKey: 'Name',
        kind: 'filter',
        label: 'Name is S-1',
        match: { end: 11, start: 8 },
        op: 'eq',
        source: 'identity',
        value: 'S-1',
    };

    test('replaces the caption and shifts the match after it', () => {
        expect(applyColumnCaption(FILTER, { name: 'Sample ID' })).toEqual({
            ...FILTER,
            colMatch: { end: 9, fieldKey: 'Name', start: 0 },
            label: 'Sample ID is S-1',
            match: { end: 16, start: 13 },
        });
    });

    test('a shorter caption shifts the match back', () => {
        const suggestion: FilterKindSuggestion = {
            ...FILTER,
            colMatch: { end: 6, fieldKey: 'SampleState', start: 0 },
            fieldKey: 'SampleState/Label',
            label: 'Status is Available',
            match: { end: 15, start: 10 },
            value: 'Available',
        };
        const applied = applyColumnCaption(suggestion, { samplestate: 'St' });
        expect(applied.label).toBe('St is Available');
        expect(applied.match).toEqual({ end: 11, start: 6 });
    });

    test('compose label', () => {
        const compose: ComposeSuggestion = {
            colMatch: { end: 11, fieldKey: 'Name', start: 7 },
            fields: [{ fieldKey: 'Name', op: 'eq' }],
            kind: 'compose',
            label: 'Filter Name…',
            source: 'compose',
            value: 'S-1',
            valueType: 'string',
        };
        const applied = applyColumnCaption(compose, { name: 'Sample ID' });
        expect(applied.label).toBe('Filter Sample ID…');
        expect(applied.match).toBeUndefined();
    });

    test('keeps the server label when the column is unknown', () => {
        expect(applyColumnCaption(FILTER, { other: 'Other' })).toBe(FILTER);
    });

    test('ignores suggestions without a column', () => {
        const search = createSearchSuggestion('S-1');
        expect(applyColumnCaption(search, { name: 'Sample ID' })).toBe(search);
        const noColMatch: FilterKindSuggestion = { ...FILTER, colMatch: undefined };
        expect(applyColumnCaption(noColMatch, { name: 'Sample ID' })).toBe(noColMatch);
    });
});
