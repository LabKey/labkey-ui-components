/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter, Query } from '@labkey/api';

import { request } from '../../../internal/request';

import { getFilterSuggestions } from './actions';
import { FilterSuggestionsRequest, FilterSuggestionsResponse } from './models';

jest.mock('../../../internal/request', () => ({
    request: jest.fn(),
}));

const REQUEST: FilterSuggestionsRequest = {
    columns: ['Name', 'TubeType'],
    containerFilter: Query.ContainerFilter.currentAndSubfolders,
    containerPath: '/Plasma',
    queryName: 'Plasma',
    schemaName: 'samples',
    term: 'PL-1',
};

const RESPONSE: FilterSuggestionsResponse = {
    complete: true,
    suggestions: [
        {
            fieldKey: 'Name',
            kind: 'filter',
            label: 'Sample ID is PL-1',
            match: { end: 17, start: 13 },
            op: 'eq',
            source: 'identity',
            value: 'PL-1',
        },
        {
            kind: 'search',
            label: 'Search all fields for PL-1',
            match: { end: 26, start: 22 },
            source: 'fallback',
            value: 'PL-1',
        },
    ],
};

describe('getFilterSuggestions', () => {
    beforeEach(() => {
        jest.mocked(request).mockReset();
    });

    test('posts the request to the endpoint in its container', async () => {
        jest.mocked(request).mockResolvedValue(RESPONSE);

        await expect(getFilterSuggestions(REQUEST)).resolves.toEqual(RESPONSE);

        const options = jest.mocked(request).mock.calls[0][0];
        expect(options.method).toBe('POST');
        expect(options.url).toContain('/Plasma/');
        expect(options.url).toContain('query-getFilterSuggestions.api');
        expect(options.jsonData).toEqual({ ...REQUEST, containerPath: undefined });
    });

    test('sends filters in their URL form', async () => {
        jest.mocked(request).mockResolvedValue(RESPONSE);

        await getFilterSuggestions({
            ...REQUEST,
            filters: [
                Filter.create('BoxId', 1),
                Filter.create('Units/Value', ['mL', 'uL'], Filter.Types.IN),
                Filter.create('Tube$SType', undefined, Filter.Types.NONBLANK),
            ],
        });

        expect(jest.mocked(request).mock.calls[0][0].jsonData.filters).toEqual([
            { fieldKey: 'BoxId', op: 'eq', value: '1' },
            { fieldKey: 'Units/Value', op: 'in', value: 'mL;uL' },
            { fieldKey: 'Tube$SType', op: 'isnonblank', value: '' },
        ]);
    });

    test('defaults a response without suggestions to an empty, complete list', async () => {
        jest.mocked(request).mockResolvedValue({});

        await expect(getFilterSuggestions(REQUEST)).resolves.toEqual({ complete: true, suggestions: [] });
    });

    test('rejects on failure', async () => {
        jest.mocked(request).mockRejectedValue({ exception: 'Query not found', status: 404 });

        await expect(getFilterSuggestions(REQUEST)).rejects.toMatchObject({
            exception: 'Query not found',
            status: 404,
        });
    });
});
