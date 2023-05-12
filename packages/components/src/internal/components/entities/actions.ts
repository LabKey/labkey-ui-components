import { ActionURL, Ajax, AuditBehaviorTypes, Filter, Query, Utils } from '@labkey/api';
import { List, Map } from 'immutable';

import { buildURL } from '../../url/AppURL';
import { SampleOperation } from '../samples/constants';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { getFilterForSampleOperation, isSamplesSchema } from '../samples/utils';
import { importData, InsertOptions } from '../../query/api';
import { caseInsensitive, handleRequestFailure } from '../../util/utils';
import { SampleCreationType } from '../samples/models';
import { getSelected, getSelectedData } from '../../actions';
import { SHARED_CONTAINER_PATH } from '../../constants';
import { naturalSortByProperty } from '../../../public/sort';
import { QueryInfo } from '../../../public/QueryInfo';
import { SCHEMAS } from '../../schemas';

import { Row, selectRows, SelectRowsResponse } from '../../query/selectRows';

import { ViewInfo } from '../../ViewInfo';

import { Container } from '../base/models/Container';

import { getInitialParentChoices, isDataClassEntity, isSampleEntity } from './utils';
import { DataClassDataType, DataOperation, SampleTypeDataType } from './constants';
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
    IParentOption,
    MoveEntitiesResult,
    OperationConfirmationData,
    ProjectConfigurableDataType,
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
    isAliquotParent?: boolean
): Promise<List<EntityParentType>> {
    const isSampleParent = isSamplesSchema(schemaQuery);
    const columns = ['LSID', 'Name', 'RowId'];
    if (isSampleParent) {
        columns.push('SampleSet');
    }

    const response = await selectRows({ columns, filterArray, schemaQuery });

    if (isSampleParent) {
        return resolveSampleParentTypes(response, isAliquotParent);
    }

    return resolveEntityParentTypeFromIds(schemaQuery, response, isAliquotParent);
}

export async function getSelectedItemSamples(selectedItemIds: string[]): Promise<number[]> {
    const { queryName, schemaName } = SCHEMAS.INVENTORY.ITEMS;
    const { data } = await getSelectedData(schemaName, queryName, selectedItemIds, 'RowId, MaterialId');
    return data.map(row => row.getIn(['MaterialId', 'value'])).toArray();
}

function resolveSampleParentTypes(response: SelectRowsResponse, isAliquotParent?: boolean): List<EntityParentType> {
    const groups = {};
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
                value: List<DisplayObject>(data),
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

        return getSelectedParents(schemaQuery, filterArray, isAliquotParent);
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

function resolveEntityParentTypeFromIds(
    schemaQuery: SchemaQuery,
    response: SelectRowsResponse,
    isAliquotParent?: boolean
): List<EntityParentType> {
    // The transformation done here makes the entities compatible with the editable grid
    const data: DisplayObject[] = response.rows
        .map(row => extractEntityTypeOptionFromRow(row))
        .map(({ label, rowId }) => ({ displayValue: label, value: rowId }));

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

export function getAllEntityTypeOptions(
    entityDataTypes: EntityDataType[]
): Promise<{ [p: string]: IEntityTypeOption[] }> {
    const optionMap = {};
    return new Promise(async resolve => {
        for (const entityType of entityDataTypes) {
            try {
                const entityOptions = await getEntityTypeOptions(entityType);
                optionMap[entityType.typeListingSchemaQuery.queryName] = entityOptions
                    .get(entityType.typeListingSchemaQuery.queryName)
                    .toArray();
            } catch {
                optionMap[entityType.typeListingSchemaQuery.queryName] = [];
            }
        }
        resolve(optionMap);
    });
}

// get back a map from the typeListQueryName (e.g., 'SampleSet') and the list of options for that query
// where the schema field for those options is the typeSchemaName (e.g., 'samples')
export async function getEntityTypeOptions(
    entityDataType: EntityDataType,
    containerPath?: string,
    containerFilter?: Query.ContainerFilter
): Promise<Map<string, List<IEntityTypeOption>>> {
    const { typeListingSchemaQuery, filterArray, instanceSchemaName } = entityDataType;

    const result = await selectRows({
        columns: 'LSID,Name,RowId,Folder/Path',
        containerFilter:
            containerFilter ?? entityDataType.containerFilter ?? Query.containerFilter.currentPlusProjectAndShared,
        containerPath,
        filterArray,
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

// get back a map from the typeListQueryName (e.g., 'SampleSet') and the list of options for that query
// where the schema field for those options is the typeSchemaName (e.g., 'samples')
export async function getProjectConfigurableEntityTypeOptions(
    entityDataType: EntityDataType,
    containerPath?: string,
    containerFilter?: Query.ContainerFilter
): Promise<DataTypeEntity[]> {
    const { typeListingSchemaQuery, filterArray } = entityDataType;

    const result = await selectRows({
        columns: 'LSID,Name,RowId,Folder/Path,Description',
        containerFilter:
            containerFilter ?? entityDataType.containerFilter ?? Query.containerFilter.currentPlusProjectAndShared,
        containerPath,
        filterArray,
        // Use of default view here is ok. Assumed that view is overridden only if there is desire to hide types.
        schemaQuery: new SchemaQuery(typeListingSchemaQuery.schemaName, typeListingSchemaQuery.queryName),
    });

    const entities: DataTypeEntity[] = result.rows
        .map(
            row =>
                ({
                    label: caseInsensitive(row, 'Name').value,
                    rowId: caseInsensitive(row, 'RowId').value,
                    description: caseInsensitive(row, 'Description').value,
                    type: entityDataType.projectConfigurableDataType as ProjectConfigurableDataType,
                    lsid: caseInsensitive(row, 'LSID').value,
                } as DataTypeEntity)
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
    saveToPipeline?: boolean
): Promise<any> {
    return new Promise((resolve, reject) => {
        const { schemaName, queryName } = queryInfo.schemaQuery;

        return importData({
            schemaName,
            queryName,
            file,
            importUrl: ActionURL.buildURL(importFileController ?? 'experiment', importAction, null, {
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
    dataType: 'sample' | 'data',
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
    containerFilter?: Query.ContainerFilter
) => Promise<{
    parentIdData: Record<string, ParentIdData>;
    parentTypeOptions: List<IEntityTypeOption>;
}>;

export const getParentTypeDataForLineage: GetParentTypeDataForLineage = async (
    parentDataType,
    data,
    containerPath,
    containerFilter
) => {
    let parentTypeOptions = List<IEntityTypeOption>();
    let parentIdData: Record<string, ParentIdData>;
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
            : undefined
    );
}

export function moveEntities(
    sourceContainer: Container,
    targetContainer: string,
    entityDataType: EntityDataType,
    rowIds?: number[],
    selectionKey?: string,
    useSnapshotSelection?: boolean,
    userComment?: string
): Promise<MoveEntitiesResult> {
    return new Promise((resolve, reject) => {
        const params = {
            auditBehavior: AuditBehaviorTypes.DETAILED,
            targetContainer,
            userComment,
        };
        if (rowIds) {
            params['rowIds'] = rowIds;
        }
        if (selectionKey) {
            params['dataRegionSelectionKey'] = selectionKey;
            params['useSnapshotSelection'] = useSnapshotSelection;
        }

        return Ajax.request({
            url: buildURL(entityDataType.moveControllerName, entityDataType.moveActionName, undefined, {
                container: sourceContainer?.path,
            }),
            method: 'POST',
            params,
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
