/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Ajax, Query } from '@labkey/api';

import { fetchFilterSuggestions } from './fetchFilterSuggestions';
import { FilterSuggestionsRequest, FilterSuggestionsResponse } from './models';

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
            op: 'eq',
            source: 'identity',
            value: 'PL-1',
        },
        {
            kind: 'search',
            label: 'Search all columns for "PL-1"',
            source: 'fallback',
            value: 'PL-1',
        },
    ],
};

describe('fetchFilterSuggestions', () => {
    test('posts the request to the endpoint in its container', async () => {
        const request = jest.fn((config: Ajax.RequestOptions) => {
            config.success({ responseJSON: RESPONSE } as unknown as XMLHttpRequest, config);
            return undefined;
        });

        await expect(fetchFilterSuggestions(REQUEST, request)).resolves.toEqual(RESPONSE);

        const config = request.mock.calls[0][0];
        expect(config.method).toBe('POST');
        expect(config.url).toContain('/Plasma/');
        expect(config.url).toContain('query-getFilterSuggestions.api');
        expect(config.jsonData).toEqual({ ...REQUEST, containerPath: undefined });
    });

    test('rejects on failure', async () => {
        const request = jest.fn((config: Ajax.RequestOptions) => {
            const response = { responseJSON: { exception: 'Query not found' }, status: 404 };
            config.failure(response as unknown as XMLHttpRequest, config);
            return undefined;
        });

        await expect(fetchFilterSuggestions(REQUEST, request)).rejects.toMatchObject({
            exception: 'Query not found',
            status: 404,
        });
    });
});
