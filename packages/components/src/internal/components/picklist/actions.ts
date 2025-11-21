import { Domain, Filter, Query } from '@labkey/api';

import { List } from 'immutable';

import { insertRows, QueryCommandResponse } from '../../query/api';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { setSnapshotSelections } from '../../actions';
import { PICKLIST } from '../domainproperties/list/constants';
import { saveDomain } from '../domainproperties/actions';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { User } from '../base/models/User';
import { buildURL } from '../../url/AppURL';
import { fetchListDesign, getListIdFromDomainId } from '../domainproperties/list/actions';

import { isProductFoldersEnabled } from '../../app/utils';

import { SCHEMAS } from '../../schemas';
import { caseInsensitive } from '../../util/utils';

import { getOrderedSelectedMappedKeys } from '../entities/actions';

import { Picklist, PICKLIST_KEY_COLUMN, PICKLIST_SAMPLE_ID_COLUMN } from './models';
import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from './constants';
import { executeSql } from '../../query/executeSql';
import { getSelectedRows, selectRows } from '../../query/selectRows';
import { request } from '../../request';

export async function getPicklistsForInsert(): Promise<Picklist[]> {
    const { rows } = await selectRows({
        containerFilter: isProductFoldersEnabled() ? Query.ContainerFilter.current : undefined,
        schemaQuery: SCHEMAS.LIST_METADATA_TABLES.PICKLISTS,
        sort: 'Name',
        filterArray: [Filter.create('Category', null, Filter.Types.NONBLANK)],
    });

    return rows.map(row => Picklist.create(row));
}

export function createPicklist(
    name: string,
    description: string,
    shared: boolean,
    sampleIds: number[]
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
                Promise.all([getListIdFromDomainId(response.domainId), addSamplesToPicklist(name, sampleIds)])
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
                saveDomain({ domain, kind: PICKLIST, name: picklist.name, options })
                    .then(() => {
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

export async function getPicklistCountsBySampleType(listName: string): Promise<SampleTypeCount[]> {
    const result = await executeSql({
        schemaName: SCHEMAS.PICKLIST_TABLES.SCHEMA,
        sql: [
            'SELECT COUNT(*) as ItemCount,',
            'SampleId.SampleSet.Name AS SampleType,',
            'SampleId.LabelColor',
            `FROM ${SCHEMAS.PICKLIST_TABLES.SCHEMA}."${listName}"`,
            'WHERE SampleId.Name IS NOT NULL',
            'GROUP BY SampleId.SampleSet.Name, SampleId.LabelColor',
            'ORDER BY SampleId.SampleSet.Name',
        ].join('\n'),
    });

    return result.rows.reduce<SampleTypeCount[]>((counts, row) => {
        counts.push({
            ItemCount: row.ItemCount.value,
            LabelColor: row.LabelColor.value,
            SampleType: row.SampleType.value,
        });
        return counts;
    }, []);
}

export async function getPicklistSamples(listName: string): Promise<Set<number>> {
    try {
        const { rows } = await selectRows({ schemaQuery: new SchemaQuery(SCHEMAS.PICKLIST_TABLES.SCHEMA, listName) });
        return new Set(rows.map(row => caseInsensitive(row, PICKLIST_SAMPLE_ID_COLUMN).value));
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export function getOrderedSelectedPicklistSamples(queryModel: QueryModel, saveSnapshot?: boolean): Promise<number[]> {
    const { queryName, queryParameters, selections, sortString, viewName, selectionKey } = queryModel;
    return getSelectedPicklistSamples(
        queryName,
        Array.from(selections),
        saveSnapshot,
        selectionKey,
        sortString,
        queryParameters,
        viewName
    );
}

// TODO: drop the selectionKey and saveSnapshot args
//  - We need to update storage/actions.ts::getValidSampleItemsWithFullPath to not use selectionKey and saveSnapshot
//  when calling getOrderedSelectedPicklistSamples, which calls this method
//  - In order to update getValidSampleItemsWithFullPath to not use selectionKey and saveSnapshot we need to change how
//  the StorageActionModals works when adding samples to storage after samples are created. It is not straightforward.
export async function getSelectedPicklistSamples(
    picklistName: string,
    selectedIds: string[],
    saveSnapshot?: boolean,
    selectionKey?: string,
    sorts?: string,
    queryParameters?: Record<string, any>,
    viewName?: string
): Promise<number[]> {
    const result = await getOrderedSelectedMappedKeys(
        PICKLIST_KEY_COLUMN,
        PICKLIST_SAMPLE_ID_COLUMN,
        SCHEMAS.PICKLIST_TABLES.SCHEMA,
        picklistName,
        selectedIds,
        sorts,
        queryParameters,
        viewName
    );

    if (saveSnapshot) {
        const rowIds = result.mapFromValues;
        setSnapshotSelections(selectionKey, rowIds);
    }

    return result.mapToValues;
}

export async function getSamplesNotInList(listName: string, sampleIds: number[]): Promise<number[]> {
    const existingSamples = await getPicklistSamples(listName);
    return sampleIds.filter(id => !existingSamples.has(id));
}

export async function addSamplesToPicklist(listName: string, sampleIds: number[]): Promise<QueryCommandResponse> {
    const sampleIdsToAdd = await getSamplesNotInList(listName, sampleIds);
    const rows = List(sampleIdsToAdd.map(id => ({ SampleId: id })));
    const schemaQuery = new SchemaQuery(SCHEMAS.PICKLIST_TABLES.SCHEMA, listName);

    if (rows.size > 0) {
        return await insertRows({ rows, schemaQuery });
    }

    return new QueryCommandResponse({
        rows: [],
        schemaQuery,
        error: undefined,
        transactionAuditId: undefined,
    });
}

export interface PicklistDeletionData {
    deletableLists: Picklist[];
    numDeletable: number;
    numNotDeletable: number;
    numShared: number;
}

export async function getPicklistDeleteData(model: QueryModel, user: User): Promise<PicklistDeletionData> {
    const result = await getSelectedRows({
        columns: ['Name', 'listId', 'category', 'createdBy'],
        keyColumn: 'listId',
        schemaQuery: model.schemaQuery,
        selections: model.selections,
    });

    return result.rows.reduce(
        (result, row) => {
            const picklist = Picklist.create(row);
            if (picklist.isDeletable(user)) {
                if (picklist.isPublic()) result.numShared = result.numShared + 1;
                result.deletableLists.push(picklist);
                result.numDeletable = result.deletableLists.length;
            } else {
                result.numNotDeletable = result.numNotDeletable + 1;
            }
            return result;
        },
        {
            deletableLists: [],
            numDeletable: 0,
            numNotDeletable: 0,
            numShared: 0,
        } as PicklistDeletionData
    );
}

export async function deletePicklists(picklists: Picklist[]): Promise<void> {
    const params: Record<string, number | number[]> = {};

    if (picklists.length === 1) params.listId = picklists[0].listId;
    else params.listIds = picklists.map(picklist => picklist.listId);

    const url = buildURL('list', 'deleteListDefinition.api');
    await request({ url, method: 'POST', params });
}

export const getPicklistFromId = async (listId: number, loadSampleTypes = true): Promise<Picklist> => {
    const { rows } = await selectRows({
        containerFilter: getPicklistListingContainerFilter(),
        schemaQuery: SCHEMAS.LIST_METADATA_TABLES.PICKLISTS,
        filterArray: [Filter.create('listId', listId)],
    });
    const listRow = rows[0];
    if (!listRow) return new Picklist(/* use empty picklist to signal not found */);
    let picklist = Picklist.create(listRow);

    if (loadSampleTypes) {
        const result = await executeSql({
            schemaName: SCHEMAS.PICKLIST_TABLES.SCHEMA,
            sql: `SELECT DISTINCT SampleID.SampleSet, SampleID.SampleSet.Category FROM "${picklist.name}" WHERE SampleID.SampleSet IS NOT NULL`,
        });

        picklist = picklist.mutate({
            hasMedia: !!result.rows.find(row => caseInsensitive(row, 'Category')?.value === 'media'),
            sampleTypes: result.rows
                .map(row => caseInsensitive(row, 'SampleSet')?.displayValue)
                .filter(value => !!value),
        });
    }

    return picklist;
};

export function getPicklistListingContainerFilter(): Query.ContainerFilter {
    return isProductFoldersEnabled() ? Query.ContainerFilter.current : undefined;
}
