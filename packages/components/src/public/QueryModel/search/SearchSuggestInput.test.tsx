/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { Filter } from '@labkey/api';
import { act, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { getTestAPIWrapper } from '../../../internal/APIWrapper';
import { getQueryTestAPIWrapper } from '../../../internal/query/APIWrapper';
import { QueryInfo } from '../../QueryInfo';
import { SchemaQuery } from '../../SchemaQuery';
import { SearchAction } from '../grid/actions/Search';
import { makeTestQueryModel } from '../testUtils';

import { FilterSuggestion, FilterSuggestionsResponse } from './models';
import { PENDING_ENTER_TIMEOUT_MS, SearchSuggestInput } from './SearchSuggestInput';
import { SUGGESTION_DEBOUNCE_MS } from './useSearchSuggestions';

const TUBE_TYPE: FilterSuggestion = {
    fieldKey: 'TubeType',
    kind: 'filter',
    label: 'Tube Type is Sodium Citrate',
    op: 'eq',
    source: 'partialValue',
    value: 'Sodium Citrate',
};
const COMPOSE: FilterSuggestion = {
    fields: [{ fieldKey: 'TubeType', op: 'contains' }],
    kind: 'compose',
    label: 'Compose a filter on Tube Type…',
    source: 'compose',
    value: 'Sodium',
    valueType: 'string',
};
const SEARCH: FilterSuggestion = {
    kind: 'search',
    label: 'Search all columns for "Sodium"',
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
    let onApplySuggestion: jest.Mock;
    let onSearch: jest.Mock;
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        jest.useFakeTimers();
        getFilterSuggestions = jest.fn().mockResolvedValue(RESPONSE);
        onApplySuggestion = jest.fn();
        onSearch = jest.fn();
        user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    function renderInput(actionValues = []): HTMLInputElement {
        const api = getTestAPIWrapper(jest.fn, { query: getQueryTestAPIWrapper(jest.fn, { getFilterSuggestions }) });
        render(
            <SearchSuggestInput
                actionValues={actionValues}
                api={api}
                model={MODEL}
                onApplySuggestion={onApplySuggestion}
                onSearch={onSearch}
            />
        );
        return document.querySelector('.grid-panel__search-input');
    }

    const optionLabels = (): string[] =>
        Array.from(document.querySelectorAll('[role="option"] .grid-panel__search-suggestion-label')).map(
            el => el.textContent
        );

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
        expect(optionLabels()).toEqual(['Search all columns for "Sodium"']);
        expect(document.querySelectorAll('.grid-panel__search-suggestion-loading')).toHaveLength(1);

        await settle();
        expect(getFilterSuggestions).toHaveBeenCalledTimes(1);
        expect(getFilterSuggestions.mock.calls[0][0]).toMatchObject({
            queryName: 'Plasma',
            schemaName: 'samples',
            term: 'Sodium',
        });
        expect(optionLabels()).toEqual([TUBE_TYPE.label, COMPOSE.label, SEARCH.label]);
        expect(document.querySelectorAll('.grid-panel__search-suggestion-loading')).toHaveLength(0);
        expect(document.querySelector('.grid-panel__search-suggestion-hint')).not.toBeNull();
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
        // A Q filter keeps its text in the box
        expect(input.value).toBe('Sodium');
    });

    test('arrow keys choose a suggestion', async () => {
        const input = renderInput();
        await user.type(input, 'Sodium');
        await settle();

        await user.keyboard('{ArrowDown}{ArrowDown}');
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
        const appliedSearch = {
            action: new SearchAction(),
            value: 'foo',
            valueObject: Filter.create('*', 'foo', Filter.Types.Q),
        };
        const input = renderInput([appliedSearch]);
        await settle();

        expect(input.value).toBe('foo');
        expect(getFilterSuggestions).not.toHaveBeenCalled();
    });

    test('Enter on an empty box removes an applied search', async () => {
        const appliedSearch = {
            action: new SearchAction(),
            value: 'foo',
            valueObject: Filter.create('*', 'foo', Filter.Types.Q),
        };
        const input = renderInput([appliedSearch]);
        await user.clear(input);
        await user.keyboard('{Enter}');

        expect(onSearch).toHaveBeenCalledWith('');
        expect(onApplySuggestion).not.toHaveBeenCalled();
    });
});
