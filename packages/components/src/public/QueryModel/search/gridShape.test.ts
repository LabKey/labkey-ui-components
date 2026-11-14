/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { renderHook } from '@testing-library/react';
import { Filter } from '@labkey/api';

import { QueryInfo } from '../../QueryInfo';
import { SchemaQuery } from '../../SchemaQuery';
import { LoadingState } from '../../LoadingState';
import { DEFAULT_MAX_COUNT, QueryModel } from '../QueryModel';

import { getGridShapeRequest, isLargeGrid, useGridShapeRequest } from './gridShape';

describe('isLargeGrid', () => {
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
        expect(isLargeGrid(model(20_000), false)).toBe(false);
    });

    test("the grid's own count alone is enough", () => {
        expect(isLargeGrid(model(DEFAULT_MAX_COUNT), false)).toBe(true);
    });

    test("the server's answer alone is enough, even for a grid filtered under the cap", () => {
        expect(isLargeGrid(model(50_000), true)).toBe(true);
    });

    test("the server's answer is absent until the facts arrive", () => {
        expect(isLargeGrid(model(50_000), undefined)).toBe(false);
    });

    test('a grid that asks for no total count ignores its own count', () => {
        expect(isLargeGrid(model(DEFAULT_MAX_COUNT, false), false)).toBe(false);
        expect(isLargeGrid(model(DEFAULT_MAX_COUNT, false), true)).toBe(true);
    });

    test('a count still loading is not yet large', () => {
        const loading = model(DEFAULT_MAX_COUNT).mutate({ totalCountLoadingState: LoadingState.LOADING });
        expect(isLargeGrid(loading, false)).toBe(false);
    });
});

describe('getGridShapeRequest', () => {
    // The default view carries a filter, so the two scopes describe different rows
    const queryInfo = QueryInfo.fromJsonForTests(
        {
            name: 'Samples',
            schemaName: 'samples',
            views: [{ name: '', default: true, filter: [{ fieldKey: 'Status', value: 'Available', op: 'eq' }] }],
        },
        true
    );

    const model = new QueryModel({ id: 'model', schemaQuery: new SchemaQuery('samples', 'Samples') }).mutate({
        baseFilters: [Filter.create('Type', 'Blood')],
        queryInfo,
        queryInfoLoadingState: LoadingState.LOADED,
    });

    const columnNames = (scope: 'base' | 'model'): string[] =>
        getGridShapeRequest(model, scope).filters.map(filter => filter.getColumnName());

    test("'base' leaves the view's filters out", () => {
        expect(columnNames('base')).toEqual(['Type']);
    });

    test("'model' includes the view's filters", () => {
        expect(columnNames('model')).toEqual(['Type', 'Status']);
    });
});

describe('useGridShapeRequest', () => {
    const queryInfo = QueryInfo.fromJsonForTests({ name: 'Samples', schemaName: 'samples' });
    const model = new QueryModel({ id: 'model', schemaQuery: new SchemaQuery('samples', 'Samples') }).mutate({
        baseFilters: [Filter.create('Type', 'Blood')],
        queryInfo,
        queryInfoLoadingState: LoadingState.LOADED,
    });

    const render = (initial: QueryModel) =>
        renderHook(({ m }: { m: QueryModel }) => useGridShapeRequest(m, 'model'), { initialProps: { m: initial } });

    // useColumnFacets keys its effect on this object's identity, so a request rebuilt per render loops it forever
    test('keeps its identity across a model update that leaves the grid shape alone', () => {
        const { result, rerender } = render(model);
        const first = result.current;

        rerender({ m: model.mutate({ rowCount: 42 }) });

        expect(result.current).toBe(first);
    });

    test('rebuilds when the grid shape changes', () => {
        const { result, rerender } = render(model);
        const first = result.current;

        rerender({ m: model.mutate({ baseFilters: [Filter.create('Type', 'Plasma')] }) });

        expect(result.current).not.toBe(first);
        expect(result.current.filters.map(filter => filter.getURLParameterValue())).toEqual(['Plasma']);
    });
});
