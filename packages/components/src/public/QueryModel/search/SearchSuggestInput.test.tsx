/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { getTestAPIWrapper } from '../../../internal/APIWrapper';
import { getQueryTestAPIWrapper } from '../../../internal/query/APIWrapper';
import { ViewInfo } from '../../../internal/ViewInfo';
import { ExtendedMap } from '../../ExtendedMap';
import { QueryColumn } from '../../QueryColumn';
import { QueryInfo } from '../../QueryInfo';
import { QueryModel } from '../QueryModel';
import { SchemaQuery } from '../../SchemaQuery';
import { makeTestQueryModel } from '../testUtils';

import { FilterSuggestion, FilterSuggestionsResponse } from './models';
import { PENDING_ENTER_TIMEOUT_MS, SearchSuggestInput } from './SearchSuggestInput';
import { SUGGESTION_DEBOUNCE_MS } from './useSearchSuggestions';

const TUBE_TYPE: FilterSuggestion = {
    fieldKey: 'TubeType',
    kind: 'filter',
    label: 'Tube Type is Sodium Citrate',
    match: { end: 19, start: 13 },
    op: 'eq',
    source: 'partialValue',
    value: 'Sodium Citrate',
};
const COMPOSE: FilterSuggestion = {
    fields: [{ fieldKey: 'TubeType', op: 'contains' }],
    kind: 'compose',
    label: 'Filter Tube Type…',
    source: 'compose',
    value: 'Sodium',
    valueType: 'string',
};
const SEARCH: FilterSuggestion = {
    kind: 'search',
    label: 'Search all fields for Sodium',
    match: { end: 28, start: 22 },
    source: 'fallback',
    value: 'Sodium',
};
const RESPONSE: FilterSuggestionsResponse = { complete: true, suggestions: [TUBE_TYPE, COMPOSE, SEARCH] };

const MODEL = makeTestQueryModel(
    new SchemaQuery('samples', 'Plasma'),
    QueryInfo.fromJsonForTests({ name: 'Plasma', schemaName: 'samples' })
);

describe('SearchSuggestInput', () => {
    let getFilterSuggestions: jest.Mock;
    let incrementClientSideMetricCount: jest.Mock;
    let onApplySuggestion: jest.Mock;
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        jest.useFakeTimers();
        getFilterSuggestions = jest.fn().mockResolvedValue(RESPONSE);
        incrementClientSideMetricCount = jest.fn();
        onApplySuggestion = jest.fn();
        user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    function renderInput(model: QueryModel = MODEL): HTMLInputElement {
        const api = getTestAPIWrapper(jest.fn, {
            query: getQueryTestAPIWrapper(jest.fn, { getFilterSuggestions, incrementClientSideMetricCount }),
        });
        render(<SearchSuggestInput api={api} model={model} onApplySuggestion={onApplySuggestion} />);
        return document.querySelector('.grid-panel__search-input');
    }

    const optionLabels = (): string[] =>
        Array.from(document.querySelectorAll('[role="option"] .grid-panel__search-suggestion-label')).map(
            el => el.textContent
        );

    const metrics = (): string[] => incrementClientSideMetricCount.mock.calls.map(([, metric]) => metric);

    async function settle(): Promise<void> {
        await act(async () => {
            jest.advanceTimersByTime(SUGGESTION_DEBOUNCE_MS);
        });
    }

    test('shows the full search immediately, then the suggestions', async () => {
        const input = renderInput();
        expect(input.getAttribute('role')).toBe('combobox');
        expect(input.getAttribute('aria-expanded')).toBe('false');

        await user.type(input, 'Sodium');
        expect(input.getAttribute('aria-expanded')).toBe('true');
        expect(optionLabels()).toEqual(['Search all fields for Sodium']);
        expect(document.querySelectorAll('.grid-panel__search-suggestion-loading')).toHaveLength(1);
        expect(document.querySelector('[role="option"].active')).toBeNull();

        await settle();
        expect(getFilterSuggestions).toHaveBeenCalledTimes(1);
        expect(getFilterSuggestions.mock.calls[0][0]).toMatchObject({
            queryName: 'Plasma',
            schemaName: 'samples',
            term: 'Sodium',
        });
        expect(optionLabels()).toEqual([TUBE_TYPE.label, COMPOSE.label, SEARCH.label]);
        expect(
            Array.from(document.querySelectorAll('[role="option"]')).map(el => [
                el.getAttribute('data-kind'),
                el.getAttribute('data-source'),
            ])
        ).toEqual([
            ['filter', 'partialValue'],
            ['compose', 'compose'],
            ['search', 'fallback'],
        ]);
        expect(document.querySelectorAll('.grid-panel__search-suggestion-loading')).toHaveLength(0);
        const active = document.querySelector('[role="option"].active');
        expect(active.textContent).toContain(TUBE_TYPE.label);
        expect(input.getAttribute('aria-activedescendant')).toBe(active.id);
    });

    test('bolds the search term within each label', async () => {
        const input = renderInput();
        await user.type(input, 'Sodium');
        await settle();

        const bolded = Array.from(document.querySelectorAll('[role="option"]')).map(
            option => option.querySelector('strong')?.textContent ?? null
        );
        expect(bolded).toEqual(['Sodium', null, 'Sodium']);
    });

    test('labels use the caption the grid shows', async () => {
        const queryInfo = new QueryInfo({
            columns: new ExtendedMap({
                tubetype: new QueryColumn({ caption: 'Collection Tube', fieldKey: 'TubeType', name: 'TubeType' }),
            }),
            views: new ExtendedMap({
                [ViewInfo.DEFAULT_NAME.toLowerCase()]: ViewInfo.fromJson({
                    columns: [{ fieldKey: 'TubeType' }],
                    name: ViewInfo.DEFAULT_NAME,
                }),
            }),
        });
        const model = makeTestQueryModel(new SchemaQuery('samples', 'Plasma'), queryInfo);
        getFilterSuggestions.mockResolvedValue({
            complete: true,
            suggestions: [
                { ...TUBE_TYPE, colMatch: { end: 9, fieldKey: 'TubeType', start: 0 } },
                { ...COMPOSE, colMatch: { end: 16, fieldKey: 'TubeType', start: 7 } },
                SEARCH,
            ],
        });

        const input = renderInput(model);
        await user.type(input, 'Sodium');
        await settle();

        expect(optionLabels()).toEqual(['Collection Tube is Sodium Citrate', 'Filter Collection Tube…', SEARCH.label]);
        expect(document.querySelector('[role="option"] strong').textContent).toBe('Sodium');
    });

    test('Enter while loading waits and applies the top suggestion, not the full search', async () => {
        const input = renderInput();
        await user.type(input, 'Sodium{Enter}');
        expect(onApplySuggestion).not.toHaveBeenCalled();

        await settle();
        expect(onApplySuggestion).toHaveBeenCalledWith(TUBE_TYPE);
        expect(input.value).toBe('');
        expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    test('Enter falls back to the best available suggestion when loading takes too long', async () => {
        getFilterSuggestions.mockReturnValue(new Promise(() => undefined));
        const input = renderInput();
        await user.type(input, 'Sodium{Enter}');

        await act(async () => {
            jest.advanceTimersByTime(PENDING_ENTER_TIMEOUT_MS);
        });
        expect(onApplySuggestion).toHaveBeenCalledWith(SEARCH);
        // A Q filter shows as a pill, so the box clears
        expect(input.value).toBe('');
    });

    test('arrow keys choose a suggestion', async () => {
        const input = renderInput();
        await user.type(input, 'Sodium');
        await settle();

        await user.keyboard('{ArrowDown}');
        const active = document.querySelector('[role="option"].active');
        expect(active.textContent).toContain(COMPOSE.label);
        expect(input.getAttribute('aria-activedescendant')).toBe(active.id);

        await user.keyboard('{Enter}');
        expect(onApplySuggestion).toHaveBeenCalledWith(COMPOSE);
    });

    test('clicking a suggestion applies it', async () => {
        const input = renderInput();
        await user.type(input, 'Sodium');
        await settle();

        await user.click(document.querySelectorAll('[role="option"]')[2]);
        expect(onApplySuggestion).toHaveBeenCalledWith(SEARCH);
    });

    test('Escape closes the menu, then clears the text', async () => {
        const input = renderInput();
        await user.type(input, 'Sodium');
        await settle();

        await user.keyboard('{Escape}');
        expect(input.getAttribute('aria-expanded')).toBe('false');
        expect(input.value).toBe('Sodium');

        await user.keyboard('{Escape}');
        expect(input.value).toBe('');
    });

    test('no request is made until the input is used', async () => {
        renderInput();
        await settle();

        expect(getFilterSuggestions).not.toHaveBeenCalled();
    });

    test('Enter on an empty box does nothing', async () => {
        const input = renderInput();
        await user.click(input);
        await user.keyboard('{Enter}');

        expect(onApplySuggestion).not.toHaveBeenCalled();
    });

    test('counts one engagement per search attempt', async () => {
        const input = renderInput();
        await user.click(input);
        await user.type(input, ' ');
        expect(metrics()).toEqual([]);

        await user.type(input, 'Sodium');
        expect(incrementClientSideMetricCount).toHaveBeenCalledWith('gridSearch', 'engaged');
        await user.clear(input);
        await user.type(input, 'Sodium');
        await settle();
        await user.keyboard('{Enter}');
        await user.type(input, 'Hep');
        expect(metrics()).toEqual(['engaged', 'filterChosen', 'partialValue', 'engaged']);

        await user.tab();
        await user.type(input, 'ium');
        expect(metrics()).toEqual(['engaged', 'filterChosen', 'partialValue', 'engaged', 'engaged']);
    });

    test('counts a Name filter on a sample grid', async () => {
        const name: FilterSuggestion = { ...TUBE_TYPE, fieldKey: 'Name', label: 'Name is S-1', source: 'identity' };
        getFilterSuggestions.mockResolvedValue({ complete: true, suggestions: [name, SEARCH] });
        const input = renderInput();
        await user.type(input, 'S-1');
        await settle();
        await user.keyboard('{Enter}');

        expect(metrics()).toEqual(['engaged', 'filterChosen', 'identity', 'sampleNameChosen']);
    });
});
