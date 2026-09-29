/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ActionURL, Ajax, Utils } from '@labkey/api';

import { handleRequestFailure } from '../../../internal/request';

import { FilterSuggestionsRequest, FilterSuggestionsResponse } from './models';

export function fetchFilterSuggestions(
    request: FilterSuggestionsRequest,
    ajaxRequest = Ajax.request
): Promise<FilterSuggestionsResponse> {
    const { containerPath, ...jsonData } = request;
    return new Promise((resolve, reject) => {
        ajaxRequest({
            url: ActionURL.buildURL('query', 'getFilterSuggestions.api', containerPath),
            method: 'POST',
            jsonData,
            success: Utils.getCallbackWrapper((response: FilterSuggestionsResponse) => {
                resolve({
                    complete: response.complete ?? true,
                    suggestions: response.suggestions ?? [],
                });
            }),
            // useSearchSuggestions logs the failure
            failure: handleRequestFailure(reject),
        });
    });
}
