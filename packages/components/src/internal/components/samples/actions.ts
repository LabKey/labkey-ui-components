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
import { ActionURL, Ajax, Domain, Experiment, Filter, Query, Utils } from '@labkey/api';

import { IEntityTypeDetails } from '../entities/models';
import { deleteEntityType } from '../entities/actions';

import { getSelectedDataDeprecated } from '../../actions';

import { caseInsensitive } from '../../util/utils';
import { request } from '../../request';

import { ParentEntityLineageColumns } from '../entities/constants';

import { DERIVATION_DATA_SCOPES, STORAGE_UNIQUE_ID_CONCEPT_URI } from '../domainproperties/constants';

import { isProductFoldersEnabled, isProjectContainer, isSampleStatusEnabled } from '../../app/utils';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { SCHEMAS } from '../../schemas';

import {
    getQueryDetails,
    invalidateFullQueryDetailsCache,
    ISelectRowsResult,
    selectDistinctRows,
    selectRowsDeprecated,
} from '../../query/api';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { DomainDetails } from '../domainproperties/models';
import { QueryColumn } from '../../../public/QueryColumn';
import { resolveErrorMessage } from '../../util/messaging';
import { TimelineEventModel } from '../auditlog/models';

import { Row, selectRows } from '../../query/selectRows';

import { QueryInfo } from '../../../public/QueryInfo';

import { ALL_AMOUNT_AND_UNITS_COLUMNS_LC, SAMPLE_STORAGE_COLUMNS_LC, STORED_AMOUNT_FIELDS } from './constants';
import { FindField, GroupedSampleFields, SampleState, SampleStateType } from './models';
import { executeSql, ExecuteSqlResponseWithSession } from '../../query/executeSql';

export async function getSampleSet(config: IEntityTypeDetails): Promise<any> {
    const response = await request({
        url: ActionURL.buildURL('experiment', 'getSampleType.api'),
        params: config,
        errorLogMsg: 'Failed to fetch sample type',
    });

    return Map(response);
}

// TODO: This should share implementation with api.domain.fetchDomainDetails / api.domain.getDataClassDetails
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

export function deleteSampleSet(rowId: number, containerPath?: string, auditUserComment?: string): Promise<void> {
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
 * @param containerPath The container path where the query will be made.
 */
export async function fetchSamples(
    schemaQuery: SchemaQuery,
    sampleColumn: QueryColumn,
    filterArray: Filter.IFilter[],
    displayValueKey: string,
    valueKey: string,
    containerPath?: string
): Promise<OrderedMap<any, any>> {
    const response = await selectRowsDeprecated({
        schemaName: schemaQuery.schemaName,
        queryName: schemaQuery.queryName,
        viewName: schemaQuery.viewName,
        columns: ['RowId', displayValueKey, valueKey],
        filterArray,
        containerPath,
    });

    const { key, models, orderedModels } = response;
    const rows = models[key];
    const data = OrderedMap<any, any>().asMutable();

    orderedModels[key].forEach(id => {
        data.setIn(
            [id, sampleColumn.index],
            List([
                {
                    displayValue: caseInsensitive(rows[id], displayValueKey)?.value,
                    value: caseInsensitive(rows[id], valueKey)?.value,
                },
            ])
        );
    });

    return data.asImmutable();
}

export async function getGroupedSampleDomainFields(sampleType: string): Promise<GroupedSampleFields> {
    // use domain fields as we only want to include fields defined by the user, but use queryInfo to map to fieldKey
    const sampleTypeDomain = await getSampleTypeDetails(new SchemaQuery(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType));
    const queryInfo = await getQueryDetails(new SchemaQuery(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType));

    return _getGroupedSampleDomainFields(sampleTypeDomain, queryInfo);
}

// exported for jest testing
export function _getGroupedSampleDomainFields(
    sampleTypeDomain: DomainDetails,
    queryInfo: QueryInfo
): GroupedSampleFields {
    const metaFields = [];
    const independentFields = [];
    const aliquotFields = [];

    sampleTypeDomain.domainDesign.fields.forEach(field => {
        const col = queryInfo.getColumnFromName(field.name);
        if (field.derivationDataScope === DERIVATION_DATA_SCOPES.CHILD_ONLY) {
            aliquotFields.push(col.fieldKey.toLowerCase());
        } else if (field.derivationDataScope === DERIVATION_DATA_SCOPES.ALL) {
            independentFields.push(col.fieldKey.toLowerCase());
        } else if (!field.isCalculatedField()) {
            metaFields.push(col.fieldKey.toLowerCase());
        }
    });

    return {
        aliquotFields,
        independentFields,
        metaFields,
        metricUnit: sampleTypeDomain.options.get('metricUnit'),
    };
}

export async function getSampleStorageId(sampleRowId: number): Promise<number> {
    const result = await selectRows({
        columns: 'RowId, SampleId',
        filterArray: [Filter.create('SampleId', sampleRowId)],
        schemaQuery: SCHEMAS.INVENTORY.ITEM_SAMPLES,
    });

    // allow rowId to be undefined, which means sample is not in storage
    if (result.rows.length === 0) {
        return undefined;
    }

    return caseInsensitive(result.rows[0], 'RowId').value;
}

// Used for samples and dataclasses
export function getSelectionLineageData(
    selections: Set<string>,
    schema: string,
    query: string,
    viewName: string,
    extraColumns: string[] = [],
    sort: string | undefined
): Promise<ISelectRowsResult> {
    if (selections?.size === 0) return Promise.reject('No data is selected.');
    const rowIds = Array.from(selections).map(s => parseInt(s, 10));

    return selectRowsDeprecated({
        columns: List.of('RowId', 'Name', 'LSID', 'Folder')
            .concat(ParentEntityLineageColumns)
            .toArray()
            .concat(extraColumns),
        filterArray: [Filter.create('RowId', rowIds, Filter.Types.IN)],
        queryName: query,
        schemaName: schema,
        sort,
        viewName,
    });
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
    isAliquot: boolean,
    canBeInStorage: boolean
): GroupedSampleDisplayColumns {
    const editColumns = [];
    const displayColumns = [];
    const aliquotHeaderDisplayColumns = [];

    allDisplayColumns.forEach(col => {
        const lcFieldKey = col.fieldKey.toLowerCase();
        if (SAMPLE_STORAGE_COLUMNS_LC.indexOf(lcFieldKey) > -1) {
            return;
        }
        if (ALL_AMOUNT_AND_UNITS_COLUMNS_LC.indexOf(lcFieldKey) > -1 && canBeInStorage) {
            return;
        }
        if (isAliquot) {
            // barcodes belong to the individual sample or aliquot (but not both)
            if (col.conceptURI === STORAGE_UNIQUE_ID_CONCEPT_URI) {
                aliquotHeaderDisplayColumns.push(col);
            }
            // display parent meta for aliquot
            else if (
                sampleTypeDomainFields.aliquotFields.indexOf(lcFieldKey) > -1 ||
                sampleTypeDomainFields.independentFields.indexOf(lcFieldKey) > -1
            ) {
                aliquotHeaderDisplayColumns.push(col);
            }
        } else {
            if (sampleTypeDomainFields.aliquotFields.indexOf(lcFieldKey) === -1) {
                displayColumns.push(col);
            }
        }
    });

    allUpdateColumns.forEach(col => {
        const lcFieldKey = col.fieldKey.toLowerCase();
        if (SAMPLE_STORAGE_COLUMNS_LC.indexOf(lcFieldKey) > -1) {
            return;
        }
        if (ALL_AMOUNT_AND_UNITS_COLUMNS_LC.indexOf(lcFieldKey) > -1 && canBeInStorage) {
            return;
        }
        if (sampleTypeDomainFields.independentFields.indexOf(lcFieldKey) > -1) {
            editColumns.push(col);
            return;
        }
        if (isAliquot) {
            if (sampleTypeDomainFields.aliquotFields.indexOf(lcFieldKey) > -1) {
                editColumns.push(col);
            } else if (isAliquotEditableField(lcFieldKey)) {
                editColumns.push(col);
            }
        } else {
            if (sampleTypeDomainFields.aliquotFields.indexOf(lcFieldKey) === -1) {
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

export async function getSampleAliquotRows(sampleId: number | string): Promise<Row[]> {
    const result = await executeSql({
        schemaName: SCHEMAS.EXP_TABLES.MATERIALS.schemaName,
        sql: `SELECT RowId, Name FROM materials WHERE RowId <> RootMaterialRowId AND RootMaterialRowId = ${sampleId}`,
    });

    return result.rows;
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

export async function getSampleAssayResultViewConfigs(): Promise<SampleAssayResultViewConfig[]> {
    const response = await request<{ configs: SampleAssayResultViewConfig[] }>({
        url: ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getSampleAssayResultsViewConfigs.api'),
        errorLogMsg: 'Failed to load sample assay result view configuration',
    });

    return response.configs ?? [];
}

export function createSessionAssayRunSummaryQuery(sampleIds: number[]): Promise<ExecuteSqlResponseWithSession> {
    // issue with temp table re-use of queryName, invalidate cache to clear any queryDetails for old temp table
    invalidateFullQueryDetailsCache();

    let assayRunsQuery = 'AssayRunsPerSample';
    if (isProductFoldersEnabled() && !isProjectContainer()) {
        assayRunsQuery = 'AssayRunsPerSampleChildFolder';
    }

    // GitHub Issue 748: need to account for the case with no sampleIds
    let whereClause = 'WHERE RowId IN (' + sampleIds.join(',') + ')\n';
    if (sampleIds.length === 0) {
        whereClause = 'WHERE 1 = 0\n'; // add where clause that will always result in zero rows
    }

    return executeSql({
        saveInSession: true,
        schemaName: SCHEMAS.ASSAY_TABLES.SCHEMA,
        sql:
            'SELECT RowId, SampleID, SampleType, Assay, COUNT(*) AS RunCount\n' +
            "FROM (SELECT RowId, SampleID, SampleType, Assay || ' Run Count' AS Assay FROM " +
            assayRunsQuery +
            ') X\n' +
            whereClause +
            'GROUP BY RowId, SampleID, SampleType, Assay\n' +
            'PIVOT RunCount BY Assay',
        maxRows: 0, // we don't need any data back here, we just need to get the temp session schema/query
    });
}

export async function getDistinctAssaysPerSample(sampleIds: number[]): Promise<string[]> {
    let assayRunsQuery = 'AssayRunsPerSample';
    if (isProductFoldersEnabled() && !isProjectContainer()) {
        assayRunsQuery = 'AssayRunsPerSampleChildFolder';
    }

    try {
        const results = await selectDistinctRows({
            schemaName: SCHEMAS.ASSAY_TABLES.SCHEMA,
            queryName: assayRunsQuery,
            column: 'Assay',
            filterArray: [Filter.create('RowId', sampleIds, Filter.Types.IN)],
        });

        return results.values.filter(v => v !== null).map(v => v.toLowerCase());
    } catch (e) {
        // console.error already happens in failure case of selectDistinctRows
        return undefined;
    }
}

export function getSampleStatuses(includeInUse = false, containerPath?: string): Promise<SampleState[]> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: ActionURL.buildURL(
                SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                'getSampleStatuses.api',
                containerPath,
                {
                    includeInUse,
                }
            ),
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

/**
 * The default status for a discarded sample should be Consumed. This method compensates for the
 * possibility that there may be more than one sample status with of type 'consumed'.
 * - If there is only one status of type 'consumed', this is the default, regardless of the label
 * - If there are multiple 'consumed' statuses, use the one labeled 'Consumed' as the default, if it exists.
 * - In other cases, do not choose a default.
 */
export async function getDefaultDiscardStatus(containerPath?: string): Promise<number> {
    try {
        const allStatuses = await getSampleStatuses(false, containerPath);
        const consumedStatuses = allStatuses.filter(state => state.stateType === SampleStateType.Consumed);
        if (consumedStatuses.length === 1) {
            return consumedStatuses[0].rowId;
        }
        const consumedLabels = consumedStatuses.filter(
            status => status.label.toLowerCase() === SampleStateType.Consumed.toLowerCase()
        );
        if (consumedLabels.length === 1) {
            return consumedLabels[0].rowId;
        }
        return undefined;
    } catch (error) {
        return undefined;
    }
}

/**
 * Gets the Set of Ids from selected rowIds based on supplied fieldKey which should be a Lookup
 * @param schemaName of selected rows
 * @param queryName of selected rows
 * @param selected rowIds to pull sampleIds for
 * @param fieldKey field key for the Lookup
 * @param keyColumn the pkCol
 */
export async function getLookupRowIdsFromSelection(
    schemaName: string,
    queryName: string,
    selected: any[],
    fieldKey: string,
    keyColumn = 'RowId'
): Promise<number[]> {
    const sampleIds = new Set<number>();

    if (fieldKey) {
        const rowIdFieldKey = `${fieldKey}/RowId`; // Pull the rowId of the lookup
        const columns = [keyColumn, rowIdFieldKey].join(',');
        const { data, dataIds } = await getSelectedDataDeprecated(
            schemaName,
            queryName,
            selected,
            columns,
            undefined,
            undefined,
            undefined,
            keyColumn
        ); // Include the RowId column to prevent warnings
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

    return Array.from(sampleIds);
}

// optional timezone param used for teamcity jest test only
export function getTimelineEvents(sampleId: number, timezone?: string, inheritedFields?: string[]): Promise<TimelineEventModel[]> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getTimeline.api'),
            params: { sampleId },
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    const events: TimelineEventModel[] = [];
                    if (response.events) {
                        (response.events as []).forEach(event =>
                            events.push(TimelineEventModel.create(event, timezone, inheritedFields))
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

export interface SampleStorageData {
    freezeThawCount?: number;
    itemId?: number;
    materialId: number;
    storedAmount?: number;
    units?: string;
}

export function updateSampleStorageData(
    sampleStorageData: SampleStorageData[],
    containerPath?: string,
    userComment?: string,
    isDiscard = false
): Promise<any> {
    if (sampleStorageData.length === 0) {
        return Promise.resolve();
    }

    return new Promise<any>((resolve, reject) => {
        return Ajax.request({
            url: ActionURL.buildURL('inventory', 'updateSampleStorageData.api', containerPath),
            jsonData: {
                sampleRows: sampleStorageData,
                [STORED_AMOUNT_FIELDS.AUDIT_COMMENT]: userComment,
                isDiscard,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(resolveErrorMessage(response));
            }),
        });
    });
}

export function getSampleCounter(seqType: 'rootSampleCount' | 'sampleCount', containerPath?: string): Promise<number> {
    return new Promise((resolve, reject) => {
        Experiment.getEntitySequence({
            containerPath,
            seqType,
            kindName: 'SampleSet',
            success: response => {
                if (response.success) {
                    resolve(response['value']);
                } else {
                    reject({ error: 'Unable to get ' + seqType });
                }
            },
            failure: error => {
                reject(error);
            },
        });
    });
}

export function saveSampleCounter(
    newCount: number,
    seqType: 'rootSampleCount' | 'sampleCount',
    containerPath?: string
): Promise<number> {
    return new Promise((resolve, reject) => {
        Experiment.setEntitySequence({
            newValue: newCount,
            containerPath,
            seqType,
            kindName: 'SampleSet',
            success: response => {
                if (response.success) {
                    resolve(response);
                } else {
                    console.error(response);
                    reject(response.error);
                }
            },
            failure: error => {
                console.error(error);
                reject(resolveErrorMessage(error));
            },
        });
    });
}

export async function hasExistingSamples(isRoot?: boolean, containerPath?: string): Promise<boolean> {
    let dataCountSql =
        'SELECT m.Name As SampleName ' +
        '\n' +
        'FROM materials m WHERE EXISTS ' +
        '\n' +
        '( SELECT * FROM materials mi WHERE mi.RowId = m.RowId';
    if (isRoot) dataCountSql += ' AND mi.RootMaterialRowId = mi.RowId';
    dataCountSql += ')';

    const result = await executeSql({
        containerPath,
        containerFilter: Query.ContainerFilter.allInProject,
        schemaName: SCHEMAS.EXP_TABLES.SCHEMA,
        sql: dataCountSql,
    });

    return !!result.rows[0]?.SampleName?.value;
}
