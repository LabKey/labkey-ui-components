import { ActionURL, Ajax, AuditBehaviorTypes, Filter, getServerContext, Query, Utils } from '@labkey/api';
import { List, Map } from 'immutable';

import { getSelectedData, getSelected, setSnapshotSelections } from '../../actions';

import { buildURL } from '../../url/AppURL';
import { SampleOperation } from '../samples/constants';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { getFilterForSampleOperation, isSamplesSchema } from '../samples/utils';
import { importData, InsertOptions } from '../../query/api';
import { caseInsensitive, generateId, handleRequestFailure } from '../../util/utils';
import { SampleCreationType } from '../samples/models';

import { SHARED_CONTAINER_PATH } from '../../constants';
import { naturalSortByProperty } from '../../../public/sort';
import { QueryInfo } from '../../../public/QueryInfo';
import { SCHEMAS } from '../../schemas';

import { Row, selectRows, SelectRowsResponse } from '../../query/selectRows';

import { ViewInfo } from '../../ViewInfo';

import { Container } from '../base/models/Container';

import { getProjectDataExclusion, hasModule } from '../../app/utils';

import { resolveErrorMessage } from '../../util/messaging';

import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { getInitialParentChoices, isAssayDesignEntity, isDataClassEntity, isSampleEntity } from './utils';
import {
    AssayRunOperation,
    DATA_CLASS_IMPORT_PREFIX,
    DataClassDataType,
    DataOperation,
    SAMPLE_SET_IMPORT_PREFIX,
    SampleTypeDataType,
} from './constants';
import {
    CrossFolderSelectionResult,
    DataTypeEntity,
    DisplayObject,
    EntityChoice,
    EntityDataType,
    EntityIdCreationModel,
    EntityParentType,
    EntityTypeOption,
    IEntityTypeOption,
    IParentAlias,
    IParentOption,
    MoveEntitiesResult,
    OperationConfirmationData,
    ProjectConfigurableDataType,
    RemappedKeyValues,
} from './models';

export function getOperationConfirmationData(
    dataType: EntityDataType,
    rowIds: string[] | number[],
    selectionKey?: string,
    useSnapshotSelection?: boolean,
    extraParams?: Record<string, any>
): Promise<OperationConfirmationData> {
    if (!selectionKey && !rowIds?.length) {
        return Promise.resolve(new OperationConfirmationData());
    }

    return new Promise((resolve, reject) => {
        let params;
        if (selectionKey) {
            params = {
                dataRegionSelectionKey: selectionKey,
            };
            if (useSnapshotSelection) {
                params['useSnapshotSelection'] = true;
            }
        } else {
            params = {
                rowIds,
            };
        }
        if (extraParams) {
            params = Object.assign(params, extraParams);
        }
        return Ajax.request({
            url: buildURL(dataType.operationConfirmationControllerName, dataType.operationConfirmationActionName),
            method: 'POST',
            jsonData: params,
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    resolve(new OperationConfirmationData(response.data));
                } else {
                    console.error('Response failure when getting operation confirmation data', response.exception);
                    reject(response.exception);
                }
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error('Error getting operation confirmation data', response);
                reject(response ? response.exception : 'Unknown error getting operation confirmation data.');
            }),
        });
    });
}

export function getDeleteConfirmationData(
    dataType: EntityDataType,
    rowIds: string[] | number[],
    selectionKey?: string,
    useSnapshotSelection?: boolean
): Promise<OperationConfirmationData> {
    if (isSampleEntity(dataType)) {
        return getSampleOperationConfirmationData(SampleOperation.Delete, rowIds, selectionKey, useSnapshotSelection);
    }
    return getOperationConfirmationData(
        dataType,
        rowIds,
        selectionKey,
        useSnapshotSelection,
        isDataClassEntity(dataType)
            ? {
                  dataOperation: DataOperation.Delete,
              }
            : isAssayDesignEntity(dataType)
            ? { dataOperation: AssayRunOperation.Delete }
            : undefined
    );
}

export function getSampleOperationConfirmationData(
    operation: SampleOperation,
    rowIds?: string[] | number[],
    selectionKey?: string,
    useSnapshotSelection?: boolean
): Promise<OperationConfirmationData> {
    return getOperationConfirmationData(SampleTypeDataType, rowIds, selectionKey, useSnapshotSelection, {
        sampleOperation: SampleOperation[operation],
    });
}

async function getSelectedParents(
    schemaQuery: SchemaQuery,
    filterArray: Filter.IFilter[],
    isAliquotParent?: boolean,
    orderedRowIds?: string[]
): Promise<List<EntityParentType>> {
    const isSampleParent = isSamplesSchema(schemaQuery);
    const columns = ['LSID', 'Name', 'RowId'];
    if (isSampleParent) {
        columns.push('SampleSet');
    }

    const response = await selectRows({ columns, filterArray, schemaQuery });

    if (isSampleParent) {
        return resolveSampleParentTypes(response, isAliquotParent, orderedRowIds);
    }

    return resolveEntityParentTypeFromIds(schemaQuery, response, isAliquotParent, orderedRowIds);
}

export async function getSelectedItemSamples(selectedItemIds: string[]): Promise<number[]> {
    const { queryName, schemaName } = SCHEMAS.INVENTORY.ITEMS;
    const { data } = await getSelectedData(schemaName, queryName, selectedItemIds, 'RowId, MaterialId');
    return data.map(row => row.getIn(['MaterialId', 'value'])).toArray();
}

function resolveSampleParentTypes(
    response: SelectRowsResponse,
    isAliquotParent?: boolean,
    orderedRowIds?: string[]
): List<EntityParentType> {
    const groups: { [key: string]: any[] } = {};
    const results = [];

    // The transformation done here makes the entities compatible with the editable grid
    response.rows.forEach(row => {
        const displayValue = caseInsensitive(row, 'Name')?.value;
        const sampleType = caseInsensitive(row, 'SampleSet')?.displayValue;
        const value = caseInsensitive(row, 'RowId')?.value;

        if (!groups.hasOwnProperty(sampleType)) {
            groups[sampleType] = [];
        }

        groups[sampleType].push({ displayValue, value });
    });

    let index = 1;
    for (const [sampleType, data] of Object.entries(groups)) {
        results.push(
            EntityParentType.create({
                index,
                schema: 'samples',
                query: sampleType?.toLowerCase(),
                value: List<DisplayObject>(data.sort(_getEntitySort(orderedRowIds))),
                isAliquotParent,
            })
        );
        index++;
    }

    return List<EntityParentType>(results);
}

/**
 * We have either an initialParents array, and determine the schemaQuery from the first id in that list
 * or a selection key and determine the schema query from parsing the selection key.  In any case, this
 * assumes parents from a single data type.
 * @param initialParents
 * @param selectionKey the key for the parent selection
 * @param isSnapshotSelection whether this selection key is a snapshot selection or not
 * @param creationType
 * @param isItemSamples
 * @param targetQueryName
 */
async function initParents(
    initialParents: string[],
    selectionKey: string,
    isSnapshotSelection,
    creationType?: SampleCreationType,
    isItemSamples?: boolean,
    targetQueryName?: string
): Promise<List<EntityParentType>> {
    const isAliquotParent = creationType === SampleCreationType.Aliquots;

    if (selectionKey) {
        const { schemaQuery } = SchemaQuery.parseSelectionKey(selectionKey);
        const selectionResponse = await getSelected(selectionKey, isSnapshotSelection);

        const filterArray = [Filter.create('RowId', selectionResponse.selected, Filter.Types.IN)];

        const opFilter = getFilterForSampleOperation(SampleOperation.EditLineage);
        if (opFilter) {
            filterArray.push(opFilter);
        }

        return getSelectedParents(
            schemaQuery,
            filterArray,
            isAliquotParent,
            isSnapshotSelection ? selectionResponse.selected : undefined
        );
    } else if (initialParents?.length > 0) {
        const [parent] = initialParents;
        const [schema, query, value] = parent.toLowerCase().split(':');

        // if the parent key doesn't have a value, we don't need to make the request to getSelectedParents
        if (value === undefined) {
            return List<EntityParentType>([
                EntityParentType.create({
                    index: 1,
                    schema,
                    query,
                    value: List<DisplayObject>(),
                    isParentTypeOnly: true, // tell the UI to keep the parent type but not add any default rows to the editable grid
                    isAliquotParent,
                }),
            ]);
        }

        const filterArray = [Filter.create('RowId', value)];
        const opFilter = getFilterForSampleOperation(SampleOperation.EditLineage);
        if (opFilter) {
            filterArray.push(opFilter);
        }

        return getSelectedParents(new SchemaQuery(schema, query), filterArray, isAliquotParent);
    } else if (isAliquotParent && targetQueryName) {
        return List<EntityParentType>([
            EntityParentType.create({
                index: 1,
                schema: SCHEMAS.SAMPLE_SETS.SCHEMA,
                query: targetQueryName,
                value: List<DisplayObject>(),
                isParentTypeOnly: true, // tell the UI to keep the parent type but not add any default rows to the editable grid
                isAliquotParent,
            }),
        ]);
    }

    return List<EntityParentType>();
}

function _getEntitySort(orderedIds: string[]) {
    return (a, b) => {
        return orderedIds.indexOf(a.value + '') - orderedIds.indexOf(b.value + '');
    };
}

function resolveEntityParentTypeFromIds(
    schemaQuery: SchemaQuery,
    response: SelectRowsResponse,
    isAliquotParent?: boolean,
    orderedRowIds?: string[]
): List<EntityParentType> {
    // The transformation done here makes the entities compatible with the editable grid
    let data: DisplayObject[] = response.rows
        .map(row => extractEntityTypeOptionFromRow(row))
        .map(({ label, rowId }) => ({ displayValue: label, value: rowId }));
    if (orderedRowIds?.length > 1) data = data.sort(_getEntitySort(orderedRowIds));

    return List<EntityParentType>([
        EntityParentType.create({
            index: 1,
            schema: schemaQuery.schemaName,
            query: schemaQuery.queryName,
            value: List(data),
            isAliquotParent,
        }),
    ]);
}

export function extractEntityTypeOptionFromRow(
    row: Row,
    lowerCaseValue = true,
    entityDataType?: EntityDataType
): IEntityTypeOption {
    const name = caseInsensitive(row, 'Name').value;
    return {
        label: name,
        lsid: caseInsensitive(row, 'LSID').value,
        rowId: caseInsensitive(row, 'RowId').value,
        value: lowerCaseValue ? name.toLowerCase() : name, // we match values on lower case because (at least) when parsed from an id they are lower case
        query: name,
        entityDataType,
        isFromSharedContainer: caseInsensitive(row, 'Folder/Path')?.value === SHARED_CONTAINER_PATH,
    };
}

// exported for jest testing
export async function getChosenParentData(
    model: EntityIdCreationModel,
    parentEntityDataTypes: Map<string, EntityDataType>,
    allowParents: boolean,
    isItemSamples?: boolean,
    targetQueryName?: string,
    combineParentTypes?: boolean
): Promise<Partial<EntityIdCreationModel>> {
    const entityParents = EntityIdCreationModel.getEmptyEntityParents(
        parentEntityDataTypes.reduce(
            (names, entityDataType) => names.push(entityDataType.typeListingSchemaQuery.queryName),
            List<string>()
        )
    );

    if (allowParents) {
        const parentSchemaNames = parentEntityDataTypes.keySeq();
        const { creationType, originalParents, selectionKey, isSnapshotSelection } = model;

        const chosenParents = await initParents(
            originalParents,
            selectionKey,
            isSnapshotSelection,
            creationType,
            isItemSamples,
            targetQueryName
        );

        // if we have an initial parent, we want to start with a row in the grid (entityCount = 1) otherwise we start with none
        let totalParentValueCount = 0,
            isParentTypeOnly = false,
            parentEntityDataType;
        chosenParents.forEach(chosenParent => {
            if (chosenParent.value !== undefined && parentSchemaNames.contains(chosenParent.schema)) {
                totalParentValueCount += chosenParent.value.size;
                isParentTypeOnly = chosenParent.isParentTypeOnly;

                // If combining parent types, use the first parent type for the queryName
                parentEntityDataType = (
                    combineParentTypes
                        ? parentEntityDataTypes.valueSeq().first()
                        : parentEntityDataTypes.get(chosenParent.schema)
                ).typeListingSchemaQuery.queryName;
            }
        });

        const numPerParent = model.numPerParent ?? 1;
        const validEntityCount = totalParentValueCount
            ? creationType === SampleCreationType.PooledSamples
                ? numPerParent
                : totalParentValueCount * numPerParent
            : 0;

        if (validEntityCount >= 1 || isParentTypeOnly || creationType === SampleCreationType.Aliquots) {
            return {
                entityCount: validEntityCount,
                entityParents: entityParents.set(parentEntityDataType, chosenParents),
            };
        }
    }

    // if we did not find a valid parent, we clear out the parents and selection key from the model as they aren't relevant
    return {
        originalParents: undefined,
        selectionKey: undefined,
        entityParents,
        entityCount: 0,
    };
}

// get back a map from the typeListQueryName (e.g., 'SampleSet') and the list of options for that query
// where the schema field for those options is the typeSchemaName (e.g., 'samples')
export async function getEntityTypeOptions(
    entityDataType: EntityDataType,
    containerPath?: string,
    containerFilter?: Query.ContainerFilter,
    skipProjectDataExclusion?: boolean
): Promise<Map<string, List<IEntityTypeOption>>> {
    const { typeListingSchemaQuery, filterArray, instanceSchemaName } = entityDataType;

    const filters = [];

    if (!skipProjectDataExclusion) {
        const dataTypeExclusions = getProjectDataExclusion();
        const exclusions = dataTypeExclusions?.[entityDataType.projectConfigurableDataType];
        if (exclusions) filters.push(Filter.create('RowId', exclusions, Filter.Types.NOT_IN));
    }

    if (filterArray) filters.push(...filterArray);
    const result = await selectRows({
        columns: 'LSID,Name,RowId,Folder/Path',
        containerFilter:
            containerFilter ?? entityDataType.containerFilter ?? Query.containerFilter.currentPlusProjectAndShared,
        containerPath,
        filterArray: filters,
        // Use of default view here is ok. Assumed that view is overridden only if there is desire to hide types.
        schemaQuery: new SchemaQuery(typeListingSchemaQuery.schemaName, typeListingSchemaQuery.queryName),
    });

    const options: IEntityTypeOption[] = result.rows
        .map(row => ({
            ...extractEntityTypeOptionFromRow(row, true, entityDataType),
            schema: instanceSchemaName, // e.g. "samples" or "dataclasses"
        }))
        .sort(naturalSortByProperty('label'));

    return Map({ [typeListingSchemaQuery.queryName]: List(options) });
}

export async function getProjectConfigurableEntityTypeOptions(
    entityDataType: EntityDataType,
    containerPath?: string,
    containerFilter?: Query.ContainerFilter
): Promise<DataTypeEntity[]> {
    const { typeListingSchemaQuery, filterArray } = entityDataType;

    const result = await selectRows({
        columns:
            'LSID,Name,RowId,Description' + (entityDataType.labelColorCol ? ',' + entityDataType.labelColorCol : ''),
        containerFilter:
            containerFilter ?? entityDataType.containerFilter ?? Query.containerFilter.currentPlusProjectAndShared,
        containerPath,
        filterArray,
        schemaQuery: typeListingSchemaQuery,
    });

    const entities: DataTypeEntity[] = result.rows
        .map(
            row =>
                ({
                    label: caseInsensitive(row, 'Name').value,
                    labelColor: entityDataType.labelColorCol
                        ? caseInsensitive(row, entityDataType.labelColorCol).value
                        : undefined,
                    rowId: caseInsensitive(row, 'RowId').value,
                    description: caseInsensitive(row, 'Description').value,
                    type: entityDataType.projectConfigurableDataType as ProjectConfigurableDataType,
                    lsid: caseInsensitive(row, 'LSID').value,
                }) as DataTypeEntity
        )
        .sort(naturalSortByProperty('label'));

    return entities;
}

/**
 * @param model
 * @param entityDataType main data type to resolve
 * @param parentSchemaQueries map of the possible parents to the entityDataType
 * @param targetQueryName the name of the listing schema query that represents the initial target for creation.
 * @param allowParents are parents of this entity type allowed or not
 * @param isItemSamples use the selectionKey from inventory.items table to query sample parents
 * @param combineParentTypes
 */
export function getEntityTypeData(
    model: EntityIdCreationModel,
    entityDataType: EntityDataType,
    parentSchemaQueries: Map<string, EntityDataType>,
    targetQueryName: string,
    allowParents: boolean,
    isItemSamples: boolean,
    combineParentTypes: boolean
): Promise<Partial<EntityIdCreationModel>> {
    return new Promise((resolve, reject) => {
        const promises: Array<Promise<any>> = [
            getEntityTypeOptions(entityDataType),
            // get all the parent schemaQuery data
            getChosenParentData(
                model,
                parentSchemaQueries,
                allowParents,
                isItemSamples,
                targetQueryName,
                combineParentTypes
            ),
            ...parentSchemaQueries.map(edt => getEntityTypeOptions(edt)).toArray(),
        ];

        Promise.all(promises)
            .then(results => {
                const partial = { ...results[1] }; // incorporate the chosen parent data results including entityCount and entityParents
                let parentOptions = Map<string, List<IParentOption>>();
                if (results.length > 2) {
                    results.slice(2).forEach(typeOptionsMap => {
                        parentOptions = parentOptions.merge(typeOptionsMap);
                    });
                }
                // Set possible parents
                partial.parentOptions = parentOptions;

                // Set possible types
                partial.entityTypeOptions = results[0].first();

                // and populate the targetEntityType if one is provided
                if (model.initialEntityType && partial.entityTypeOptions) {
                    const initialTargetTypeName = model.initialEntityType;
                    const data = partial.entityTypeOptions.find(
                        row => initialTargetTypeName.toLowerCase() === row.value
                    );
                    if (data) {
                        partial.targetEntityType = new EntityTypeOption(data);
                    }
                }
                resolve({
                    isInit: true,
                    ...partial,
                });
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export function deleteEntityType(
    deleteActionName: string,
    rowId: number,
    containerPath?: string,
    auditUserComment?: string
): Promise<any> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', deleteActionName + '.api', undefined, { container: containerPath }),
            method: 'POST',
            params: {
                singleObjectRowId: rowId,
                forceDelete: true,
                userComment: auditUserComment,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: handleRequestFailure(reject, 'Failed to delete entity type.'),
        });
    });
}

export function handleEntityFileImport(
    importAction: string,
    queryInfo: QueryInfo,
    file: File,
    insertOption: InsertOptions,
    useAsync: boolean,
    importParameters?: Record<string, any>,
    importFileController?: string,
    saveToPipeline?: boolean,
    containerPath?: string,
): Promise<any> {
    return new Promise((resolve, reject) => {
        return importData({
            schemaName: queryInfo?.schemaQuery.schemaName,
            queryName: queryInfo?.schemaQuery.queryName,
            file,
            importUrl: ActionURL.buildURL(importFileController ?? 'experiment', importAction, containerPath, {
                ...importParameters,
            }),
            importLookupByAlternateKey: true,
            useAsync,
            insertOption: InsertOptions[insertOption],
            saveToPipeline,
        })
            .then(response => {
                if (response.success) {
                    resolve(response);
                } else {
                    reject({ msg: response.errors._form });
                }
            })
            .catch(error => {
                console.error(error);
                reject({ msg: error.exception });
            });
    });
}

export function getDataDeleteConfirmationData(
    rowIds: string[] | number[],
    selectionKey?: string,
    useSnapshotSelection?: boolean
): Promise<OperationConfirmationData> {
    return getDataOperationConfirmationData(DataOperation.Delete, rowIds, selectionKey, useSnapshotSelection);
}

export function getDataOperationConfirmationData(
    operation: DataOperation,
    rowIds: string[] | number[],
    selectionKey?: string,
    useSnapshotSelection?: boolean
): Promise<OperationConfirmationData> {
    return getOperationConfirmationData(DataClassDataType, rowIds, selectionKey, useSnapshotSelection, {
        dataOperation: DataOperation[operation],
    });
}

export function getCrossFolderSelectionResult(
    dataRegionSelectionKey: string,
    dataType: 'sample' | 'data' | 'assayrun',
    useSnapshotSelection?: boolean,
    rowIds?: string[] | number[],
    picklistName?: string
): Promise<CrossFolderSelectionResult> {
    if (!dataRegionSelectionKey && !rowIds?.length) {
        return Promise.resolve(undefined);
    }

    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', 'getCrossFolderDataSelection.api'),
            method: 'POST',
            jsonData: {
                dataRegionSelectionKey,
                rowIds,
                dataType,
                picklistName,
                useSnapshotSelection,
            },
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    resolve({
                        currentFolderSelectionCount: response.data.currentFolderSelectionCount,
                        crossFolderSelectionCount: response.data.crossFolderSelectionCount,
                    });
                } else {
                    console.error('Error getting cross-project data selection result', response.exception);
                    reject(response.exception);
                }
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(response ? response.exception : 'Unknown error getting cross-project data selection result.');
            }),
        });
    });
}

export type ParentIdData = {
    parentId: string | number;
    rowId: number;
};

async function getParentRowIdAndDataType(
    parentDataType: EntityDataType,
    parentIDs: string[],
    containerPath?: string
): Promise<Record<string, ParentIdData>> {
    const response = await selectRows({
        containerPath,
        schemaQuery: parentDataType.listingSchemaQuery,
        viewName: ViewInfo.DETAIL_NAME, // use this to avoid filters on the default view
        columns: 'LSID, RowId, DataClass, SampleSet', // only one of DataClass or SampleSet will exist
        filterArray: [Filter.create('LSID', parentIDs, Filter.Types.IN)],
    });

    const filteredParentItems = {};
    response.rows.forEach(row => {
        const lsid = caseInsensitive(row, 'LSID').value;
        filteredParentItems[lsid] = {
            rowId: caseInsensitive(row, 'RowId').value,
            parentId: caseInsensitive(row, 'DataClass')?.value ?? caseInsensitive(row, 'SampleSet')?.value,
        };
    });

    return filteredParentItems;
}

export type GetParentTypeDataForLineage = (
    parentDataType: EntityDataType,
    data: any[],
    containerPath?: string,
    containerFilter?: Query.ContainerFilter,
    skipProjectDataExclusion?: boolean
) => Promise<{
    parentIdData: Record<string, ParentIdData>;
    parentTypeOptions: List<IEntityTypeOption>;
}>;

export const getParentTypeDataForLineage: GetParentTypeDataForLineage = async (
    parentDataType,
    data,
    containerPath,
    containerFilter,
    skipProjectDataExclusion
) => {
    let parentTypeOptions = List<IEntityTypeOption>();
    let parentIdData: Record<string, ParentIdData>;
    if (parentDataType) {
        const options = await getEntityTypeOptions(
            parentDataType,
            containerPath,
            containerFilter,
            skipProjectDataExclusion
        );
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

export const getOriginalParentsFromLineage = async (
    lineage: Record<string, any>,
    parentDataTypes: EntityDataType[],
    containerPath?: string
): Promise<{
    originalParents: Record<string, List<EntityChoice>>;
    parentTypeOptions: Map<string, List<IEntityTypeOption>>;
}> => {
    const originalParents = {};
    let parentTypeOptions = Map<string, List<IEntityTypeOption>>();
    const dataClassTypeData = await getParentTypeDataForLineage(
        parentDataTypes.filter(
            dataType => dataType.typeListingSchemaQuery.queryName === SCHEMAS.EXP_TABLES.DATA_CLASSES.queryName
        )[0],
        Object.values(lineage),
        containerPath
    );
    const sampleTypeData = await getParentTypeDataForLineage(
        parentDataTypes.filter(
            dataType => dataType.typeListingSchemaQuery.queryName === SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName
        )[0],
        Object.values(lineage),
        containerPath
    );

    // iterate through both Data Classes and Sample Types for finding sample parents
    parentDataTypes.forEach(dataType => {
        const dataTypeOptions =
            dataType.typeListingSchemaQuery.queryName === SCHEMAS.EXP_TABLES.DATA_CLASSES.queryName
                ? dataClassTypeData.parentTypeOptions
                : sampleTypeData.parentTypeOptions;

        const parentIdData =
            dataType.typeListingSchemaQuery.queryName === SCHEMAS.EXP_TABLES.DATA_CLASSES.queryName
                ? dataClassTypeData.parentIdData
                : sampleTypeData.parentIdData;
        Object.keys(lineage).forEach(sampleId => {
            if (!originalParents[sampleId]) originalParents[sampleId] = List<EntityChoice>();

            originalParents[sampleId] = originalParents[sampleId].concat(
                getInitialParentChoices(dataTypeOptions, dataType, lineage[sampleId], parentIdData)
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

export function getMoveConfirmationData(
    dataType: EntityDataType,
    rowIds: string[] | number[],
    selectionKey?: string,
    useSnapshotSelection?: boolean
): Promise<OperationConfirmationData> {
    if (isSampleEntity(dataType)) {
        return getSampleOperationConfirmationData(SampleOperation.Move, rowIds, selectionKey, useSnapshotSelection);
    }

    return getOperationConfirmationData(
        dataType,
        rowIds,
        selectionKey,
        useSnapshotSelection,
        isDataClassEntity(dataType)
            ? {
                  dataOperation: DataOperation.Move,
              }
            : isAssayDesignEntity(dataType)
            ? { dataOperation: AssayRunOperation.Move }
            : undefined
    );
}

export function moveEntities(
    sourceContainer: Container,
    targetContainer: string,
    entityDataType: EntityDataType,
    schemaName: string,
    queryName: string,
    rowIds?: number[],
    selectionKey?: string,
    useSnapshotSelection?: boolean,
    userComment?: string
): Promise<MoveEntitiesResult> {
    return new Promise((resolve, reject) => {
        const params = {
            auditBehavior: AuditBehaviorTypes.DETAILED,
            auditUserComment: userComment,
            targetContainerPath: targetContainer,
            schemaName,
            queryName,
        };
        if (rowIds) {
            params['rows'] = rowIds.reduce((prev, curr) => {
                prev.push({ rowId: curr });
                return prev;
            }, []);
        }
        if (selectionKey) {
            params['dataRegionSelectionKey'] = selectionKey;
            params['useSnapshotSelection'] = useSnapshotSelection;
        }

        return Ajax.request({
            url: buildURL('query', 'moveRows.api', undefined, {
                container: sourceContainer?.path,
            }),
            method: 'POST',
            jsonData: params,
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    resolve(response);
                } else {
                    console.error('Error moving ' + entityDataType.nounPlural, response);
                    reject(response?.error ?? 'Unknown error moving ' + entityDataType.nounPlural + '.');
                }
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error('Error moving ' + entityDataType.nounPlural, response);
                reject(response?.exception ?? 'Unknown error moving ' + entityDataType.nounPlural + '.');
            }),
        });
    });
}

export const initParentOptionsSelects = (
    includeSampleTypes: boolean,
    includeDataClasses: boolean,
    containerPath: string,
    isValidParentOptionFn?: (row: any, isDataClass: boolean) => boolean,
    newTypeOption?: any,
    importAliases?: Map<string, string>,
    idPrefix?: string,
    formatLabel?: (name: string, prefix: string, isDataClass?: boolean, containerPath?: string) => string
): Promise<{
    parentAliases: Map<string, IParentAlias>;
    parentOptions: IParentOption[];
}> => {
    const promises: Array<Promise<SelectRowsResponse>> = [];

    const dataTypeExclusions = getProjectDataExclusion();

    // Get Sample Types
    if (includeSampleTypes) {
        const exclusions = dataTypeExclusions?.['SampleType'];
        promises.push(
            selectRows({
                containerPath,
                schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
                columns: 'LSID, Name, RowId, Folder',
                containerFilter: Query.containerFilter.currentPlusProjectAndShared,
                filterArray: exclusions?.length > 0 ? [Filter.create('RowId', exclusions, Filter.Types.NOT_IN)] : null,
            })
        );
    }

    // Get Data Classes
    if (includeDataClasses) {
        const exclusions = dataTypeExclusions?.['DataClass'];
        promises.push(
            selectRows({
                containerPath,
                schemaQuery: SCHEMAS.EXP_TABLES.DATA_CLASSES,
                columns: 'LSID, Name, RowId, Folder, Category',
                containerFilter: Query.containerFilter.currentPlusProjectAndShared,
                filterArray: exclusions?.length > 0 ? [Filter.create('RowId', exclusions, Filter.Types.NOT_IN)] : null,
            })
        );
    }

    return new Promise((resolve, reject) => {
        Promise.all(promises)
            .then(responses => {
                const sets: IParentOption[] = [];
                responses.forEach(result => {
                    const rows = result.rows;
                    const isDataClass = result.schemaQuery?.queryName?.toLowerCase() === 'dataclasses';
                    const prefix = isDataClass ? DATA_CLASS_IMPORT_PREFIX : SAMPLE_SET_IMPORT_PREFIX;
                    const labelPrefix = isDataClass ? 'Data Class' : 'Sample Type';

                    rows.forEach(row => {
                        if (isValidParentOptionFn) {
                            if (!isValidParentOptionFn(row, isDataClass)) return;
                        }
                        const name = caseInsensitive(row, 'Name')?.value;
                        const containerPath = caseInsensitive(row, 'Folder').displayValue;
                        const label = formatLabel ? formatLabel(name, labelPrefix, isDataClass, containerPath) : name;
                        sets.push({
                            value: prefix + name,
                            label,
                            schema: isDataClass ? SCHEMAS.DATA_CLASSES.SCHEMA : SCHEMAS.SAMPLE_SETS.SCHEMA,
                            query: name, // Issue 33653: query name is case-sensitive for some data inputs (sample parents)
                        });
                    });

                    if (newTypeOption) {
                        if (
                            (!isDataClass && newTypeOption.schema === SCHEMAS.SAMPLE_SETS.SCHEMA) ||
                            (isDataClass && newTypeOption.schema !== SCHEMAS.SAMPLE_SETS.SCHEMA)
                        )
                            sets.push(newTypeOption);
                    }
                });

                const parentOptions = sets.sort(naturalSortByProperty('label'));

                let parentAliases = Map<string, IParentAlias>();

                if (importAliases) {
                    const initialAlias = Map<string, string>(importAliases);
                    initialAlias.forEach((val, key) => {
                        const newId = generateId(idPrefix);
                        const parentValue = parentOptions.find(opt => opt.value === val);
                        if (!parentValue)
                            // parent option might have been filtered out by isValidParentOptionFn
                            return;

                        parentAliases = parentAliases.set(newId, {
                            id: newId,
                            alias: key,
                            parentValue,
                            ignoreAliasError: false,
                            ignoreSelectError: false,
                        } as IParentAlias);
                    });
                }
                resolve({
                    parentOptions,
                    parentAliases,
                });
            })
            .catch(error => {
                reject(error);
            });
    });
};

export const getFolderDataTypeExclusions = (excludedContainer?: string): Promise<{ [key: string]: number[] }> => {
    if (!hasModule(SAMPLE_MANAGER_APP_PROPERTIES.moduleName)) {
        return Promise.resolve(undefined);
    }

    let isCurrentContainer = true;
    if (excludedContainer) {
        const currentContainer = getServerContext().container;
        if (!(excludedContainer === currentContainer.path || excludedContainer === currentContainer.id))
            isCurrentContainer = false;
    }

    if (isCurrentContainer) {
        return new Promise(resolve => resolve(getProjectDataExclusion()));
    }

    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getDataTypeExclusion.api'),
            method: 'GET',
            params: {
                excludedContainer,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response['excludedDataTypes']);
            }),
            failure: handleRequestFailure(reject, 'Failed to get excluded data types'),
        });
    });
};

export const getFolderExcludedDataTypes = (dataType: string, excludedContainer?: string): Promise<number[]> => {
    return new Promise((resolve, reject) => {
        getFolderDataTypeExclusions(excludedContainer)
            .then(exclusions => {
                resolve(exclusions?.[dataType]);
            })
            .catch(error => reject(error));
    });
};

export const getExcludedDataTypeNames = (
    listingSchemaQuery: SchemaQuery,
    dataType: string,
    excludedContainerId?: string
): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        getFolderExcludedDataTypes(dataType, excludedContainerId)
            .then(excludedRowIds => {
                if (!excludedRowIds || excludedRowIds.length === 0) {
                    resolve([]);
                }
                const filterArray = [Filter.create('RowId', excludedRowIds, Filter.Types.IN)];
                selectRows({
                    columns: 'Name',
                    filterArray,
                    schemaQuery: listingSchemaQuery,
                })
                    .then(response => {
                        const rows = response.rows;
                        const namesLc = [];
                        rows.forEach(row => namesLc.push(caseInsensitive(row, 'Name')?.value?.toLowerCase()));
                        resolve(namesLc);
                    })
                    .catch(reason => {
                        reject(resolveErrorMessage(reason));
                        console.error(reason);
                    });
            })
            .catch(reason => {
                reject(resolveErrorMessage(reason));
                console.error(reason);
            });
    });
};

export function getOrderedSelectedMappedKeys(
    fromColumn: string,
    toColumn: string,
    schemaName: string,
    queryName: string,
    selections: string[],
    sortString?: string,
    queryParameters?: Record<string, any>,
    viewName?: string
): Promise<RemappedKeyValues> {
    return new Promise((resolve, reject) => {
        getSelectedData(
            schemaName,
            queryName,
            Array.from(selections),
            toColumn ? [fromColumn, toColumn].join(',') : fromColumn,
            sortString,
            queryParameters,
            viewName,
            fromColumn
        )
            .then(response => {
                const { data, dataIds } = response;
                const values = [];
                data.forEach(row => {
                    const rowData = row.toJS();
                    const from = caseInsensitive(rowData, fromColumn)?.value;
                    const to = toColumn ? caseInsensitive(rowData, toColumn)?.value : null;
                    const orderNum = dataIds.indexOf(from + '');
                    values.push({
                        from,
                        to,
                        orderNum,
                    });
                });

                const mapFromValues = [];
                const mapToValues = [];
                values.sort((a, b) => a.orderNum - b.orderNum);
                values.forEach(value => {
                    mapToValues.push(value.to);
                    mapFromValues.push(value.from);
                });

                resolve({
                    mapToValues,
                    mapFromValues,
                });
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export function saveOrderedSnapshotSelection(
    queryModel: QueryModel,
    fromColumn: string,
    toColumn?: string
): Promise<number[]> {
    return new Promise((resolve, reject) => {
        const { queryName, queryParameters, selections, sortString, viewName, selectionKey, schemaName } = queryModel;
        getOrderedSelectedMappedKeys(
            fromColumn,
            toColumn ?? fromColumn,
            schemaName,
            queryName,
            Array.from(selections),
            sortString,
            queryParameters,
            viewName
        )
            .then(result => {
                const fromIds = result.mapFromValues;
                const toIds = result.mapToValues;
                setSnapshotSelections(selectionKey, fromIds)
                    .then(result => {
                        resolve(toIds);
                    })
                    .catch(reason => {
                        console.error(reason);
                        reject(reason);
                    });
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

/**
 * Get the ordered remapped key values from a QueryModel based on grid's current selection.
 * For example, picklist grid has a "ID" PK column and a "SampleId" FK column.
 * This function can be used to get the SampleIds for the currently selected IDs, in the order that respect current grid
 * filter/sort
 * @param fromColumn Key column for the current grid
 * @param toColumn Key column for the FK field, can be empty.
 * @param selectedIds
 * @param queryModel
 */
export function getOrderedSelectedMappedKeysFromQueryModel(
    fromColumn: string,
    toColumn: string,
    queryModel: QueryModel,
    selectedIds?: string[]
): Promise<RemappedKeyValues> {
    const { schemaName, queryName, queryParameters, sortString, viewName, selections } = queryModel;
    return getOrderedSelectedMappedKeys(
        fromColumn,
        undefined,
        schemaName,
        queryName,
        selectedIds ?? Array.from(selections),
        sortString,
        queryParameters,
        viewName
    );
}
