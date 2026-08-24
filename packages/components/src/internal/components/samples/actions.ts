/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Map } from 'immutable';
import { ActionURL, Ajax, Domain, Experiment, Filter, Query, Utils } from '@labkey/api';

import { IEntityTypeDetails } from '../entities/models';
import { deleteEntityType } from '../entities/actions';

import { getSelectedDataDeprecated } from '../../actions';

import { caseInsensitive } from '../../util/utils';
import { request } from '../../request';

import { DERIVATION_DATA_SCOPES, STORAGE_UNIQUE_ID_CONCEPT_URI } from '../domainproperties/constants';

import { isProductFoldersEnabled, isProjectContainer, isSampleStatusEnabled } from '../../app/utils';
import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { SCHEMAS } from '../../schemas';

import {
    getQueryDetails,
    getRequestAuditDetail,
    invalidateFullQueryDetailsCache,
    selectDistinctRows,
} from '../../query/api';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { DomainDetails } from '../domainproperties/models';
import { QueryColumn } from '../../../public/QueryColumn';
import { resolveErrorMessage } from '../../util/messaging';
import { TimelineEventModel } from '../auditlog/models';

import { Row, selectRows } from '../../query/selectRows';

import { QueryInfo } from '../../../public/QueryInfo';

import {
    ALL_AMOUNT_AND_UNITS_COLUMNS_LC,
    NON_ARCHIVED_COLOR_FILTER,
    SAMPLE_COLOR_COLUMN_NAME,
    SAMPLE_STORAGE_COLUMNS_LC,
    STORED_AMOUNT_FIELDS,
} from './constants';
import { FindField, GroupedSampleFields, SampleColorModel, SampleState, SampleStateType } from './models';
import { executeSql, ExecuteSqlResponseWithSession } from '../../query/executeSql';
import { EDIT_METHOD } from '../../constants';

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
    const aliquotFields: string[] = [];
    const independentFields: string[] = [];
    const metaFields: string[] = [];

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

function getSampleTypeRow(name: string, fieldKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
        selectRows({
            schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
            columns: 'Name,' + fieldKey,
        })
            .then(response => {
                const { rows } = response;
                let rowFound;
                rows.forEach(row => {
                    if (name.toLowerCase() === caseInsensitive(row, 'Name').value.toLowerCase()) {
                        rowFound = row;
                        return;
                    }
                });

                if (!rowFound) {
                    reject(`Sample Type with name '${name}' not found.`);
                    return;
                }
                resolve(caseInsensitive(rowFound, fieldKey).value);
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

export function getSampleTypeRowId(name: string): Promise<number> {
    return getSampleTypeRow(name, 'RowId');
}

export function getSampleTypeLabelColor(name: string): Promise<string> {
    return getSampleTypeRow(name, 'LabelColor');
}

export async function getSampleColors(
    includeArchive = false,
    checkInUse = false,
    containerPath?: string,
    includeSharedColors = true,
): Promise<SampleColorModel[]> {
    const response = await selectRows({
        columns: 'RowId,Label,Color,Archived,Container/Path',
        containerFilter: includeSharedColors ? undefined : Query.ContainerFilter.current,
        containerPath,
        filterArray: includeArchive ? undefined : [NON_ARCHIVED_COLOR_FILTER],
        schemaQuery: SCHEMAS.EXP_TABLES.DATA_COLORS,
        sort: 'Label',
    });

    const colors: SampleColorModel[] = response.rows.map(row => ({
        rowId: caseInsensitive(row, 'RowId').value,
        label: caseInsensitive(row, 'Label').value,
        color: caseInsensitive(row, 'Color').value,
        archived: !!caseInsensitive(row, 'Archived').value,
        containerPath: caseInsensitive(row, 'Container/Path')?.value,
    }));

    if (!checkInUse || colors.length === 0) {
        return colors;
    }

    const inUseResponse = await selectDistinctRows({
        column: SAMPLE_COLOR_COLUMN_NAME,
        containerPath,
        schemaName: SCHEMAS.EXP_TABLES.MATERIALS.schemaName,
        queryName: SCHEMAS.EXP_TABLES.MATERIALS.queryName,
    });
    const inUseRowIds = new Set<number>(
        (inUseResponse.values ?? []).filter(value => value !== null && value !== undefined).map(value => Number(value))
    );

    return colors.map(color => ({ ...color, inUse: inUseRowIds.has(color.rowId) }));
}

export function getColorSampleTypeExclusions(colorRowId: number, containerPath?: string): Promise<number[]> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL(
                SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                'getColorDataTypeExclusion.api',
                containerPath,
                { rowId: colorRowId }
            ),
            success: Utils.getCallbackWrapper(response => resolve(response?.excludedSampleTypes ?? [])),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(response);
            }),
        });
    });
}

export async function getSampleTypeColorExclusions(
    sampleTypeRowId?: number,
    sampleTypeName?: string,
    containerPath?: string
): Promise<number[]> {
    if (!sampleTypeRowId && !sampleTypeName) {
        throw new Error('Either sampleTypeRowId or sampleTypeName is required.');
    }
    const rowId = sampleTypeRowId ?? (await getSampleTypeRowId(sampleTypeName));
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL(
                SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                'getSampleTypeColorExclusion.api',
                containerPath,
                { rowId }
            ),
            success: Utils.getCallbackWrapper(response => resolve(response?.excludedColors ?? [])),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(response);
            }),
        });
    });
}

// Single write path for a sample color: creates (no rowId) or updates the color (label/color/archived) and, in the
// same server transaction, applies the sample-type exclusion delta (only the changed types, so the request scales with
// the edit, not the total number of sample types). The server (UpdateColorSettingsAction) audits each affected type
// and returns the color's rowId.
export function updateColorSettings(
    color: SampleColorModel,
    newlyDisabledTypeIds: number[],
    newlyEnabledTypeIds: number[],
    containerPath?: string
): Promise<number> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL(
                SAMPLE_MANAGER_APP_PROPERTIES.controllerName,
                'updateColorSettings.api',
                containerPath
            ),
            method: 'POST',
            jsonData: {
                rowId: color.rowId,
                label: color.label,
                color: color.color,
                archived: color.archived,
                newlyDisabledTypes: newlyDisabledTypeIds,
                newlyEnabledTypes: newlyEnabledTypeIds,
            },
            success: Utils.getCallbackWrapper(response => resolve(response?.rowId)),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(response);
            }),
        });
    });
}

export interface GroupedSampleDisplayColumns {
    aliquotHeaderDisplayColumns: QueryColumn[];
    aliquotOnlyColumns: string[]; // should hide from parent panel
    displayColumns: QueryColumn[];
    editColumns: QueryColumn[];
}

function isAliquotEditableField(colName: string): boolean {
    return (
        colName === 'name' ||
        colName === 'description' ||
        colName === 'materialexpdate' ||
        colName === 'expmaterialcolor' ||
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
    const aliquotOnlyColumns = [];

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
                if (sampleTypeDomainFields.aliquotFields.indexOf(lcFieldKey) > -1)
                    aliquotOnlyColumns.push(col.fieldKey);
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
        aliquotOnlyColumns,
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

    // GitHub Issue #643: need to account for the case with no sampleIds
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
export function getTimelineEvents(
    sampleId: number,
    timezone?: string,
    inheritedFields?: string[]
): Promise<TimelineEventModel[]> {
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
    isDiscard = false,
    editMethod?: EDIT_METHOD,
    jobActionId?: number
): Promise<any> {
    if (sampleStorageData.length === 0) {
        return Promise.resolve();
    }

    return new Promise<any>((resolve, reject) => {
        return Ajax.request({
            url: ActionURL.buildURL('inventory', 'updateSampleStorageData.api', containerPath),
            jsonData: {
                jobActionId,
                sampleRows: sampleStorageData,
                [STORED_AMOUNT_FIELDS.AUDIT_COMMENT]: userComment,
                ...getRequestAuditDetail(editMethod),
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
