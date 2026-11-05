/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { renderHook, waitFor } from '@testing-library/react';

import { getTestAPIWrapper } from '../../../internal/APIWrapper';
import { getQueryTestAPIWrapper } from '../../../internal/query/APIWrapper';

import { ColumnFacetsRequest, ColumnFacetsResponse } from './models';
import { useColumnFacets } from './useColumnFacets';

describe('useColumnFacets', () => {
    const REQUEST: ColumnFacetsRequest = { columns: ['Name'], queryName: 'Samples', schemaName: 'samples' };

    const FACET = {
        fieldKey: 'Name',
        gridFieldKey: 'Name',
        hasBlank: false,
        truncated: false,
        type: 'STRING' as const,
        valuesFromData: true,
        values: ['a'],
    };

    const renderFacets = (getColumnFacets: jest.Mock, request: ColumnFacetsRequest) => {
        const api = getTestAPIWrapper(jest.fn, { query: getQueryTestAPIWrapper(jest.fn, { getColumnFacets }) });
        return renderHook(() => useColumnFacets(api, request));
    };

    const response = (complete: boolean): ColumnFacetsResponse => ({ columns: [FACET], complete, largeTable: false });

    test('stops at one request when the server reports the facts finished', async () => {
        const getColumnFacets = jest.fn().mockResolvedValue(response(true));
        const { result } = renderFacets(getColumnFacets, REQUEST);

        await waitFor(() => expect(result.current.pending).toBe(false));
        expect(getColumnFacets).toHaveBeenCalledTimes(1);
        expect(result.current.facets.name).toEqual(FACET);
    });

    test('polls while the facts are unfinished, then gives up and stops waiting', async () => {
        const getColumnFacets = jest.fn().mockResolvedValue(response(false));
        const { result } = renderFacets(getColumnFacets, REQUEST);

        // Still expecting more facts while polls remain, so a caller waiting on them keeps waiting
        await waitFor(() => expect(getColumnFacets).toHaveBeenCalledTimes(1));
        expect(result.current.pending).toBe(true);

        // One request plus the three scheduled polls, and then no more: waited past the longest delay (3000ms),
        // so a fifth poll would have landed by now
        await waitFor(() => expect(result.current.pending).toBe(false), { timeout: 10_000 });
        expect(getColumnFacets).toHaveBeenCalledTimes(4);
        await new Promise(resolve => setTimeout(resolve, 3_500));
        expect(getColumnFacets).toHaveBeenCalledTimes(4);

        // and whatever the polls did deliver is kept
        expect(result.current.facets.name).toEqual(FACET);
    }, 20_000);

    test('the first response settles largeTable, and a large table is not polled for the rest', async () => {
        const getColumnFacets = jest.fn().mockResolvedValue({ columns: [], complete: false, largeTable: true });
        const { result } = renderFacets(getColumnFacets, REQUEST);

        expect(result.current.loading).toBe(true);
        expect(result.current.largeTable).toBeUndefined();

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.largeTable).toBe(true);
        // Facts the table is too big to have loaded in time won't arrive in the next few seconds either, so nothing
        // waits on them: one request, and the caller is free to query
        expect(result.current.pending).toBe(false);
        await new Promise(resolve => setTimeout(resolve, 2_500));
        expect(getColumnFacets).toHaveBeenCalledTimes(1);
    }, 10_000);

    test('a failed request stops waiting at once and is not retried', async () => {
        const getColumnFacets = jest.fn().mockRejectedValue(new Error('nope'));
        const { result } = renderFacets(getColumnFacets, REQUEST);

        await waitFor(() => expect(result.current.pending).toBe(false));
        expect(getColumnFacets).toHaveBeenCalledTimes(1);
        expect(result.current.facets).toEqual({});
    });

    test('a failure after a good poll keeps what that poll delivered', async () => {
        const getColumnFacets = jest.fn().mockResolvedValueOnce(response(false)).mockRejectedValue(new Error('nope'));
        const { result } = renderFacets(getColumnFacets, REQUEST);

        await waitFor(() => expect(result.current.pending).toBe(false), { timeout: 10_000 });
        expect(getColumnFacets).toHaveBeenCalledTimes(2);
        expect(result.current.facets.name).toEqual(FACET);
    }, 15_000);

    test('unmounting cancels the next poll', async () => {
        const getColumnFacets = jest.fn().mockResolvedValue(response(false));
        const { unmount } = renderFacets(getColumnFacets, REQUEST);

        await waitFor(() => expect(getColumnFacets).toHaveBeenCalledTimes(1));
        unmount();

        await new Promise(resolve => setTimeout(resolve, 2_500));
        expect(getColumnFacets).toHaveBeenCalledTimes(1);
    }, 10_000);

    test('no request means nothing to wait for', () => {
        const getColumnFacets = jest.fn();
        const { result } = renderFacets(getColumnFacets, undefined);

        expect(result.current.loading).toBe(false);
        expect(result.current.pending).toBe(false);
        expect(getColumnFacets).not.toHaveBeenCalled();
    });
});
