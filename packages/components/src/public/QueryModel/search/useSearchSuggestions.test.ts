/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Filter, Query } from '@labkey/api';

import { QueryInfo } from '../../QueryInfo';
import { SchemaQuery } from '../../SchemaQuery';
import { LoadingState } from '../../LoadingState';
import { QueryModel } from '../QueryModel';

import { getFilterSuggestionsRequest } from './useSearchSuggestions';

describe('getFilterSuggestionsRequest', () => {
    const queryInfo = QueryInfo.fromJsonForTests({ name: 'ItemSamples', schemaName: 'inventory' });

    test('sends the base filters but not the user filters', () => {
        const baseFilters = [Filter.create('BoxId', 1)];
        const model = new QueryModel({
            baseFilters,
            id: 'model',
            schemaQuery: new SchemaQuery('inventory', 'ItemSamples'),
        }).mutate({
            filterArray: [Filter.create('StorageStatus', 'In storage')],
            queryInfo,
            queryInfoLoadingState: LoadingState.LOADED,
        });

        expect(getFilterSuggestionsRequest(model, 'mL').filters).toEqual(baseFilters);
    });

    test("keeps the model's container filter", () => {
        const model = new QueryModel({
            containerFilter: Query.ContainerFilter.currentAndSubfolders,
            id: 'model',
            schemaQuery: new SchemaQuery('inventory', 'ItemSamples'),
        }).mutate({ queryInfo, queryInfoLoadingState: LoadingState.LOADED });

        const request = getFilterSuggestionsRequest(model, 'mL');
        expect(request.containerFilter).toBe(Query.ContainerFilter.currentAndSubfolders);
        expect(request.filters).toEqual([]);
    });
});
