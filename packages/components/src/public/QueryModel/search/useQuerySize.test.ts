/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { act, renderHook, waitFor } from '@testing-library/react';

import { getTestAPIWrapper } from '../../../internal/APIWrapper';
import { getQueryTestAPIWrapper } from '../../../internal/query/APIWrapper';

import { QueryInfo } from '../../QueryInfo';
import { SchemaQuery } from '../../SchemaQuery';
import { LoadingState } from '../../LoadingState';
import { DEFAULT_MAX_COUNT, QueryModel } from '../QueryModel';

import { QuerySizeRequest } from './models';
import { isLargeDataset, useQuerySize } from './useQuerySize';

describe('useQuerySize', () => {
    const REQUEST: QuerySizeRequest = { queryName: 'Samples', schemaName: 'samples' };

    const renderSize = (getQuerySize: jest.Mock, request: QuerySizeRequest) => {
        const api = getTestAPIWrapper(jest.fn, { query: getQueryTestAPIWrapper(jest.fn, { getQuerySize }) });
        return renderHook((props: QuerySizeRequest) => useQuerySize(api, props), { initialProps: request });
    };

    // Well past the hook's own give-up timer, so a reinstated poll would have fired every request it schedules
    // by the time an assertion below counts them
    const settle = async (): Promise<void> => {
        await act(async () => {
            jest.advanceTimersByTime(10_000);
        });
    };

    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('asks once and keeps the answer', async () => {
        const getQuerySize = jest.fn().mockResolvedValue({ largeTable: true });
        const { result } = renderSize(getQuerySize, REQUEST);

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.largeTable).toBe(true);

        await settle();
        expect(getQuerySize).toHaveBeenCalledTimes(1);
    });

    test('a failure is not retried and settles on no answer', async () => {
        const getQuerySize = jest.fn().mockRejectedValue('nope');
        const { result } = renderSize(getQuerySize, REQUEST);

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.largeTable).toBeUndefined();

        await settle();
        expect(getQuerySize).toHaveBeenCalledTimes(1);
    });

    test('an answer about another grid shape is not reported for this one', async () => {
        const getQuerySize = jest.fn().mockResolvedValue({ largeTable: true });
        const { result, rerender } = renderSize(getQuerySize, REQUEST);
        await waitFor(() => expect(result.current.largeTable).toBe(true));

        rerender({ ...REQUEST, queryName: 'Other' });
        expect(result.current.largeTable).toBeUndefined();
        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(getQuerySize).toHaveBeenCalledTimes(2);
    });

    test('stops waiting once the answer is overdue, so the grid count can stand in', async () => {
        // Never resolves, so only the give-up timer can end the wait
        const getQuerySize = jest.fn().mockReturnValue(new Promise(() => undefined));
        const { result } = renderSize(getQuerySize, REQUEST);
        expect(result.current.loading).toBe(true);

        await settle();
        expect(result.current.loading).toBe(false);
        expect(result.current.largeTable).toBeUndefined();
    });

    test('asks nothing without a query', async () => {
        const getQuerySize = jest.fn();
        const { result } = renderSize(getQuerySize, undefined);

        expect(result.current.loading).toBe(false);
        await settle();
        expect(getQuerySize).not.toHaveBeenCalled();
    });
});

describe('isLargeDataset', () => {
    const queryInfo = QueryInfo.fromJsonForTests({ name: 'Samples', schemaName: 'samples' });

    const model = (rowCount: number, includeTotalCount = true): QueryModel =>
        new QueryModel({ id: 'model', schemaQuery: new SchemaQuery('samples', 'Samples') }).mutate({
            includeTotalCount,
            maxCount: DEFAULT_MAX_COUNT,
            queryInfo,
            queryInfoLoadingState: LoadingState.LOADED,
            rowCount,
            totalCountLoadingState: LoadingState.LOADED,
        });

    test('neither count is large', () => {
        expect(isLargeDataset(model(20_000), false)).toBe(false);
    });

    test("the grid's own count alone is enough", () => {
        expect(isLargeDataset(model(DEFAULT_MAX_COUNT), false)).toBe(true);
    });

    test("the server's answer alone is enough, even for a grid filtered under the cap", () => {
        expect(isLargeDataset(model(50_000), true)).toBe(true);
    });

    test("the server's answer is absent until the facts arrive", () => {
        expect(isLargeDataset(model(50_000), undefined)).toBe(false);
    });

    test('a grid that asks for no total count ignores its own count', () => {
        expect(isLargeDataset(model(DEFAULT_MAX_COUNT, false), false)).toBe(false);
        expect(isLargeDataset(model(DEFAULT_MAX_COUNT, false), true)).toBe(true);
    });

    test('a count still loading is not yet large', () => {
        const loading = model(DEFAULT_MAX_COUNT).mutate({ totalCountLoadingState: LoadingState.LOADING });
        expect(isLargeDataset(loading, false)).toBe(false);
    });
});
