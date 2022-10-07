import { ActionURL, Ajax, Filter, Query, Utils } from '@labkey/api';

import { SchemaQuery } from '../public/SchemaQuery';
import { QueryInfo } from '../public/QueryInfo';
import { getQueryDetails, selectDistinctRows, selectRowsDeprecated } from '../internal/query/api';
import { downloadAttachment, findMissingValues } from '../internal/util/utils';
import { getSampleTypeDetails } from '../internal/components/samples/actions';
import { SCHEMAS } from '../internal/schemas';
import { resolveErrorMessage } from '../internal/util/messaging';
import { SAMPLE_ID_FIND_FIELD, UNIQUE_ID_FIND_FIELD } from '../internal/components/samples/constants';

export const downloadSampleTypeTemplate = (
    schemaQuery: SchemaQuery,
    getUrl: (queryInfo: QueryInfo, importAliases: Record<string, string>, excludeColumns?: string[]) => string,
    excludeColumns?: string[]
): void => {
    const promises = [];
    promises.push(
        getQueryDetails({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
        })
    );
    promises.push(getSampleTypeDetails(schemaQuery));
    Promise.all(promises)
        .then(results => {
            const [queryInfo, domainDetails] = results;
            downloadAttachment(getUrl(queryInfo, domainDetails.options?.get('importAliases'), excludeColumns), true);
        })
        .catch(reason => {
            console.error('Unable to download sample type template', reason);
        });
};

export function getSampleTypes(includeMedia?: boolean): Promise<Array<{ id: number; label: string }>> {
    return new Promise((resolve, reject) => {
        selectRowsDeprecated({
            schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
            queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
            sort: 'Name',
            filterArray: includeMedia ? undefined : [Filter.create('Category', 'media', Filter.Types.NEQ_OR_NULL)],
            containerFilter: Query.containerFilter.currentPlusProjectAndShared,
        })
            .then(response => {
                const { key, models, orderedModels } = response;
                const sampleTypeOptions = [];
                orderedModels[key].forEach(row => {
                    const data = models[key][row];
                    sampleTypeOptions.push({ id: data.RowId.value, label: data.Name.value });
                });
                resolve(sampleTypeOptions);
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

async function getSamplesIdsNotFound(queryName: string, orderedIds: string[]): Promise<string[]> {
    // Not try/caught as caller is expected to handle errors
    const result = await selectDistinctRows({
        column: 'Ordinal',
        queryName,
        schemaName: SCHEMAS.EXP_TABLES.SCHEMA,
        sort: 'Ordinal',
    });

    // find the gaps in the ordinals values as these correspond to ids we could not find
    return findMissingValues(result.values, orderedIds);
}

export function getFindSamplesByIdData(
    sessionKey: string
): Promise<{ ids: string[]; missingIds?: { [key: string]: string[] }; queryName: string }> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('experiment', 'saveOrderedSamplesQuery.api'),
            method: 'POST',
            jsonData: {
                sessionKey,
            },
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    const { queryName, ids } = response.data;
                    getSamplesIdsNotFound(queryName, ids)
                        .then(notFound => {
                            const missingIds = {
                                [UNIQUE_ID_FIND_FIELD.label]: notFound
                                    .filter(id => id.startsWith(UNIQUE_ID_FIND_FIELD.storageKeyPrefix))
                                    .map(id => id.substring(UNIQUE_ID_FIND_FIELD.storageKeyPrefix.length)),
                                [SAMPLE_ID_FIND_FIELD.label]: notFound
                                    .filter(id => id.startsWith(SAMPLE_ID_FIND_FIELD.storageKeyPrefix))
                                    .map(id => id.substring(SAMPLE_ID_FIND_FIELD.storageKeyPrefix.length)),
                            };
                            resolve({
                                queryName,
                                ids,
                                missingIds,
                            });
                        })
                        .catch(reason => {
                            console.error('Problem retrieving data about samples not found', reason);
                            resolve({
                                queryName,
                                ids,
                            });
                        });
                } else {
                    console.error('Unable to create session query');
                    reject('There was a problem retrieving the samples. Your session may have expired.');
                }
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error('There was a problem creating the query for the samples.', error);
                reject(
                    "There was a problem retrieving the samples. Please try again using the 'Find Samples' option from the Search menu."
                );
            }),
        });
    });
}
