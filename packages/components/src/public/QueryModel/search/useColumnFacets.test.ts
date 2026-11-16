/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { act, renderHook, waitFor } from '@testing-library/react';

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
        return renderHook((props: ColumnFacetsRequest) => useColumnFacets(api, props), { initialProps: request });
    };

    const response = (complete: boolean): ColumnFacetsResponse => ({ columns: [FACET], complete, largeTable: false });

    // Past the last delay of the poll schedule this hook used to run ([500, 1500, 3000]), so a reinstated poll
    // would have fired every one of its requests by the time an assertion below counts them
    const settle = async (): Promise<void> => {
        await act(async () => {
            jest.advanceTimersByTime(10_000);
        });
    };

    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('asks once and keeps what came back', async () => {
        const getColumnFacets = jest.fn().mockResolvedValue(response(true));
        const { result } = renderFacets(getColumnFacets, REQUEST);

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(getColumnFacets).toHaveBeenCalledTimes(1);
        expect(result.current.facets.name).toEqual(FACET);
    });

    test('an unfinished answer is not asked for again', async () => {
        const getColumnFacets = jest.fn().mockResolvedValue(response(false));
        const { result } = renderFacets(getColumnFacets, REQUEST);

        // Facts the server couldn't finish inside its budget finish into its cache for a later request; this caller
        // takes what arrived and leaves the rest to the ordinary query
        await waitFor(() => expect(result.current.loading).toBe(false));
        await settle();

        expect(getColumnFacets).toHaveBeenCalledTimes(1);
        expect(result.current.facets.name).toEqual(FACET);
    });

    test('the answer settles largeTable', async () => {
        const getColumnFacets = jest.fn().mockResolvedValue({ columns: [], complete: false, largeTable: true });
        const { result } = renderFacets(getColumnFacets, REQUEST);

        expect(result.current.loading).toBe(true);
        expect(result.current.largeTable).toBeUndefined();

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.largeTable).toBe(true);
        expect(getColumnFacets).toHaveBeenCalledTimes(1);
    });

    test('a failed request stops waiting at once and is not retried', async () => {
        const getColumnFacets = jest.fn().mockRejectedValue(new Error('nope'));
        const { result } = renderFacets(getColumnFacets, REQUEST);

        await waitFor(() => expect(result.current.loading).toBe(false));
        await settle();

        expect(getColumnFacets).toHaveBeenCalledTimes(1);
        expect(result.current.facets).toEqual({});
    });

    test("a failure on a new grid shape drops the previous shape's facts", async () => {
        const getColumnFacets = jest.fn().mockResolvedValueOnce(response(true)).mockRejectedValue(new Error('nope'));
        const { rerender, result } = renderFacets(getColumnFacets, REQUEST);

        await waitFor(() => expect(result.current.facets.name).toEqual(FACET));

        // A different grid: its columns may be named the same but describe other rows
        rerender({ columns: ['Name'], queryName: 'Other', schemaName: 'samples' });

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.facets).toEqual({});
        expect(result.current.largeTable).toBeUndefined();
    });

    // Proves the answer is discarded without error and nothing is re-asked. React 18 makes a setState after
    // unmount a silent no-op, so the cancelled guard itself cannot be observed from out here.
    test('an answer that arrives after unmount is discarded', async () => {
        let deliver: (value: ColumnFacetsResponse) => void;
        const getColumnFacets = jest.fn().mockReturnValue(
            new Promise<ColumnFacetsResponse>(resolve => {
                deliver = resolve;
            })
        );
        const { result, unmount } = renderFacets(getColumnFacets, REQUEST);

        // Still in flight, so unmounting below interrupts a real request rather than a settled one
        expect(getColumnFacets).toHaveBeenCalledTimes(1);
        expect(result.current.loading).toBe(true);

        unmount();
        await act(async () => {
            deliver(response(true));
        });
        await settle();

        expect(getColumnFacets).toHaveBeenCalledTimes(1);
    });

    test('stops waiting on an answer that never arrives', async () => {
        // A hung request would otherwise leave every caller on a spinner with no way out
        const getColumnFacets = jest.fn().mockReturnValue(new Promise<ColumnFacetsResponse>(() => undefined));
        const { result } = renderFacets(getColumnFacets, REQUEST);

        expect(result.current.loading).toBe(true);

        await act(async () => {
            jest.advanceTimersByTime(2_000);
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.facets).toEqual({});
        expect(result.current.largeTable).toBeUndefined();
    });

    test('no request means nothing to wait for', () => {
        const getColumnFacets = jest.fn();
        const { result } = renderFacets(getColumnFacets, undefined);

        expect(result.current.loading).toBe(false);
        expect(getColumnFacets).not.toHaveBeenCalled();
    });
});
