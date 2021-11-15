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
import { fromJS, List, Map, OrderedMap } from 'immutable';
import { ActionURL, Ajax, Domain, Filter, Query, Utils } from '@labkey/api';

import { EntityChoice, EntityDataType, IEntityTypeDetails, IEntityTypeOption } from '../entities/models';
import { deleteEntityType, getEntityTypeOptions } from '../entities/actions';
import {
    AssayStateModel,
    buildURL,
    caseInsensitive,
    createQueryConfigFilteredBySample,
    DataClassDataType,
    DomainDetails,
    FindField,
    getFilterForSampleOperation,
    getSelectedData,
    getSelection,
    getStateModelId,
    ISelectRowsResult,
    naturalSortByProperty,
    QueryColumn,
    QueryConfig,
    resolveErrorMessage,
    SAMPLE_ID_FIND_FIELD,
    SampleOperation,
    SampleTypeDataType,
    SchemaQuery,
    SCHEMAS,
    selectRows,
    SHARED_CONTAINER_PATH,
    UNIQUE_ID_FIND_FIELD,
} from '../../..';

import { findMissingValues } from '../../util/utils';

import { ParentEntityLineageColumns } from '../entities/constants';
import { getInitialParentChoices } from '../entities/utils';

import { STORAGE_UNIQUE_ID_CONCEPT_URI } from '../domainproperties/constants';

import { isSampleStatusEnabled } from '../../app/utils';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { GroupedSampleFields, SampleAliquotsStats, SampleState } from './models';
import { IS_ALIQUOT_COL } from './constants';

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
                    if (field.derivationDataScope === 'ChildOnly') {
                        aliquotFields.push(field.name.toLowerCase());
                    } else {
                        metaFields.push(field.name.toLowerCase());
                    }
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
    return getFilteredSampleSelection(selection, sampleType, [Filter.create(IS_ALIQUOT_COL, true)]);
}

export function getNotInStorageSampleIds(selection: List<any>, sampleType: string): Promise<any[]> {
    return getFilteredSampleSelection(selection, sampleType, [Filter.create('StorageStatus', 'Not in storage')]);
}

export function getNotPermittedSampleIds(
    selection: List<any>,
    sampleType: string,
    operation: SampleOperation
): Promise<any[]> {
    return getFilteredSampleSelection(selection, sampleType, [getFilterForSampleOperation(operation, false)]);
}

function getFilteredSampleSelection(
    selection: List<any>,
    sampleType: string,
    filters: Filter.IFilter[]
): Promise<any[]> {
    const sampleRowIds = getSampleRowIdsFromSelection(selection);
    if (sampleRowIds.length === 0) {
        return new Promise((resolve, reject) => {
            reject('No data is selected');
        });
    }

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

export function getSampleSelectionStorageData(selection: List<any>): Promise<Record<string, any>> {
    const sampleRowIds = getSampleRowIdsFromSelection(selection);
    if (sampleRowIds.length === 0) {
        return new Promise((resolve, reject) => {
            reject('No data is selected');
        });
    }

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

export function getSampleSelectionLineageData(
    selection: List<any>,
    sampleType: string,
    columns?: string[]
): Promise<ISelectRowsResult> {
    const sampleRowIds = getSampleRowIdsFromSelection(selection);
    if (sampleRowIds.length === 0) {
        return Promise.reject('No data is selected');
    }

    return new Promise((resolve, reject) => {
        selectRows({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            queryName: sampleType,
            columns: columns ?? List.of('RowId', 'Name', 'LSID').concat(ParentEntityLineageColumns).toArray(),
            filterArray: [Filter.create('RowId', sampleRowIds, Filter.Types.IN)],
        })
            .then(response => {
                resolve(response);
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

export const getOriginalParentsFromSampleLineage = async (
    sampleLineage: Record<string, any>
): Promise<{
    originalParents: Record<string, List<EntityChoice>>;
    parentTypeOptions: Map<string, List<IEntityTypeOption>>;
}> => {
    const originalParents = {};
    let parentTypeOptions = Map<string, List<IEntityTypeOption>>();
    const dataClassTypeData = await getParentTypeDataForSample(DataClassDataType, Object.values(sampleLineage));
    const sampleTypeData = await getParentTypeDataForSample(SampleTypeDataType, Object.values(sampleLineage));

    // iterate through both Data Classes and Sample Types for finding sample parents
    [DataClassDataType, SampleTypeDataType].forEach(dataType => {
        const dataTypeOptions =
            dataType === DataClassDataType ? dataClassTypeData.parentTypeOptions : sampleTypeData.parentTypeOptions;

        const parentIdData =
            dataType === DataClassDataType ? dataClassTypeData.parentIdData : sampleTypeData.parentIdData;
        Object.keys(sampleLineage).forEach(sampleId => {
            if (!originalParents[sampleId]) originalParents[sampleId] = List<EntityChoice>();

            originalParents[sampleId] = originalParents[sampleId].concat(
                getInitialParentChoices(dataTypeOptions, dataType, sampleLineage[sampleId], parentIdData)
            );
        });

        // filter out the current parent types from the dataTypeOptions
        const originalParentTypeLsids = [];
        Object.values(originalParents).forEach((parentTypes: List<EntityChoice>) => {
            originalParentTypeLsids.push(...parentTypes.map(parentType => parentType.type.lsid).toArray());
        });
        parentTypeOptions = parentTypeOptions.set(
            dataType.typeListingSchemaQuery.queryName,
            dataTypeOptions.filter(option => originalParentTypeLsids.indexOf(option.lsid) === -1).toList()
        );
    });

    return { originalParents, parentTypeOptions };
};

export const getParentTypeDataForSample = async (
    parentDataType: EntityDataType,
    samplesData: any[]
): Promise<{
    parentTypeOptions: List<IEntityTypeOption>;
    parentIdData: Record<string, ParentIdData>;
}> => {
    const options = await getEntityTypeOptions(parentDataType);
    const parentTypeOptions = List<IEntityTypeOption>(options.get(parentDataType.typeListingSchemaQuery.queryName));

    // get the set of parent row LSIDs so that we can query for the RowId and SampleSet/DataClass for that row
    const parentIDs = [];
    samplesData.forEach(sampleData => {
        parentIDs.push(...sampleData[parentDataType.inputColumnName].map(row => row.value));
    });
    const parentIdData = await getParentRowIdAndDataType(parentDataType, parentIDs);

    return { parentTypeOptions, parentIdData };
};

export type ParentIdData = {
    parentId: string | number;
    rowId: number;
};

function getParentRowIdAndDataType(
    parentDataType: EntityDataType,
    parentIDs: string[]
): Promise<Record<string, ParentIdData>> {
    return new Promise((resolve, reject) => {
        selectRows({
            schemaName: parentDataType.listingSchemaQuery.schemaName,
            queryName: parentDataType.listingSchemaQuery.queryName,
            columns: 'LSID, RowId, DataClass, SampleSet', // only one of DataClass or SampleSet will exist
            filterArray: [Filter.create('LSID', parentIDs, Filter.Types.IN)],
        })
            .then(response => {
                const { key, models } = response;
                const filteredParentItems = {};
                Object.keys(models[key]).forEach(row => {
                    const item = models[key][row];
                    const lsid = caseInsensitive(item, 'LSID').value;
                    filteredParentItems[lsid] = {
                        rowId: caseInsensitive(item, 'RowId').value,
                        parentId:
                            caseInsensitive(item, 'DataClass')?.value ?? caseInsensitive(item, 'SampleSet')?.value,
                    };
                });
                resolve(filteredParentItems);
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

// exported for jest testing
export function getSampleRowIdsFromSelection(selection: List<any>): number[] {
    const sampleRowIds = [];
    if (selection && !selection.isEmpty()) {
        selection.forEach(sel => sampleRowIds.push(parseInt(sel, 10)));
    }
    return sampleRowIds;
}

export interface GroupedSampleDisplayColumns {
    aliquotHeaderDisplayColumns: QueryColumn[];
    displayColumns: QueryColumn[];
    editColumns: QueryColumn[];
}

function isAliquotEditableField(colName: string): boolean {
    return colName === 'description' || (isSampleStatusEnabled() && colName === 'samplestate');
}

export function getGroupedSampleDisplayColumns(
    allDisplayColumns: QueryColumn[],
    allUpdateColumns: QueryColumn[],
    sampleTypeDomainFields: GroupedSampleFields,
    isAliquot: boolean
): GroupedSampleDisplayColumns {
    const editColumns = [];
    const displayColumns = [];
    const aliquotHeaderDisplayColumns = [];

    allDisplayColumns.forEach(col => {
        const colName = col.name.toLowerCase();
        if (isAliquot) {
            // barcodes belong to the individual sample or aliquot (but not both)
            if (col.conceptURI === STORAGE_UNIQUE_ID_CONCEPT_URI) {
                aliquotHeaderDisplayColumns.push(col);
            }
            // display parent meta for aliquot
            else if (sampleTypeDomainFields.aliquotFields.indexOf(colName) > -1) {
                aliquotHeaderDisplayColumns.push(col);
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
            } else if (isAliquotEditableField(colName)) {
                editColumns.push(col);
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

export function getEditSharedSampleTypeUrl(typeId: number): string {
    return ActionURL.buildURL('experiment', 'editSampleType', SHARED_CONTAINER_PATH, {
        RowId: typeId,
        returnUrl: window.location.pathname + (window.location.hash ? window.location.hash : ''),
    }).toString();
}

export function getDeleteSharedSampleTypeUrl(typeId: number): string {
    return ActionURL.buildURL('experiment', 'deleteSampleTypes', SHARED_CONTAINER_PATH, {
        singleObjectRowId: typeId,
        returnUrl: window.location.pathname + '#/samples',
    }).toString();
}

function getSamplesIdsNotFound(queryName: string, orderedIds: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
        Query.selectDistinctRows({
            schemaName: SCHEMAS.EXP_TABLES.SCHEMA,
            queryName,
            column: 'Ordinal',
            sort: 'Ordinal',
            success: result => {
                // find the gaps in the ordinals values as these correspond to ids we could not find
                resolve(findMissingValues(result.values, orderedIds));
            },
            failure: reason => {
                console.error('There was a problem determining the missing Ids', reason);
                reject(reason);
            },
        });
    });
}

export function getFindSamplesByIdData(
    sessionKey: string
): Promise<{ queryName: string; ids: string[]; missingIds?: { [key: string]: string[] } }> {
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

export function saveIdsToFind(fieldType: FindField, ids: string[], sessionKey: string): Promise<string> {
    // list of ids deduplicated and prefixed with the field type's storage prefix
    const prefixedIds = [];
    ids.map(id => fieldType.storageKeyPrefix + id).forEach(pid => {
        if (!prefixedIds.includes(pid)) {
            prefixedIds.push(pid);
        }
    });

    return new Promise((resolve, reject) => {
        if (prefixedIds.length > 0) {
            Ajax.request({
                url: ActionURL.buildURL('experiment', 'saveFindIds.api'),
                method: 'POST',
                jsonData: {
                    ids: prefixedIds,
                    sessionKey,
                },
                success: Utils.getCallbackWrapper(response => {
                    if (response.success) {
                        resolve(response.data);
                    }
                }),
                failure: Utils.getCallbackWrapper(error => {
                    console.error('There was a problem saving the ids.', error);
                    reject('There was a problem saving the ids. Your session may have expired.');
                }),
            });
        } else {
            resolve(undefined);
        }
    });
}

export function getSampleAliquotRows(sampleId: number | string): Promise<Array<Record<string, any>>> {
    return new Promise((resolve, reject) => {
        Query.executeSql({
            sql:
                'SELECT m.RowId, m.Name\n' +
                'FROM exp.materials m \n' +
                'WHERE m.RootMaterialLSID = (SELECT lsid FROM exp.materials mi WHERE mi.RowId = ' +
                sampleId +
                ')',
            schemaName: SCHEMAS.EXP_TABLES.MATERIALS.schemaName,
            requiredVersion: 17.1,
            success: result => {
                resolve(result.rows);
            },
            failure: reason => {
                console.error(reason);
                reject(reason);
            },
        });
    });
}

export function getSampleAssayQueryConfigs(
    assayModel: AssayStateModel,
    sampleIds: Array<string | number>,
    gridSuffix: string,
    gridPrefix: string,
    omitSampleCols?: boolean,
    sampleSchemaQuery?: SchemaQuery
): QueryConfig[] {
    return assayModel.definitions
        .slice() // need to make a copy of the array before sorting
        .filter(assay => {
            if (!sampleSchemaQuery) return true;

            return assay.hasLookup(sampleSchemaQuery);
        })
        .sort(naturalSortByProperty('name'))
        .reduce((_configs, assay) => {
            const _queryConfig = createQueryConfigFilteredBySample(
                assay,
                sampleIds && sampleIds.length > 0 ? sampleIds : [-1],
                Filter.Types.IN,
                (fieldKey, sampleIds) => `${fieldKey} IN (${sampleIds.join(',')})`,
                false,
                omitSampleCols
            );

            if (_queryConfig) {
                _queryConfig.id = `${gridPrefix}:${assay.id}:${gridSuffix}`;
                _configs.push(_queryConfig);
            }

            return _configs;
        }, []);
}

export function getSampleAliquotsStats(rows: Record<string, any>): SampleAliquotsStats {
    let inStorageCount = 0,
        aliquotCount = 0,
        aliquotIds = [];
    for (const ind in rows) {
        const row = rows[ind];
        const storageStatus = caseInsensitive(row, 'StorageStatus')?.value;

        const inStorage = storageStatus === 'In storage';
        inStorageCount += inStorage ? 1 : 0;
        aliquotCount++;

        aliquotIds.push(caseInsensitive(row, 'RowId')?.value);
    }

    return {
        aliquotCount,
        inStorageCount,
        aliquotIds,
    };
}

export function getSampleAliquotsQueryConfig(
    sampleSet: string,
    sampleLsid: string,
    forGridView?: boolean,
    aliquotRootLsid?: string,
    omitCols?: List<string>
): QueryConfig {
    const omitCol = IS_ALIQUOT_COL;

    return {
        id: getStateModelId('sample-aliquots', SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleSet)),
        schemaQuery: SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleSet),
        bindURL: forGridView,
        maxRows: forGridView ? undefined : -1,
        omittedColumns: omitCols ? [...omitCols.toArray(), omitCol] : [omitCol],
        baseFilters: [
            Filter.create('RootMaterialLSID', aliquotRootLsid ?? sampleLsid),
            Filter.create('Lsid', sampleLsid, Filter.Types.EXP_CHILD_OF),
        ],
    };
}

export type SampleAssayResultViewConfig = {
    title: string;
    moduleName: string;
    schemaName: string;
    queryName: string;
    viewName?: string;
    sampleRowKey?: string; // sample row property to use for key in baseFilter, defaults to 'RowId' when value is undefined
    filterKey: string; // field key of the query/view to use for the sample filter IN clause
    containerFilter?: string; // Defaults to 'current' when value is undefined
};

export function getSampleAssayResultViewConfigs(): Promise<SampleAssayResultViewConfig[]> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getSampleAssayResultsViewConfigs.api'),
            method: 'GET',
            success: Utils.getCallbackWrapper(response => {
                resolve(response.configs ?? []);
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(response);
            }),
        });
    });
}

export function getSampleStatuses(): Promise<SampleState[]> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getSampleStatuses.api'),
            method: 'GET',
            success: Utils.getCallbackWrapper(response => {
                resolve(response.statuses?.map(state => new SampleState(state)) ?? []);
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(response);
            }),
        });
    });
}

export function getSampleTypeRowId(name: string) : Promise<number> {
    return new Promise((resolve, reject) => {
        selectRows( {
            schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
            queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
            columns: 'RowId,Name',
            filterArray: [Filter.create('Name', name)]
        }).then(response => {
            const { models, key } = response;
            const row = Object.values(models[key])[0];
            resolve(caseInsensitive(row, 'RowId')?.value);
        }).catch(reason => {
            console.error(reason);
            reject(resolveErrorMessage(reason));
        });
    });
}
