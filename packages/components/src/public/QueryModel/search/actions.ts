/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ActionURL } from '@labkey/api';

import { request } from '../../../internal/request';

import {
    FilterSuggestionsRequest,
    FilterSuggestionsResponse,
    GridShapeRequest,
    QuerySizeRequest,
    QuerySizeResponse,
} from './models';

function toJsonData(options: FilterSuggestionsRequest | GridShapeRequest): Record<string, any> {
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

export async function getQuerySize(options: QuerySizeRequest): Promise<QuerySizeResponse> {
    const { containerPath, queryName, schemaName } = options;

    const response = await request<Partial<QuerySizeResponse>>({
        url: ActionURL.buildURL('query', 'getQuerySize.api', containerPath),
        method: 'POST',
        jsonData: { queryName, schemaName },
        errorLogMsg: 'Unable to load the query size',
    });

    return { largeTable: !!response.largeTable };
}
