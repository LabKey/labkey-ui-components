import { Ajax, Domain, Utils } from '@labkey/api';
import { SCHEMAS } from '../../schemas';
import { PICKLIST, PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';
import { insertRows, InsertRowsResponse } from '../../query/api';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { getSelected, getSelectedData } from '../../actions';
import { List } from 'immutable';
import { saveDomain } from '../domainproperties/actions';
import { DomainDesign, DomainField, DomainIndex } from '../domainproperties/models';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { Actions } from '../../../public/QueryModel/withQueryModels';
import { User } from '../base/models/User';
import { PicklistModel } from './models';
import { flattenValuesFromRow } from '../../../public/QueryModel/utils';
import { buildURL } from '../../url/AppURL';

interface CreatePicklistResponse {
    domainId: number,
    name: string
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
                        lookupContainer: LABKEY.container.path,
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
            success: (response) => { resolve({name: response.name, domainId: response.domainId}); },
            failure: (err) => { reject(err); }
        });
    });
}

// TODO one of these two is not needed
export function updatePicklist(picklist: PicklistModel) :Promise<PicklistModel>  {
    return new Promise((resolve, reject) => {
        // resolve(picklist);
        // updateRows({
        //     schemaQuery: SchemaQuery.create("exp", "list"),
        //     rows: [
        //         picklist
        //     ]
        // }).then(response => {
        //     resolve(picklist);
        // }).catch(reason => {
        //     console.error(reason);
        //     reject(reason);
        // });
        saveDomain(
            DomainDesign.create({
                name: picklist.name,
                // fields: List<DomainField>([DomainField.create(
                //     {
                //         name: 'SampleID',
                //         // rangeURI: 'int',
                //         required: true,
                //         lookupContainer: LABKEY.container.path,
                //         lookupSchema: SCHEMAS.INVENTORY.SAMPLE_ITEMS.schemaName,
                //         lookupQuery: SCHEMAS.INVENTORY.SAMPLE_ITEMS.queryName,
                //     }),
                // ]),
                // indices: List<DomainIndex>([DomainIndex.fromJS(
                //     [{
                //         columns: ['SampleID'],
                //         type: 'unique',
                //     }])
                // ])
            }),
            PICKLIST,
            {
                keyName: 'id',
                keyType: 'AutoIncrementInteger',
                description : picklist.Description,
                category: picklist.Category,
            },
            picklist.name
        );
        // Domain.save({
        //     domainId: domainId,
        //     domainDesign: {
        //         name: name,
        //     },
        //     options: {
        //         description,
        //         category: shared ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY
        //     },
        //     success: (response) => { resolve({name: response.name, domainId: response.domainId})},
        //     failure: (err) => { reject(err); }
        // })
    })
}

export function savePicklist(name: string, description: string, shared: boolean) : Promise<CreatePicklistResponse> {
    return new Promise((resolve, reject) => {
        saveDomain(
            DomainDesign.create({
                name: name,
                fields: List<DomainField>([DomainField.create(
                    {
                        name: 'SampleID',
                        // rangeURI: 'int',
                        required: true,
                        lookupContainer: LABKEY.container.path,
                        lookupSchema: SCHEMAS.INVENTORY.SAMPLE_ITEMS.schemaName,
                        lookupQuery: SCHEMAS.INVENTORY.SAMPLE_ITEMS.queryName,
                    }),
                ]),
                indices: List<DomainIndex>([DomainIndex.fromJS(
                    [{
                        columns: ['SampleID'],
                        type: 'unique',
                    }])
                ])
            }),
            PICKLIST,
            {
                keyName: 'id',
                keyType: 'AutoIncrementInteger',
                description,
                category: shared ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY
            },
            name
        );
    });
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

export function getPicklistDeleteData(model: QueryModel, actions: Actions, user: User) : Promise<PicklistDeletionData> {
    return new Promise((resolve, reject) => {

        const columnString = 'Name,listId,category,createdBy';
        getSelectedData(model.schemaName, model.queryName, [...model.selections], columnString, undefined, undefined,'ListId')
            .then(response => {
                    const { data } = response;
                    let numDeletable = 0;
                    let numNotDeletable = 0;
                    let numShared = 0;
                    let deletableLists = [];
                    data.valueSeq().forEach(row => {
                        const picklist = new PicklistModel(flattenValuesFromRow(row.toJS(), row.keySeq().toArray()));
                        if (picklist.isPublic()) {
                            numShared++;
                        }
                        if (picklist.isDeletable(user)) {
                            numDeletable++;
                            deletableLists.push(picklist);
                        } else {
                            numNotDeletable++;
                        }
                    });
                    resolve({
                        numDeletable,
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
