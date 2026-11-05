/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { QueryInfo } from '../../QueryInfo';
import { SchemaQuery } from '../../SchemaQuery';
import { LoadingState } from '../../LoadingState';
import { DEFAULT_MAX_COUNT, QueryModel } from '../QueryModel';

import { isLargeGrid } from './gridShape';

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
