import { ActionURL, Ajax, getServerContext } from '@labkey/api';

import { invalidateLineageResults } from '../internal/components/lineage/actions';
import { clearSelected } from '../internal/actions';
import { invalidateQueryDetailsCache } from '../internal/query/api';
import { SchemaQuery } from '../public/SchemaQuery';

export function onAssayRunChange(schemaName?: string) {
    invalidateLineageResults();
    if (schemaName) {
        clearSelected(`${schemaName}.Runs`, undefined, undefined, undefined, getServerContext().container.id);
    }
}

export function onAssayDesignChange(schemaName: string) {
    onAssayRunChange(schemaName);
    ['Batches', 'Runs', 'Data'].forEach(queryName => {
        invalidateQueryDetailsCache(SchemaQuery.create(schemaName, queryName));
    });
}

const UNEXPECTED_QC_ERROR = 'An unexpected error happened while updating QC state. Please try again.';

export function updateQCState(data) {
    return new Promise((resolve, reject) => {
        Ajax.request({
            jsonData: data,
            url: ActionURL.buildURL('assay', 'updateQCState.api'),
            method: 'POST',
            success: request => {
                const response = JSON.parse(request.responseText);

                if (response.success) {
                    resolve(response);
                    return;
                }

                // What does an error actually look like? Could we extract a better error message from the response?
                reject(UNEXPECTED_QC_ERROR);
            },
            failure: response => {
                const resp = JSON.parse(response.responseText);
                reject(resp?.exception ?? UNEXPECTED_QC_ERROR);
            },
        });
    });
}
