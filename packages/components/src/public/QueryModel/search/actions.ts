/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ActionURL } from '@labkey/api';

import { request } from '../../../internal/request';

import { FilterSuggestionsRequest, FilterSuggestionsResponse } from './models';

export async function getFilterSuggestions(options: FilterSuggestionsRequest): Promise<FilterSuggestionsResponse> {
    const { containerPath, filters, ...rest } = options;
    const jsonData: Record<string, any> = { ...rest };

    if (filters?.length) {
        jsonData.filters = filters.map(filter => ({
            fieldKey: filter.getColumnName(),
            op: filter.getFilterType().getURLSuffix(),
            value: String(filter.getURLParameterValue() ?? ''),
        }));
    }

    const response = await request<Partial<FilterSuggestionsResponse>>({
        url: ActionURL.buildURL('query', 'getFilterSuggestions.api', containerPath),
        method: 'POST',
        jsonData,
        errorLogMsg: 'Unable to load search suggestions',
    });

    return { complete: response.complete ?? true, suggestions: response.suggestions ?? [] };
}
