import { Ajax, Domain, Filter, Query, Utils } from '@labkey/api';

import { List } from 'immutable';

import { deleteRows, insertRows, InsertRowsResponse, selectRowsDeprecated } from '../../query/api';
import { resolveKey, SchemaQuery } from '../../../public/SchemaQuery';
import { getSelected, getSelectedData, setSnapshotSelections } from '../../actions';
import { PICKLIST, PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';
import { saveDomain } from '../domainproperties/actions';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { User } from '../base/models/User';
import { AppURL, buildURL, createProductUrlFromParts } from '../../url/AppURL';
import { fetchListDesign, getListIdFromDomainId } from '../domainproperties/list/actions';

import { PICKLIST_KEY } from '../../app/constants';

import { isProductProjectsEnabled } from '../../app/utils';

import { Picklist, PICKLIST_KEY_COLUMN, PICKLIST_SAMPLE_ID_COLUMN } from './models';
import { SCHEMAS } from '../../schemas';
import { OperationConfirmationData } from '../entities/models';
import { caseInsensitive } from '../../util/utils';

export function getPicklistsForInsert(): Promise<Picklist[]> {
    return new Promise((resolve, reject) => {
        const { queryName, schemaName } = SCHEMAS.LIST_METADATA_TABLES.PICKLISTS;
        selectRowsDeprecated({
            containerFilter: isProductProjectsEnabled() ? Query.ContainerFilter.current : undefined,
            schemaName,
            queryName,
            sort: 'Name',
            filterArray: [Filter.create('Category', null, Filter.Types.NONBLANK)],
        })
            .then(response => {
                const { models, orderedModels } = response;
                const dataKey = resolveKey(schemaName, queryName);
                const data = models[dataKey];
                const picklists = [];
                orderedModels[dataKey].forEach(id => {
                    picklists.push(Picklist.create(data[id]));
                });
                resolve(picklists);
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export function createPicklist(
    name: string,
    description: string,
    shared: boolean,
    statusData: OperationConfirmationData,
    selectionKey: string,
    sampleIds: string[]
): Promise<Picklist> {
    return new Promise((resolve, reject) => {
        Domain.create({
            domainDesign: {
                name,
                fields: [
                    {
                        name: PICKLIST_SAMPLE_ID_COLUMN,
                        rangeURI: 'int',
                        required: true,
                        lookupSchema: SCHEMAS.INVENTORY.SAMPLE_ITEMS.schemaName,
                        lookupQuery: SCHEMAS.INVENTORY.SAMPLE_ITEMS.queryName,
                    },
                ],
                indices: [
                    {
                        columnNames: [PICKLIST_SAMPLE_ID_COLUMN],
                        unique: true,
                    },
                ],
            },
            kind: PICKLIST,
            options: {
                keyName: PICKLIST_KEY_COLUMN,
                keyType: 'AutoIncrementInteger',
                description,
                category: shared ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY,
            },
            success: response => {
                Promise.all([
                    getListIdFromDomainId(response.domainId),
                    addSamplesToPicklist(name, statusData, selectionKey, sampleIds),
                ])
                    .then(responses => {
                        const [listId] = responses;
                        resolve(
                            new Picklist({
                                Container: response.container,
                                listId,
                                name,
                                Description: description,
                                Category: shared ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY,
                            })
                        );
                    })
                    .catch(error => {
                        reject(error);
                    });
            },
            failure: err => {
                reject(err);
            },
        });
    });
}

export function updatePicklist(picklist: Picklist): Promise<Picklist> {
    return new Promise((resolve, reject) => {
        fetchListDesign(picklist.listId, picklist.Container)
            .then(listDesign => {
                const domain = listDesign.domain;
                const options = {
                    domainId: domain.domainId,
                    name: picklist.name,
                    keyName: 'id',
                    keyType: 'AutoIncrementInteger',
                    description: picklist.Description,
                    category: picklist.Category,
                };
                saveDomain(domain, PICKLIST, options, picklist.name)
                    .then(savedDomain => {
                        resolve(picklist);
                    })
                    .catch(errorDomain => {
                        console.error(errorDomain.domainException);
                        reject(errorDomain.domainException);
                    });
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export interface SampleTypeCount {
    ItemCount: number;
    LabelColor: string;
    SampleType: string;
}

export function getPicklistCountsBySampleType(listName: string): Promise<SampleTypeCount[]> {
    return new Promise(async (resolve, reject) => {
        try {
            const { key, models, orderedModels } = await selectRowsDeprecated({
                schemaName: SCHEMAS.PICKLIST_TABLES.SCHEMA,
                queryName: listName,
                sql: [
                    'SELECT COUNT(*) as ItemCount,',
                    'SampleId.SampleSet.Name AS SampleType,',
                    'SampleId.LabelColor',
                    `FROM ${SCHEMAS.PICKLIST_TABLES.SCHEMA}."${listName}"`,
                    'GROUP BY SampleId.SampleSet.Name, SampleId.LabelColor',
                    'ORDER BY SampleId.SampleSet.Name',
                ].join('\n'),
            });

            const counts = orderedModels[key]
                .map(idx => models[key][idx])
                .map(row => ({
                    ItemCount: row.ItemCount.value,
                    LabelColor: row.LabelColor.value,
                    SampleType: row.SampleType.value,
                }))
                .toArray();

            resolve(counts);
        } catch (e) {
            console.error('Failed to get picklist counts by sample type', e);
            reject(e);
        }
    });
}

export function getPicklistSamples(listName: string): Promise<Set<string>> {
    return new Promise((resolve, reject) => {
        const schemaName = SCHEMAS.PICKLIST_TABLES.SCHEMA;
        selectRowsDeprecated({
            schemaName,
            queryName: listName,
        })
            .then(response => {
                const { models } = response;
                const dataKey = resolveKey(schemaName, listName);
                resolve(new Set(Object.values(models[dataKey]).map((row: any) => row.SampleID.value.toString())));
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export function getSelectedPicklistSamples(
    picklistName: string,
    selectedIds: string[],
    saveSnapshot?: boolean,
    selectionKey?: string
): Promise<number[]> {
    return new Promise((resolve, reject) => {
        getSelectedData(
            SCHEMAS.PICKLIST_TABLES.SCHEMA,
            picklistName,
            selectedIds,
            [PICKLIST_SAMPLE_ID_COLUMN, PICKLIST_KEY_COLUMN].join(','),
            undefined,
            undefined,
            PICKLIST_KEY_COLUMN
        )
            .then(response => {
                const { data } = response;
                const sampleIds = [];
                const rowIds = [];
                data.forEach(row => {
                    sampleIds.push(row.getIn([PICKLIST_SAMPLE_ID_COLUMN, 'value']));
                    if (saveSnapshot) {
                        rowIds.push(row.getIn([PICKLIST_KEY_COLUMN, 'value']));
                    }
                });
                if (saveSnapshot) {
                    setSnapshotSelections(selectionKey, rowIds);
                }
                resolve(sampleIds);
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export function getSamplesNotInList(listName: string, selectionKey?: string, sampleIds?: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        getPicklistSamples(listName)
            .then(existingSamples => {
                if (sampleIds) {
                    resolve(sampleIds.filter(id => !existingSamples.has(id.toString())));
                } else if (selectionKey) {
                    getSelected(selectionKey).then(response => {
                        resolve(response.selected.filter(id => !existingSamples.has(id.toString())));
                    });
                } else {
                    resolve([]);
                }
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export function addSamplesToPicklist(
    listName: string,
    statusData: OperationConfirmationData,
    selectionKey?: string,
    sampleIds?: string[]
): Promise<InsertRowsResponse> {
    return new Promise((resolve, reject) => {
        return getSamplesNotInList(listName, selectionKey, sampleIds)
            .then(sampleIdsToAdd => {
                let rows = List<any>();
                sampleIdsToAdd.forEach(id => {
                    if (statusData.isIdAllowed(id)) {
                        rows = rows.push({ SampleID: id });
                    }
                });
                if (rows.size > 0) {
                    insertRows({
                        schemaQuery: SchemaQuery.create('lists', listName),
                        rows,
                    })
                        .then(response => {
                            resolve(response);
                        })
                        .catch(reason => reject(reason));
                } else {
                    resolve(
                        new InsertRowsResponse({
                            rows: [],
                            schemaQuery: SchemaQuery.create('lists', listName),
                            error: undefined,
                            transactionAuditId: undefined,
                        })
                    );
                }
            })
            .catch(reason => {
                reject(reason);
            });
    });
}

export interface PicklistDeletionData {
    deletableLists: Picklist[];
    numDeletable: number;
    numNotDeletable: number;
    numShared: number;
}

export function getPicklistDeleteData(model: QueryModel, user: User): Promise<PicklistDeletionData> {
    return new Promise((resolve, reject) => {
        const columnString = 'Name,listId,category,createdBy';
        getSelectedData(
            model.schemaName,
            model.queryName,
            [...model.selections],
            columnString,
            undefined,
            undefined,
            'ListId'
        )
            .then(response => {
                const { data } = response;
                let numNotDeletable = 0;
                let numShared = 0;
                const deletableLists = [];
                data.valueSeq().forEach(row => {
                    const picklist = Picklist.create(row.toJS());

                    if (picklist.isDeletable(user)) {
                        if (picklist.isPublic()) {
                            numShared++;
                        }
                        deletableLists.push(picklist);
                    } else {
                        numNotDeletable++;
                    }
                });
                resolve({
                    numDeletable: deletableLists.length,
                    numNotDeletable,
                    numShared,
                    deletableLists,
                });
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export function deletePicklists(picklists: Picklist[], selectionKey?: string): Promise<any> {
    return new Promise((resolve, reject) => {
        let params;
        if (picklists.length === 1) {
            params = {
                listId: picklists[0].listId,
            };
        } else if (selectionKey) {
            params = {
                dataRegionSelectionKey: selectionKey,
            };
        } else {
            const listIds = [];
            picklists.forEach(picklist => {
                listIds.push(picklist.listId);
            });
            params = {
                listIds,
            };
        }
        return Ajax.request({
            url: buildURL('list', 'deleteListDefinition.api'),
            method: 'POST',
            params,
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(response);
            }),
        });
    });
}

export const removeSamplesFromPicklist = async (picklist: Picklist, selectionModel: QueryModel): Promise<number> => {
    const rows = [];
    let selectedIds = selectionModel.selections;

    // if the model is for the sample type, query to get the relevant list keys to delete.
    if (selectionModel.schemaName === SCHEMAS.SAMPLE_SETS.SCHEMA) {
        const listResponse = await selectRowsDeprecated({
            schemaName: SCHEMAS.PICKLIST_TABLES.SCHEMA,
            queryName: picklist.name,
            filterArray: [Filter.create('SampleID', [...selectionModel.selections], Filter.Types.IN)],
        });
        selectedIds = listResponse.orderedModels[listResponse.key].toJS();
    }

    selectedIds.forEach(id => {
        rows.push({ id });
    });

    return new Promise((resolve, reject) => {
        if (rows.length === 0) {
            resolve(0);
        } else {
            deleteRows({
                schemaQuery: SchemaQuery.create(SCHEMAS.PICKLIST_TABLES.SCHEMA, picklist.name),
                rows,
            })
                .then(response => {
                    resolve(response.rows.length);
                })
                .catch(reason => {
                    reject(reason);
                });
        }
    });
};

export function getPicklistUrl(listId: number, picklistProductId?: string, currentProductId?: string): string {
    let picklistUrl: string = AppURL.create(PICKLIST_KEY, listId).toHref();
    if (currentProductId && picklistProductId) {
        const url = createProductUrlFromParts(picklistProductId, currentProductId, {}, PICKLIST_KEY, listId);
        picklistUrl = url instanceof AppURL ? url.toHref() : url;
    }

    return picklistUrl;
}

export const getPicklistFromId = async (listId: number, loadSampleTypes = true): Promise<Picklist> => {
    const listData = await selectRowsDeprecated({
        containerFilter: getPicklistListingContainerFilter(),
        schemaName: SCHEMAS.LIST_METADATA_TABLES.PICKLISTS.schemaName,
        queryName: SCHEMAS.LIST_METADATA_TABLES.PICKLISTS.queryName,
        requiredColumns: ['Category'],
        filterArray: [Filter.create('listId', listId)],
    });
    const listRow = listData.models[listData.key][listId];
    if (!listRow) return new Picklist(/* use empty picklist to signal not found */);
    let picklist = Picklist.create(listRow);

    if (loadSampleTypes) {
        const listSampleTypeData = await selectRowsDeprecated({
            schemaName: SCHEMAS.PICKLIST_TABLES.SCHEMA,
            sql: `SELECT DISTINCT SampleID.SampleSet, SampleID.SampleSet.Category FROM "${picklist.name}" WHERE SampleID.SampleSet IS NOT NULL`,
        });

        picklist = picklist.mutate({
            sampleTypes: Object.values(listSampleTypeData.models[listSampleTypeData.key])
                .map(row => caseInsensitive(row, 'SampleSet')?.displayValue)
                .filter(value => !!value),
        });
        picklist = picklist.mutate({
            hasMedia: !!Object.values(listSampleTypeData.models[listSampleTypeData.key])
                .find(row => caseInsensitive(row, 'Category')?.value === 'media')
        });

    }

    return picklist;
};

export function getPicklistListingContainerFilter(): Query.ContainerFilter {
    return isProductProjectsEnabled() ? Query.ContainerFilter.current : undefined;
}
