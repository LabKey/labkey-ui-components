import { QueryGridModel } from '../../QueryGridModel';
import { Domain } from '@labkey/api';
import { SCHEMAS } from '../../schemas';
import { PICKLIST, PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';
import { insertRows, InsertRowsResponse } from '../../query/api';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { getSelected } from '../../actions';
import { List } from 'immutable';

interface CreatePicklistResponse {
    domainId: number,
    name: string
}

export function createPicklist(name: string, description: string, shared: boolean, model: QueryGridModel, useSelection: boolean) : Promise<CreatePicklistResponse> {
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
                category: shared ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY
            },
            success: (response) => { resolve({name: response.name, domainId: response.domainId}); },
            failure: (err) => { reject(err); }
        });
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
