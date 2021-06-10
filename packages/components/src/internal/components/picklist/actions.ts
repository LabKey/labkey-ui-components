import { Ajax, Domain, Filter, Query, Utils } from '@labkey/api';

import { List } from 'immutable';

import { deleteRows, insertRows, InsertRowsResponse, selectRows } from '../../query/api';
import { resolveKey, SchemaQuery } from '../../../public/SchemaQuery';
import { getSelected, getSelectedData, setSnapshotSelections } from '../../actions';
import { PICKLIST, PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';
import { saveDomain } from '../domainproperties/actions';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { User } from '../base/models/User';
import { AppURL, buildURL, createProductUrlFromParts } from '../../url/AppURL';
import { fetchListDesign, getListIdFromDomainId } from '../domainproperties/list/actions';
import { resolveErrorMessage } from '../../util/messaging';
import { SCHEMAS } from '../../../index';

import { Picklist, PICKLIST_KEY_COLUMN, PICKLIST_SAMPLE_ID_COLUMN } from './models';
import { PICKLIST_KEY } from "../../app/constants";

export function getPicklists(): Promise<Picklist[]> {
    return new Promise((resolve, reject) => {
        const schemaName = SCHEMAS.LIST_METADATA_TABLES.PICKLISTS.schemaName;
        const queryName = SCHEMAS.LIST_METADATA_TABLES.PICKLISTS.queryName;
        selectRows({
            schemaName,
            queryName,
            sort: 'Name',
            filterArray: [Filter.create('Category', null, Filter.Types.NONBLANK)],
        })
            .then(response => {
                const {models, orderedModels} = response;
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
                        {fieldKey: 'SampleID/StorageRow'},
                        {fieldKey: 'SampleID/StorageCol'},
                        {fieldKey: 'SampleID/isAliquot'},
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
                    setPicklistDefaultView(name),
                    addSamplesToPicklist(name, selectionKey, sampleIds),
                ])
                    .then(responses => {
                        const [listId] = responses;
                        resolve(
                            new Picklist({
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

export interface SampleTypeCount {
    ItemCount: number;
    SampleType: string;
    LabelColor: string;
}

export function getPicklistCountsBySampleType(listName: string): Promise<SampleTypeCount[]> {
    return new Promise((resolve, reject) => {
        Query.executeSql({
            sql:
                'SELECT COUNT(*) as ItemCount, \n' +
                '       SampleId.SampleSet.Name AS SampleType, \n' +
                '       SampleId.LabelColor\n' +
                'FROM lists."' +
                listName +
                '"\n' +
                'GROUP BY SampleId.SampleSet.Name, SampleId.LabelColor\n' +
                'ORDER BY SampleId.SampleSet.Name',
            schemaName: SCHEMAS.PICKLIST_TABLES.SCHEMA,
            success: data => {
                resolve(data.rows);
            },
            failure: reason => {
                console.error(reason);
                reject(reason);
            },
        });
    });
}

export function getPicklistSamples(listName: string): Promise<Set<string>> {
    return new Promise((resolve, reject) => {
        const schemaName = SCHEMAS.PICKLIST_TABLES.SCHEMA;
        selectRows({
            schemaName,
            queryName: listName,
        })
            .then(response => {
                const {models} = response;
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
                const {data} = response;
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
                if (selectionKey) {
                    getSelected(selectionKey).then(response => {
                        resolve(response.selected.filter(id => !existingSamples.has(id.toString())));
                    });
                } else if (sampleIds) {
                    resolve(sampleIds.filter(id => !existingSamples.has(id.toString())));
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
    numDeletable: number;
    numNotDeletable: number;
    numShared: number;
    deletableLists: Picklist[];
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

export function removeSamplesFromPicklist(picklist: Picklist, selectionModel: QueryModel): Promise<number> {
    return new Promise((resolve, reject) => {
        const rows = [];
        selectionModel.selections.forEach(id => {
            rows.push({id});
        });
        if (rows.length === 0) {
            resolve(0);
        } else {
            deleteRows({
                schemaQuery: selectionModel.schemaQuery,
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
}

export function getPicklistUrl(listId: number, picklistProductId?: string, currentProductId?: string) : string {
    let picklistUrl : string = AppURL.create(PICKLIST_KEY, listId).toHref();
    if (currentProductId && picklistProductId) {
        let url = createProductUrlFromParts(picklistProductId, currentProductId, {}, PICKLIST_KEY, listId);
        picklistUrl = url instanceof AppURL ? url.toHref() : url;
    }

    return picklistUrl;
}
