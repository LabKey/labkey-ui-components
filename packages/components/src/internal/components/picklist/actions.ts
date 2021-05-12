import { Ajax, Domain, Utils } from '@labkey/api';
import { PICKLIST, PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';
import { insertRows, InsertRowsResponse } from '../../query/api';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { getSelected, getSelectedData } from '../../actions';
import { List } from 'immutable';
import { saveDomain } from '../domainproperties/actions';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { User } from '../base/models/User';
import { PicklistModel } from './models';
import { flattenValuesFromRow } from '../../../public/QueryModel/utils';
import { buildURL } from '../../url/AppURL';
import { fetchListDesign, getListIdFromDomainId } from '../domainproperties/list/actions';
import { resolveErrorMessage } from '../../util/messaging';
import { SCHEMAS } from '../../../index';

interface CreatePicklistResponse {
    domainId: number,
    listId: number,
    name: string
}

export function setPicklistDefaultView(name: string): Promise<CreatePicklistResponse> {
    return new Promise((resolve, reject) => {
        let jsonData = {
            schemaName: "lists",
            queryName: name,
            views: [{
                columns:[
                    {fieldKey: "SampleID/Name"},
                    {fieldKey: "SampleID/LabelColor"},
                    {fieldKey: "SampleID/SampleSet"},
                    {fieldKey: "SampleID/StoredAmount"},
                    {fieldKey: "SampleID/Units"},
                    {fieldKey: "SampleID/freezeThawCount"},
                    {fieldKey: "SampleID/StorageStatus"},
                    {fieldKey: "SampleID/checkedOutBy"},
                    {fieldKey: "SampleID/Created"},
                    {fieldKey: "SampleID/CreatedBy"},
                    {fieldKey: "SampleID/StorageLocation"},
                    {fieldKey: "SampleID/StorageRow"},
                    {fieldKey: "SampleID/StorageCol"},
                    {fieldKey: "SampleID/isAliquot"},
                ]
            }],
            shared: true,
        };
        return Ajax.request({
            url: buildURL('query', 'saveQueryViews.api'),
            method: 'POST',
            jsonData,
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject("There was a problem creating the default view for the picklist. " + resolveErrorMessage(response));
            }),
        });
    });
}

export function createPicklist(name: string, description: string, shared: boolean) : Promise<CreatePicklistResponse> {
    return new Promise((resolve, reject) => {
        Domain.create({
            domainDesign: {
                name: name,
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
                    }
                ]
            },
            kind: PICKLIST,
            options: {
                keyName: 'id',
                keyType: 'AutoIncrementInteger',
                description,
                category: shared ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY
            },
            success: (response) => {
                getListIdFromDomainId(response.domainId)
                    .then(listId => {
                        resolve({listId, name: response.name, domainId: response.domainId});
                    })
                    .catch(error => {
                        reject(error);
                    })
            },
            failure: (err) => { reject(err); }
        });
    });
}

export function updatePicklist(picklist: PicklistModel) :Promise<PicklistModel>  {
    return new Promise((resolve, reject) => {
        fetchListDesign(picklist.listId)
            .then(listDesign => {
                let domain = listDesign.domain;
                const options = {
                    domainId: domain.domainId,
                    name: picklist.name,
                    keyName: 'id',
                    keyType: 'AutoIncrementInteger',
                    description : picklist.Description,
                    category: picklist.Category,
                };
                saveDomain(
                    domain,
                    PICKLIST,
                    options,
                    picklist.name
                ).then(savedDomain => {
                    resolve(picklist);
                }).catch(errorDomain => {
                    console.error(errorDomain.domainException);
                    reject(errorDomain.domainException);
                });
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    })
}

export function addSamplesToPicklist(listName: string, selectionKey?: string, sampleIds?: string[] ) : Promise<InsertRowsResponse> {
    let rows = List<any>();
    if (selectionKey) {
        getSelected(selectionKey).then(response => {
            response.selected.forEach(id => {
                rows = rows.push({ SampleID: id});
            });
            return insertRows({
                schemaQuery: SchemaQuery.create("lists", listName),
                rows
            });
        });
    }
    else {
        sampleIds.forEach(id => {
            rows = rows.push({ SampleID: id})
        });
        return insertRows({
            schemaQuery: SchemaQuery.create("lists", listName),
            rows
        });
    }
}

export interface PicklistDeletionData {
    numDeletable: number,
    numNotDeletable: number,
    numShared: number,
    deletableLists: PicklistModel[],
}

export function getPicklistDeleteData(model: QueryModel, user: User) : Promise<PicklistDeletionData> {
    return new Promise((resolve, reject) => {

        const columnString = 'Name,listId,category,createdBy';
        getSelectedData(model.schemaName, model.queryName, [...model.selections], columnString, undefined, undefined,'ListId')
            .then(response => {
                    const { data } = response;
                    let numNotDeletable = 0;
                    let numShared = 0;
                    let deletableLists = [];
                    data.valueSeq().forEach(row => {
                        const picklist = new PicklistModel(flattenValuesFromRow(row.toJS(), row.keySeq().toArray()));

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
                        deletableLists
                    });
                }
            )
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export function deletePicklists(picklists: PicklistModel[], selectionKey?: string) : Promise<any> {
    return new Promise((resolve, reject) => {
        let params;
        if (picklists.length === 1) {
            params = {
                listId: picklists[0].listId
            };
        } else if (selectionKey) {
            params = {
                dataRegionSelectionKey: selectionKey
            };
        } else {
            let listIds = [];
            picklists.forEach(picklist => {
                listIds.push(picklist.listId);
            })
            params = {
                listIds
            }
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
