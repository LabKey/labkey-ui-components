/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { ActionURL, Ajax, Domain, Filter, Query, Utils } from '@labkey/api';
import { fromJS, List, Map, OrderedMap } from 'immutable';

import { IEntityTypeDetails } from '../entities/models';
import { deleteEntityType } from '../entities/actions';
import {
    buildURL,
    DomainDetails,
    getSelectedData,
    getSelection,
    QueryColumn,
    resolveErrorMessage,
    SAMPLE_ID_FIND_FIELD,
    SchemaQuery,
    SCHEMAS,
    selectRows,
    UNIQUE_ID_FIND_FIELD,
} from '../../..';

import { GroupedSampleFields } from './models';

export function initSampleSetSelects(isUpdate: boolean, ssName: string, includeDataClasses: boolean): Promise<any[]> {
    const promises = [];

    // Get Sample Types
    promises.push(
        selectRows({
            schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
            queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
            columns: 'LSID, Name, RowId, Folder',
            containerFilter: Query.containerFilter.currentPlusProjectAndShared,
        })
    );

    // Get Data Classes
    if (includeDataClasses) {
        promises.push(
            selectRows({
                schemaName: SCHEMAS.EXP_TABLES.DATA_CLASSES.schemaName,
                queryName: SCHEMAS.EXP_TABLES.DATA_CLASSES.queryName,
                columns: 'LSID, Name, RowId, Folder, Category',
                containerFilter: Query.containerFilter.currentPlusProjectAndShared,
            })
        );
    }

    return new Promise<any[]>((resolve, reject) => {
        return Promise.all(promises)
            .then(responses => {
                resolve(responses);
            })
            .catch(errorResponse => {
                reject(errorResponse);
            });
    });
}

export function getSampleSet(config: IEntityTypeDetails): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', 'getSampleTypeApi.api'),
            method: 'GET',
            params: config,
            success: Utils.getCallbackWrapper(response => {
                resolve(Map(response));
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(response);
            }),
        });
    });
}

export function getSampleTypeDetails(query?: SchemaQuery, domainId?: number): Promise<DomainDetails> {
    return new Promise((resolve, reject) => {
        return Domain.getDomainDetails({
            domainId,
            containerPath: ActionURL.getContainer(),
            queryName: query ? query.getQuery() : undefined,
            schemaName: query ? query.getSchema() : undefined,
            domainKind: query === undefined && domainId === undefined ? 'SampleSet' : undefined,
            success: response => {
                resolve(DomainDetails.create(Map(response)));
            },
            failure: response => {
                console.error(response);
                reject(response);
            },
        });
    });
}

export function deleteSampleSet(rowId: number): Promise<any> {
    return deleteEntityType('deleteSampleTypes', rowId);
}

/**
 * Fetches an OrderedMap of Sample Type rows specified by a schemaQuery and collection of filters. This data
 * is mapped via the sampleColumn to make it compatible with editable grid data.
 * @param schemaQuery SchemaQuery which sources the request for rows
 * @param sampleColumn A QueryColumn used to map fieldKey, displayColumn, and keyColumn data
 * @param filterArray A collection of filters used when requesting rows
 */
export function fetchSamples(
    schemaQuery: SchemaQuery,
    sampleColumn: QueryColumn,
    filterArray: Filter.IFilter[]
): Promise<OrderedMap<any, any>> {
    return selectRows({
        schemaName: schemaQuery.schemaName,
        queryName: schemaQuery.queryName,
        filterArray,
    }).then(response => {
        const { key, models, orderedModels } = response;
        const rows = fromJS(models[key]);
        let data = OrderedMap<any, any>();

        orderedModels[key].forEach(id => {
            data = data.setIn(
                [id, sampleColumn.fieldKey],
                List([
                    {
                        displayValue: rows.getIn([id, sampleColumn.lookup.displayColumn, 'value']),
                        value: rows.getIn([id, sampleColumn.lookup.keyColumn, 'value']),
                    },
                ])
            );
        });

        return data;
    });
}

/**
 * Loads a collection of RowIds from a selectionKey found on "location". Uses [[fetchSamples]] to query and filter
 * the Sample Set data.
 * @param location The location to search for the selectionKey on
 * @param sampleColumn A QueryColumn used to map data in [[fetchSamples]]
 */
export function loadSelectedSamples(location: any, sampleColumn: QueryColumn): Promise<OrderedMap<any, any>> {
    return getSelection(location).then(selection => {
        if (selection.resolved && selection.schemaQuery && selection.selected.length) {
            return fetchSamples(selection.schemaQuery, sampleColumn, [
                Filter.create('RowId', selection.selected, Filter.Types.IN),
            ]);
        }
    });
}

export function getGroupedSampleDomainFields(sampleType: string): Promise<GroupedSampleFields> {
    return new Promise((resolve, reject) => {
        getSampleTypeDetails(SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType))
            .then(sampleTypeDomain => {
                const metaFields = [],
                    aliquotFields = [];
                const metricUnit = sampleTypeDomain.get('options').get('metricUnit');

                sampleTypeDomain.domainDesign.fields.forEach(field => {
                    if (field.derivationDataScope === 'ChildOnly') aliquotFields.push(field.name.toLowerCase());
                    else metaFields.push(field.name.toLowerCase());
                });

                resolve({
                    aliquotFields,
                    metaFields,
                    metricUnit,
                });
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

export function getAliquotSampleIds(selection: List<any>, sampleType: string): Promise<any[]> {
    return getFilteredSampleSelection(selection, sampleType, [Filter.create('IsAliquot', true)]);
}

export function getNotInStorageSampleIds(selection: List<any>, sampleType: string): Promise<any[]> {
    return getFilteredSampleSelection(selection, sampleType, [Filter.create('StorageStatus', 'Not in storage')]);
}

export function getFilteredSampleSelection(
    selection: List<any>,
    sampleType: string,
    filters: Filter.IFilter[]
): Promise<any[]> {
    if (!selection || selection.isEmpty()) {
        return new Promise((resolve, reject) => {
            reject('No data is selected');
        });
    }

    const sampleRowIds = [];
    selection.forEach(sel => sampleRowIds.push(parseInt(sel)));
    return new Promise((resolve, reject) => {
        selectRows({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            queryName: sampleType,
            columns: 'RowId',
            filterArray: [Filter.create('RowId', sampleRowIds, Filter.Types.IN), ...filters],
        })
            .then(response => {
                const { key, models } = response;
                const filteredSamples = [];
                Object.keys(models[key]).forEach(row => {
                    const sample = models[key][row];
                    filteredSamples.push(sample.RowId.value);
                });
                resolve(filteredSamples);
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

export function getSampleSelectionStorageData(selection: List<any>): Promise<{}> {
    if (!selection || selection.isEmpty()) {
        return new Promise((resolve, reject) => {
            reject('No data is selected');
        });
    }

    const sampleRowIds = [];
    selection.forEach(sel => sampleRowIds.push(parseInt(sel)));
    return new Promise((resolve, reject) => {
        selectRows({
            schemaName: 'inventory',
            queryName: 'ItemSamples',
            columns: 'RowId, SampleId, StoredAmount',
            filterArray: [Filter.create('SampleId', sampleRowIds, Filter.Types.IN)],
        })
            .then(response => {
                const { key, models } = response;
                const filteredSampleItems = {};
                Object.keys(models[key]).forEach(row => {
                    const item = models[key][row];
                    const rowId = item.RowId.value;
                    const storedAmount = item.StoredAmount.value;
                    filteredSampleItems[item.SampleId.value] = {
                        rowId,
                        storedAmount,
                    };
                });
                resolve(filteredSampleItems);
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

export interface GroupedSampleDisplayColumns {
    aliquotHeaderDisplayColumns: List<QueryColumn>;
    displayColumns: List<QueryColumn>;
    editColumns: List<QueryColumn>;
}

export function getGroupedSampleDisplayColumns(
    allDisplayColumns: List<QueryColumn>,
    allUpdateColumns: List<QueryColumn>,
    sampleTypeDomainFields: GroupedSampleFields,
    isAliquot: boolean
): GroupedSampleDisplayColumns {
    const editColumns = List<QueryColumn>().asMutable();
    const displayColumns = List<QueryColumn>().asMutable();
    let aliquotHeaderDisplayColumns = List<QueryColumn>();

    allDisplayColumns.forEach(col => {
        const colName = col.name.toLowerCase();
        if (isAliquot) {
            if (sampleTypeDomainFields.metaFields.indexOf(colName) > -1) displayColumns.push(col);
            // display parent meta for aliquot
            else if (sampleTypeDomainFields.aliquotFields.indexOf(colName) > -1) {
                aliquotHeaderDisplayColumns = aliquotHeaderDisplayColumns.push(col);
            } else {
                if (sampleTypeDomainFields.metaFields.indexOf(colName) === -1) {
                    displayColumns.push(col);
                }
            }
        } else {
            if (sampleTypeDomainFields.aliquotFields.indexOf(colName) === -1) {
                displayColumns.push(col);
            }
        }
    });

    allUpdateColumns.forEach(col => {
        const colName = col.name.toLowerCase();
        if (isAliquot) {
            if (sampleTypeDomainFields.aliquotFields.indexOf(colName) > -1) {
                editColumns.push(col);
            } else if (colName === 'description') {
                editColumns.push(col);
            } else {
                if (sampleTypeDomainFields.metaFields.indexOf(colName) === -1) {
                    editColumns.push(col);
                }
            }
        } else {
            if (sampleTypeDomainFields.aliquotFields.indexOf(colName) === -1) {
                editColumns.push(col);
            }
        }
    });

    return {
        aliquotHeaderDisplayColumns,
        displayColumns,
        editColumns,
    };
}

export function getSelectedItemSamples(selectedItemIds: string[]): Promise<number[]> {
    return new Promise((resolve, reject) => {
        getSelectedData(
            SCHEMAS.INVENTORY.ITEMS.schemaName,
            SCHEMAS.INVENTORY.ITEMS.queryName,
            selectedItemIds,
            'RowId, MaterialId',
            undefined,
            undefined,
            undefined
        )
            .then(response => {
                const { data } = response;
                const sampleIds = [];
                const rowIds = [];
                data.forEach(row => {
                    sampleIds.push(row.getIn(['MaterialId', 'value']));
                });
                resolve(sampleIds);
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export function getFindSamplesByIdQueryName(previousQueryName?: string) : Promise<string> {
    return new Promise((resolve, reject) => {
        // TODO should we pass the previousQueryName so it can be removed from the session?
        const sampleIds = sessionStorage.getItem(SAMPLE_ID_FIND_FIELD.storageKey)?.split("\n");
        const uniqueIds = sessionStorage.getItem(UNIQUE_ID_FIND_FIELD.storageKey)?.split("\n");
        if (sampleIds || uniqueIds) {
            Ajax.request({
                url: ActionURL.buildURL("experiment", "saveOrderedSamplesQuery.api"),
                method: 'POST',
                jsonData: {
                    sampleIds,
                    uniqueIds
                },
                success: Utils.getCallbackWrapper((response) => {
                    if (response.success) {
                        const data = response.data;
                        resolve(data);
                    } else {
                        console.error("Unable to create session query");
                        reject("There was a problem creating the query for the samples. Please try again.");
                    }
                }),
                failure: Utils.getCallbackWrapper((error) => {
                    console.error("There was a problem creating the query for the samples.", error);
                    reject("There was a problem creating the query for the samples. Please try again.");
                })
            });
        }
        else { // we have no ids in storage so we have no query to create
            resolve(undefined);
        }
    });
}
