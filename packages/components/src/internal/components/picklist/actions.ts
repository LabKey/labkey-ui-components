import { Ajax, Domain, Filter, Utils } from '@labkey/api';

import { List } from 'immutable';

import { deleteRows, insertRows, InsertRowsResponse, selectRows } from '../../query/api';
import { resolveKey, SchemaQuery } from '../../../public/SchemaQuery';
import { getSelected, getSelectedData } from '../../actions';
import { PICKLIST, PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';
import { saveDomain } from '../domainproperties/actions';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { User } from '../base/models/User';
import { buildURL } from '../../url/AppURL';
import { fetchListDesign, getListIdFromDomainId } from '../domainproperties/list/actions';
import { resolveErrorMessage } from '../../util/messaging';
import { SCHEMAS } from '../../../index';

import { PicklistModel } from './models';

export function getPicklists(): Promise<PicklistModel[]> {
    return new Promise((resolve, reject) => {
        const schemaName = SCHEMAS.LIST_METADATA_TABLES.PICKLISTS.schemaName;
        const queryName = SCHEMAS.LIST_METADATA_TABLES.PICKLISTS.queryName;
        selectRows({
            schemaName,
            queryName,
            sort: 'Name',
            filterArray: [Filter.create('Category', null, Filter.Types.NONBLANK)],
        }).then(response => {
            const {models, orderedModels} = response;
            const dataKey = resolveKey(schemaName, queryName);
            const data = models[dataKey];
            const picklists = [];
            orderedModels[dataKey].forEach(id => {
                picklists.push(PicklistModel.create(data[id]));
            });
            resolve(picklists);
        }).catch(reason => {
            console.error(reason);
            reject(reason);
        });
    });
}

export function setPicklistDefaultView(name: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const jsonData = {
            schemaName: 'lists',
            queryName: name,
            views: [
                {
                    columns: [
                        {fieldKey: 'SampleID/Name'},
                        {fieldKey: 'SampleID/LabelColor'},
                        {fieldKey: 'SampleID/SampleSet'},
                        {fieldKey: 'SampleID/StoredAmount'},
                        {fieldKey: 'SampleID/Units'},
                        {fieldKey: 'SampleID/freezeThawCount'},
                        {fieldKey: 'SampleID/StorageStatus'},
                        {fieldKey: 'SampleID/checkedOutBy'},
                        {fieldKey: 'SampleID/Created'},
                        {fieldKey: 'SampleID/CreatedBy'},
                        {fieldKey: 'SampleID/StorageLocation'},
                        { fieldKey: 'SampleID/StorageRow' },
                        { fieldKey: 'SampleID/StorageCol' },
                        { fieldKey: 'SampleID/isAliquot' },
                    ],
                },
            ],
            shared: true,
        };
        return Ajax.request({
            url: buildURL('query', 'saveQueryViews.api'),
            method: 'POST',
            jsonData,
            success: Utils.getCallbackWrapper(response => {
                resolve(response.queryName);
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(
                    'There was a problem creating the default view for the picklist. ' + resolveErrorMessage(response)
                );
            }),
        });
    });
}

export function createPicklist(
    name: string,
    description: string,
    shared: boolean,
    selectionKey: string,
    sampleIds: string[]
): Promise<PicklistModel> {
    return new Promise((resolve, reject) => {
        Domain.create({
            domainDesign: {
                name,
                fields: [
                    {
                        name: 'SampleID',
                        rangeURI: 'int',
                        required: true,
                        lookupSchema: SCHEMAS.INVENTORY.SAMPLE_ITEMS.schemaName,
                        lookupQuery: SCHEMAS.INVENTORY.SAMPLE_ITEMS.queryName,
                    },
                ],
                indices: [
                    {
                        columnNames: ['SampleID'],
                        unique: true,
                    },
                ],
            },
            kind: PICKLIST,
            options: {
                keyName: 'id',
                keyType: 'AutoIncrementInteger',
                description,
                category: shared ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY,
            },
            success: response => {
                Promise.all([
                    getListIdFromDomainId(response.domainId),
                    setPicklistDefaultView(name),
                    addSamplesToPicklist(name, selectionKey, sampleIds),
                ])
                    .then(responses => {
                        const [listId] = responses;
                        resolve(
                            new PicklistModel({
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

export function updatePicklist(picklist: PicklistModel): Promise<PicklistModel> {
    return new Promise((resolve, reject) => {
        fetchListDesign(picklist.listId)
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

export function getPicklistSamples(listName): Promise<Set<string>> {
    return new Promise((resolve, reject) => {
        const schemaName = 'lists';
        selectRows({
            schemaName,
            queryName: listName,
        }).then(response => {
            const {models} = response;
            const dataKey = resolveKey(schemaName, listName);
            resolve(new Set(Object.values(models[dataKey]).map((row: any) => row.SampleID.value.toString())));
        }).catch(reason => {
            console.error(reason);
            reject(reason);
        });
    });
}

export function getSamplesNotInList(listName: string, selectionKey?: string, sampleIds?: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        const newSamples = [];
        getPicklistSamples(listName)
            .then(existingSamples => {
                let rows = List<any>();
                if (selectionKey) {
                    getSelected(selectionKey).then(response => {
                        response.selected.forEach(id => {
                            if (!existingSamples.has(id)) {
                                newSamples.push(id);
                            }
                        });
                        resolve(newSamples);
                    });
                } else {
                    sampleIds.forEach(id => {
                        if (!existingSamples.has(id)) {
                            newSamples.push(id);
                        }
                    });
                    resolve(newSamples);
                }
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            })
        ;
    });
}

export function addSamplesToPicklist(
    listName: string,
    selectionKey?: string,
    sampleIds?: string[]
): Promise<InsertRowsResponse> {
    return new Promise((resolve, reject) => {
        return getSamplesNotInList(listName, selectionKey, sampleIds)
            .then(sampleIdsToAdd => {
                let rows = List<any>();
                sampleIdsToAdd.forEach(id => {
                    rows = rows.push({SampleID: id});
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
                    resolve(new InsertRowsResponse({
                        rows: [],
                        schemaQuery: SchemaQuery.create('lists', listName),
                        error: undefined,
                        transactionAuditId: undefined,
                    }));
                }
            })
            .catch(reason => {
                reject(reason);
            });
    });
}

export interface PicklistDeletionData {
    numDeletable: number;
    numNotDeletable: number;
    numShared: number;
    deletableLists: PicklistModel[];
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
                    const picklist = PicklistModel.create(row.toJS());

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

export function deletePicklists(picklists: PicklistModel[], selectionKey?: string): Promise<any> {
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

export function removeSamplesFromPicklist(picklist: PicklistModel, selectionModel: QueryModel): Promise<number> {
    return new Promise((resolve, reject) => {
        const rows = [];
        selectionModel.selections.forEach((id) => {
            rows.push({id});
        });
        if (rows.length === 0) {
            resolve(0);
        } else {
            deleteRows({
                schemaQuery: selectionModel.schemaQuery,
                rows
            }).then((response) => {
                resolve(response.rows.length);
            }).catch((reason) => {
                reject(reason);
            });
        }
    });

}
