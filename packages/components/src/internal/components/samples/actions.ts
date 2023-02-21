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
import { List, Map, OrderedMap } from 'immutable';
import { ActionURL, Ajax, Domain, Filter, Query, Utils } from '@labkey/api';

import { EntityDataType, IEntityTypeDetails, IEntityTypeOption } from '../entities/models';
import { deleteEntityType, getEntityTypeOptions, getSelectedItemSamples } from '../entities/actions';

import { Location } from '../../util/URL';
import { getSelectedData, getSelection, getSnapshotSelections } from '../../actions';

import { caseInsensitive, quoteValueWithDelimiters } from '../../util/utils';

import { ParentEntityLineageColumns } from '../entities/constants';

import { DERIVATION_DATA_SCOPES, STORAGE_UNIQUE_ID_CONCEPT_URI } from '../domainproperties/constants';

import { isProductProjectsEnabled, isProjectContainer, isSampleStatusEnabled } from '../../app/utils';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { EXP_TABLES, SCHEMAS } from '../../schemas';

import {
    getContainerFilter,
    invalidateFullQueryDetailsCache,
    ISelectRowsResult,
    selectRowsDeprecated,
} from '../../query/api';

import { buildURL } from '../../url/AppURL';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { DomainDetails } from '../domainproperties/models';
import { QueryColumn } from '../../../public/QueryColumn';
import { getSelectedPicklistSamples } from '../picklist/actions';
import { resolveErrorMessage } from '../../util/messaging';
import { QueryConfig } from '../../../public/QueryModel/QueryModel';
import { naturalSort, naturalSortByProperty } from '../../../public/sort';
import { AssayStateModel } from '../assay/models';
import { TimelineEventModel } from '../auditlog/models';

import { ViewInfo } from '../../ViewInfo';

import { AssayDefinitionModel } from '../../AssayDefinitionModel';

import { createGridModelId } from '../../models';

import { IS_ALIQUOT_COL, SAMPLE_STATUS_REQUIRED_COLUMNS, SELECTION_KEY_TYPE } from './constants';
import { FindField, GroupedSampleFields, SampleAliquotsStats, SampleState } from './models';

export function initSampleSetSelects(
    isUpdate: boolean,
    includeDataClasses: boolean,
    containerPath: string
): Promise<ISelectRowsResult[]> {
    const promises: Array<Promise<ISelectRowsResult>> = [];

    // Get Sample Types
    promises.push(
        selectRowsDeprecated({
            containerPath,
            schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
            queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
            columns: 'LSID, Name, RowId, Folder',
            containerFilter: Query.containerFilter.currentPlusProjectAndShared,
        })
    );

    // Get Data Classes
    if (includeDataClasses) {
        promises.push(
            selectRowsDeprecated({
                containerPath,
                schemaName: SCHEMAS.EXP_TABLES.DATA_CLASSES.schemaName,
                queryName: SCHEMAS.EXP_TABLES.DATA_CLASSES.queryName,
                columns: 'LSID, Name, RowId, Folder, Category',
                containerFilter: Query.containerFilter.currentPlusProjectAndShared,
            })
        );
    }

    return Promise.all(promises);
}

export function getSampleSet(config: IEntityTypeDetails): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', 'getSampleTypeApi.api'),
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

export function getSampleTypeDetails(
    query?: SchemaQuery,
    domainId?: number,
    containerPath?: string
): Promise<DomainDetails> {
    return new Promise((resolve, reject) => {
        return Domain.getDomainDetails({
            containerPath,
            domainId,
            queryName: query ? query.queryName : undefined,
            schemaName: query ? query.schemaName : undefined,
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

export function deleteSampleSet(rowId: number, containerPath?: string, auditUserComment?: string): Promise<any> {
    return deleteEntityType('deleteSampleTypes', rowId, containerPath, auditUserComment);
}

/**
 * Fetches an OrderedMap of Sample Type rows specified by a schemaQuery and collection of filters. This data
 * is mapped via the sampleColumn to make it compatible with editable grid data.
 * @param schemaQuery SchemaQuery which sources the request for rows
 * @param sampleColumn A QueryColumn used to map fieldKey, displayColumn, and keyColumn data
 * @param filterArray A collection of filters used when requesting rows
 * @param displayValueKey Column name containing grid display value of Sample Type
 * @param valueKey Column name containing grid value of Sample Type
 */
export function fetchSamples(
    schemaQuery: SchemaQuery,
    sampleColumn: QueryColumn,
    filterArray: Filter.IFilter[],
    displayValueKey: string,
    valueKey: string
): Promise<OrderedMap<any, any>> {
    return selectRowsDeprecated({
        schemaName: schemaQuery.schemaName,
        queryName: schemaQuery.queryName,
        viewName: schemaQuery.viewName,
        columns: ['RowId', displayValueKey, valueKey],
        filterArray,
    }).then(response => {
        const { key, models, orderedModels } = response;
        const rows = models[key];
        let data = OrderedMap<any, any>();

        orderedModels[key].forEach(id => {
            data = data.setIn(
                [id, sampleColumn.fieldKey],
                List([
                    {
                        displayValue: caseInsensitive(rows[id], displayValueKey)?.value,
                        value: caseInsensitive(rows[id], valueKey)?.value,
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
export function loadSelectedSamples(location: Location, sampleColumn: QueryColumn): Promise<OrderedMap<any, any>> {
    // If the "workflowJobId" URL parameter is specified, then fetch the samples associated with the workflow job.
    if (location?.query?.workflowJobId) {
        return fetchSamples(
            new SchemaQuery('sampleManagement', 'inputSamples'),
            sampleColumn,
            [
                Filter.create('ApplicationType', 'ExperimentRun'),
                Filter.create('ApplicationRun', location.query.workflowJobId),
            ],
            'Name',
            'SampleId'
        );
    }

    // Otherwise, load the samples from the selection.
    return getSelection(location).then(async selection => {
        if (selection.resolved && selection.schemaQuery && selection.selected.length) {
            const isPicklist = location?.query?.isPicklist === 'true';
            let sampleIdNums = selection.selected;
            if (isPicklist)
                sampleIdNums = await getSelectedPicklistSamples(
                    selection.schemaQuery.queryName,
                    selection.selected,
                    false
                );

            const sampleSchemaQuery =
                isPicklist || selection.schemaQuery.isEqual(SCHEMAS.SAMPLE_MANAGEMENT.INPUT_SAMPLES_SQ)
                    ? EXP_TABLES.MATERIALS
                    : selection.schemaQuery;
            return fetchSamples(
                sampleSchemaQuery,
                sampleColumn,
                [Filter.create('RowId', sampleIdNums, Filter.Types.IN)],
                sampleColumn.lookup.displayColumn,
                sampleColumn.lookup.keyColumn
            );
        }

        return OrderedMap();
    });
}

function getLocationQueryVal(location: Location, key: string): string {
    if (!location.query) {
        return undefined;
    }

    const val: string | string[] = location.query[key];
    return Array.isArray(val) ? val[0] : val;
}

/**
 * Get an array of sample RowIds from a URL selectionKey for the following scenarios:
 *  - sample grid
 *  - picklist
 *  - assay
 *  - storage items
 */
export async function getSelectedSampleIdsFromSelectionKey(location: Location): Promise<number[]> {
    const key = getLocationQueryVal(location, 'selectionKey');
    let sampleIds;
    const selectionType = getLocationQueryVal(location, 'selectionKeyType');
    const isSnapshot = selectionType === SELECTION_KEY_TYPE.snapshot;
    if (selectionType === SELECTION_KEY_TYPE.inventoryItems) {
        const response = await getSnapshotSelections(key);
        sampleIds = await getSelectedItemSamples(response.selected);
    } else if (getLocationQueryVal(location, 'isAssay')) {
        const schemaName = getLocationQueryVal(location, 'assayProtocol');
        const sampleFieldKey = getLocationQueryVal(location, 'sampleFieldKey');
        const queryName = SCHEMAS.ASSAY_TABLES.RESULTS_QUERYNAME;
        let response;
        if (isSnapshot) response = await getSnapshotSelections(location.query.selectionKey);
        else response = await getSelection(location, schemaName, queryName);
        sampleIds = await getFieldLookupFromSelection(schemaName, queryName, response?.selected, sampleFieldKey);
    } else {
        const picklistName = getLocationQueryVal(location, 'picklistName');
        let response;
        if (isSnapshot && location.query?.selectionKey)
            response = await getSnapshotSelections(location.query.selectionKey);
        else response = await getSelection(location, SCHEMAS.PICKLIST_TABLES.SCHEMA, picklistName);
        if (picklistName) {
            sampleIds = await getSelectedPicklistSamples(picklistName, response.selected, false, undefined);
        } else {
            sampleIds = response.selected.map(Number);
        }
    }

    return sampleIds;
}

export function getGroupedSampleDomainFields(sampleType: string): Promise<GroupedSampleFields> {
    return new Promise((resolve, reject) => {
        getSampleTypeDetails(new SchemaQuery(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType))
            .then(sampleTypeDomain => {
                const metaFields = [],
                    independentFields = [],
                    aliquotFields = [];
                const metricUnit = sampleTypeDomain.get('options').get('metricUnit');

                sampleTypeDomain.domainDesign.fields.forEach(field => {
                    if (field.derivationDataScope === DERIVATION_DATA_SCOPES.CHILD_ONLY) {
                        aliquotFields.push(field.name.toLowerCase());
                    } else if (field.derivationDataScope === DERIVATION_DATA_SCOPES.ALL) {
                        independentFields.push(field.name.toLowerCase());
                    } else {
                        metaFields.push(field.name.toLowerCase());
                    }
                });

                resolve({
                    aliquotFields,
                    independentFields,
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

export function getAliquotSampleIds(selection: List<any>, sampleType: string, viewName: string): Promise<any[]> {
    return getFilteredSampleSelection(selection, sampleType, viewName, [Filter.create(IS_ALIQUOT_COL, true)]);
}

export function getNotInStorageSampleIds(selection: List<any>, sampleType: string, viewName: string): Promise<any[]> {
    return getFilteredSampleSelection(selection, sampleType, viewName, [
        Filter.create('StorageStatus', 'Not in storage'),
    ]);
}

function getFilteredSampleSelection(
    selection: List<any>,
    sampleType: string,
    viewName: string,
    filters: Filter.IFilter[]
): Promise<any[]> {
    const sampleRowIds = getRowIdsFromSelection(selection);
    if (sampleRowIds.length === 0) {
        return new Promise((resolve, reject) => {
            reject('No data is selected');
        });
    }

    return new Promise((resolve, reject) => {
        selectRowsDeprecated({
            schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
            queryName: sampleType,
            viewName,
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
    const sampleRowIds = getRowIdsFromSelection(selection);
    if (sampleRowIds.length === 0) {
        return new Promise((resolve, reject) => {
            reject('No data is selected');
        });
    }

    return new Promise((resolve, reject) => {
        selectRowsDeprecated({
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

export function getSampleStorageId(sampleRowId: number): Promise<number> {
    return new Promise((resolve, reject) => {
        selectRowsDeprecated({
            schemaName: 'inventory',
            queryName: 'ItemSamples',
            columns: 'RowId, SampleId',
            filterArray: [Filter.create('SampleId', sampleRowId)],
        })
            .then(response => {
                const { key } = response;
                const rowId = response.orderedModels[key]?.get(0);
                resolve(rowId); // allow rowId to be undefined, which means sample is not in storage
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

// Used for samples and dataclasses
export function getSelectionLineageData(
    selection: List<any>,
    schema: string,
    query: string,
    viewName: string,
    columns?: string[]
): Promise<ISelectRowsResult> {
    const rowIds = getRowIdsFromSelection(selection);
    if (rowIds.length === 0) {
        return Promise.reject('No data is selected');
    }

    return new Promise((resolve, reject) => {
        selectRowsDeprecated({
            schemaName: schema,
            queryName: query,
            viewName,
            columns: columns ?? List.of('RowId', 'Name', 'LSID').concat(ParentEntityLineageColumns).toArray(),
            filterArray: [Filter.create('RowId', rowIds, Filter.Types.IN)],
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

export const getParentTypeDataForLineage = async (
    parentDataType: EntityDataType,
    data: any[],
    containerPath?: string,
    containerFilter?: Query.ContainerFilter
): Promise<{
    parentIdData: Record<string, ParentIdData>;
    parentTypeOptions: List<IEntityTypeOption>;
}> => {
    let parentTypeOptions = List<IEntityTypeOption>();
    let parentIdData: {};
    if (parentDataType) {
        const options = await getEntityTypeOptions(parentDataType, containerPath, containerFilter);
        parentTypeOptions = List<IEntityTypeOption>(options.get(parentDataType.typeListingSchemaQuery.queryName));

        // get the set of parent row LSIDs so that we can query for the RowId and SampleSet/DataClass for that row
        const parentIDs = [];
        data.forEach(datum => {
            parentIDs.push(...datum[parentDataType.inputColumnName].map(row => row.value));
        });
        parentIdData = await getParentRowIdAndDataType(parentDataType, parentIDs, containerPath);
    }
    return { parentTypeOptions, parentIdData };
};

export function getUpdatedLineageRows(
    lineageRows: Array<Record<string, any>>,
    originalRows: Array<Record<string, any>>,
    aliquots: any[]
): Array<Record<string, any>> {
    const updatedLineageRows = [];

    // iterate through all of the lineage rows to find the ones that have any edit from the initial data row,
    // also remove the aliquot rows from the lineageRows array
    lineageRows?.forEach(row => {
        const rowId = caseInsensitive(row, 'RowId');
        if (aliquots.indexOf(rowId) === -1) {
            // compare each row value looking for any that are different from the original value
            let hasUpdate = false;
            Object.keys(row).every(key => {
                const updatedVal = Utils.isString(row[key])
                    ? row[key].split(', ').sort(naturalSort).join(', ')
                    : row[key];
                let originalVal = originalRows[rowId][key];
                if (List.isList(originalVal) || Array.isArray(originalVal)) {
                    originalVal = originalVal
                        ?.map(parentRow => quoteValueWithDelimiters(parentRow.displayValue, ','))
                        .sort(naturalSort)
                        .join(', ');
                } else {
                    originalVal = quoteValueWithDelimiters(originalVal, ',');
                }

                if (originalVal !== updatedVal) {
                    hasUpdate = true;
                    return false;
                }
                return true;
            });

            if (hasUpdate) updatedLineageRows.push(row);
        }
    });

    return updatedLineageRows;
}

export type ParentIdData = {
    parentId: string | number;
    rowId: number;
};

export function getParentRowIdAndDataType(
    parentDataType: EntityDataType,
    parentIDs: string[],
    containerPath?: string
): Promise<Record<string, ParentIdData>> {
    return new Promise((resolve, reject) => {
        selectRowsDeprecated({
            containerPath,
            schemaName: parentDataType.listingSchemaQuery.schemaName,
            queryName: parentDataType.listingSchemaQuery.queryName,
            viewName: ViewInfo.DETAIL_NAME, // use this to avoid filters on the default view
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
export function getRowIdsFromSelection(selection: List<any>): number[] {
    const rowIds = [];
    if (selection && !selection.isEmpty()) {
        selection.forEach(sel => rowIds.push(parseInt(sel, 10)));
    }
    return rowIds;
}

export interface GroupedSampleDisplayColumns {
    aliquotHeaderDisplayColumns: QueryColumn[];
    displayColumns: QueryColumn[];
    editColumns: QueryColumn[];
}

function isAliquotEditableField(colName: string): boolean {
    return (
        colName === 'name' ||
        colName === 'description' ||
        colName === 'materialexpdate' ||
        (isSampleStatusEnabled() && colName === 'samplestate')
    );
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
            else if (
                sampleTypeDomainFields.aliquotFields.indexOf(colName) > -1 ||
                sampleTypeDomainFields.independentFields.indexOf(colName) > -1
            ) {
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
        if (sampleTypeDomainFields.independentFields.indexOf(colName) > -1) {
            editColumns.push(col);
            return;
        }
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
            containerFilter: getContainerFilter(),
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

/**
 * Create a QueryConfig for this assay's Data grid, filtered to samples for the provided `value`
 * if the assay design has one or more sample lookup columns.
 *
 * The `value` may be a sample id or a labook id and the `singleFilter` or `whereClausePart` should
 * provide a filter for the sample column or columns defined in the assay design.
 */
export function createQueryConfigFilteredBySample(
    model: AssayDefinitionModel,
    value,
    singleFilter: Filter.IFilterType,
    whereClausePart: (fieldKey, value) => string,
    useLsid?: boolean,
    omitSampleCols?: boolean,
    singleFilterValue?: any
): QueryConfig {
    const sampleColumns = model.getSampleColumnFieldKeys();

    if (sampleColumns.isEmpty()) {
        return undefined;
    }

    return {
        baseFilters: [
            model.createSampleFilter(sampleColumns, value, singleFilter, whereClausePart, useLsid, singleFilterValue),
        ],
        omittedColumns: omitSampleCols ? sampleColumns.toArray() : undefined,
        schemaQuery: new SchemaQuery(model.protocolSchemaName, 'Data'),
        title: model.name,
        urlPrefix: model.name,
        includeTotalCount: true,
    };
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
    omitCols?: string[]
): QueryConfig {
    const omitCol = IS_ALIQUOT_COL;
    const schemaQuery = new SchemaQuery(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleSet);

    return {
        id: createGridModelId('sample-aliquots-' + sampleLsid, schemaQuery),
        schemaQuery,
        bindURL: forGridView,
        maxRows: forGridView ? undefined : -1,
        omittedColumns: omitCols ? [...omitCols, omitCol] : [omitCol],
        requiredColumns: [...SAMPLE_STATUS_REQUIRED_COLUMNS, 'StorageStatus'],
        baseFilters: [
            Filter.create('RootMaterialLSID', aliquotRootLsid ?? sampleLsid),
            Filter.create('Lsid', sampleLsid, Filter.Types.EXP_CHILD_OF),
        ],
        includeTotalCount: true,
    };
}

export type SampleAssayResultViewConfig = {
    containerFilter?: string; // Defaults to 'current' when value is undefined
    filterKey: string; // field key of the query/view to use for the sample filter IN clause
    moduleName: string;
    queryName: string;
    sampleRowKey?: string; // sample row property to use for key in baseFilter, defaults to 'RowId' when value is undefined
    schemaName: string;
    title: string;
    viewName?: string;
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

export async function createSessionAssayRunSummaryQuery(sampleIds: number[]): Promise<ISelectRowsResult> {
    // issue with temp table re-use of queryName, invalidate cache to clear any queryDetails for old temp table
    invalidateFullQueryDetailsCache();

    let assayRunsQuery = 'AssayRunsPerSample';
    if (isProductProjectsEnabled() && !isProjectContainer()) {
        assayRunsQuery = 'AssayRunsPerSampleChildProject';
    }

    return await selectRowsDeprecated({
        saveInSession: true,
        schemaName: 'exp',
        sql:
            'SELECT RowId, SampleID, SampleType, Assay, COUNT(*) AS RunCount\n' +
            "FROM (SELECT RowId, SampleID, SampleType, Assay || ' Run Count' AS Assay FROM " +
            assayRunsQuery +
            ') X\n' +
            'WHERE RowId IN (' +
            sampleIds.join(',') +
            ')\n' +
            'GROUP BY RowId, SampleID, SampleType, Assay\n' +
            'PIVOT RunCount BY Assay',
        maxRows: 0, // we don't need any data back here, we just need to get the temp session schema/query
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

export function getSampleTypeRowId(name: string): Promise<number> {
    return new Promise((resolve, reject) => {
        selectRowsDeprecated({
            schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
            queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
            columns: 'RowId,Name',
            filterArray: [Filter.create('Name', name)],
        })
            .then(response => {
                const { models, key } = response;
                const row = Object.values(models[key])[0];
                resolve(caseInsensitive(row, 'RowId')?.value);
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

/**
 * Gets the Set of Ids from selected rowIds based on supplied fieldKey which should be a Lookup
 * @param schemaName of selected rows
 * @param queryName of selected rows
 * @param selected rowIds to pull sampleIds for
 * @param fieldKey field key for the Lookup
 */
export async function getFieldLookupFromSelection(
    schemaName: string,
    queryName: string,
    selected: any[],
    fieldKey: string
): Promise<string[]> {
    const sampleIds = new Set<string>();

    if (fieldKey) {
        const rowIdFieldKey = `${fieldKey}/RowId`; // Pull the rowId of the lookup
        const { data, dataIds } = await getSelectedData(schemaName, queryName, selected, 'RowId,' + rowIdFieldKey); // Include the RowId column to prevent warnings
        if (data) {
            const rows = data.toJS();
            dataIds.forEach(rowId => {
                const val = rows[rowId]?.[rowIdFieldKey]?.value;
                if (val) {
                    sampleIds.add(val);
                }
            });
        }
    }

    return [...sampleIds];
}

export function exportTimelineGrid(
    sampleId: number,
    recentFirst = false,
    sampleEventIds: number[],
    assayEventIds: number[]
): void {
    const url = ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'ExportTimelineGrid', undefined, {
        returnUrl: false,
    });
    const form = new FormData();
    form.append('sampleId', sampleId.toString(10));
    form.append('recentFirst', recentFirst.toString());
    sampleEventIds?.forEach(id => form.append('sampleEventIds', id.toString(10)));
    assayEventIds?.forEach(id => form.append('assayEventIds', id.toString(10)));
    Ajax.request({
        downloadFile: true,
        form,
        method: 'POST',
        url: url.toString(),
    });
}

// optional timezone param used for teamcity jest test only
export function getTimelineEvents(sampleId: number, timezone?: string): Promise<TimelineEventModel[]> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getTimeline.api'),
            method: 'GET',
            params: { sampleId },
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    const events: TimelineEventModel[] = [];
                    if (response.events) {
                        (response.events as []).forEach(event =>
                            events.push(TimelineEventModel.create(event, timezone))
                        );
                    }
                    resolve(events);
                } else {
                    console.error('Sample timeline is empty. Timeline audit may have been disabled.');
                    reject(
                        'There was a problem retrieving the sample timeline. Timeline audit may have been disabled.'
                    );
                }
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error('Problem retrieving the sample timeline', error);
                reject('There was a problem retrieving the sample timeline.');
            }),
        });
    });
}
