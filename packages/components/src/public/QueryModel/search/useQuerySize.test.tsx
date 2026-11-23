/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useEffect, useMemo } from 'react';
import { act, render, renderHook, waitFor } from '@testing-library/react';

import { ComponentsAPIWrapper, getTestAPIWrapper } from '../../../internal/APIWrapper';
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

    // A consumer reads the hook during render, so the only way to catch a wrong value that a later effect
    // corrects is to record what a child saw in each committed pass. renderHook can't: act() flushes the fix.
    const recordPasses = (getQuerySize: jest.Mock) => {
        const seen: { loading: boolean; queryName: string }[] = [];

        const Child: FC<{ loading: boolean; queryName: string }> = ({ loading, queryName }) => {
            useEffect(() => {
                seen.push({ loading, queryName });
            }, [loading, queryName]);
            return null;
        };

        const Parent: FC<{ api: ComponentsAPIWrapper; queryName: string }> = ({ api, queryName }) => {
            const request = useMemo(() => ({ queryName, schemaName: 'samples' }), [queryName]);
            const { loading } = useQuerySize(api, request);
            return <Child loading={loading} queryName={queryName} />;
        };

        const api = getTestAPIWrapper(jest.fn, { query: getQueryTestAPIWrapper(jest.fn, { getQuerySize }) });
        const { rerender } = render(<Parent api={api} queryName="Samples" />);
        return {
            seen,
            settledFor: (queryName: string) => seen.filter(pass => pass.queryName === queryName && !pass.loading),
            switchTo: (queryName: string) => rerender(<Parent api={api} queryName={queryName} />),
        };
    };

    // The give-up state is the request it applies to, not a flag: a flag set for one request is still set on the
    // first render of the next, which told the panel a brand new query was already settled.
    test('a request that really did time out does not make its replacement look settled', async () => {
        // Never resolves, so this request is legitimately given up on
        const { settledFor, switchTo } = recordPasses(jest.fn().mockReturnValue(new Promise(() => undefined)));
        await settle();
        expect(settledFor('Samples')).not.toEqual([]);

        switchTo('Other');

        expect(settledFor('Other')).toEqual([]);
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

    test("the server's answer alone is enough, even for a grid filtered under the cap", () => {
        expect(isLargeDataset(model(50_000), true)).toBe(true);
        expect(isLargeDataset(model(50_000), undefined)).toBe(false);
    });

    // Accepted behaviour, documented on isLargeDataset: with no server estimate the grid's own count decides
    // alone, so a grid that cannot report one reads as "not large" and pays for the distinct query.
    test('an unknown estimate leaves the decision to the grid, which reads as not large without a count', () => {
        expect(isLargeDataset(model(20_000, false), undefined)).toBe(false);
        expect(isLargeDataset(model(20_000), undefined)).toBe(false);
        expect(isLargeDataset(model(DEFAULT_MAX_COUNT), undefined)).toBe(true);
    });

    test('a count that is absent or still loading cannot make the grid large', () => {
        expect(isLargeDataset(model(DEFAULT_MAX_COUNT, false), false)).toBe(false);
        const loading = model(DEFAULT_MAX_COUNT).mutate({ totalCountLoadingState: LoadingState.LOADING });
        expect(isLargeDataset(loading, false)).toBe(false);
    });
});
