/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ActionURL } from '@labkey/api';

import { request } from '../../../internal/request';

import {
    ColumnFacetsRequest,
    ColumnFacetsResponse,
    FilterSuggestionsRequest,
    FilterSuggestionsResponse,
} from './models';

function toJsonData(options: ColumnFacetsRequest | FilterSuggestionsRequest): Record<string, any> {
    const { filters, ...rest } = options;
    const jsonData: Record<string, any> = { ...rest };
    // goes in the URL, not the body
    delete jsonData.containerPath;

    if (filters?.length) {
        jsonData.filters = filters.map(filter => ({
            fieldKey: filter.getColumnName(),
            op: filter.getFilterType().getURLSuffix(),
            value: String(filter.getURLParameterValue() ?? ''),
        }));
    }

    return jsonData;
}

export async function getFilterSuggestions(options: FilterSuggestionsRequest): Promise<FilterSuggestionsResponse> {
    const { containerPath } = options;
    const jsonData = toJsonData(options);

    const response = await request<Partial<FilterSuggestionsResponse>>({
        url: ActionURL.buildURL('query', 'getFilterSuggestions.api', containerPath),
        method: 'POST',
        jsonData,
        errorLogMsg: 'Unable to load search suggestions',
    });

    return { complete: response.complete ?? true, suggestions: response.suggestions ?? [] };
}

export async function getColumnFacets(options: ColumnFacetsRequest): Promise<ColumnFacetsResponse> {
    const { containerPath } = options;

    const response = await request<Partial<ColumnFacetsResponse>>({
        url: ActionURL.buildURL('query', 'getColumnFacets.api', containerPath),
        method: 'POST',
        jsonData: toJsonData(options),
        errorLogMsg: 'Unable to load column facets',
    });

    return {
        columns: response.columns ?? [],
        complete: response.complete ?? true,
        largeTable: !!response.largeTable,
    };
}
