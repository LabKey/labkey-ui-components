import { ActionURL, Ajax, Filter, Utils } from '@labkey/api';
import { fromJS, List, Map } from 'immutable';

import {
    buildURL,
    getQueryGridModel,
    getSelected,
    importData,
    InsertOptions,
    naturalSort,
    QueryInfo,
    SampleCreationType,
    SchemaQuery,
    selectRows,
} from '../../..';

import {
    DisplayObject,
    EntityDataType,
    EntityIdCreationModel,
    EntityParentType,
    EntityTypeOption,
    IEntityTypeOption,
    IParentOption,
} from './models';
import { DataClassDataType, SampleTypeDataType } from './constants';
import { getSelectedItemSamples } from "../samples/actions";

export interface DeleteConfirmationData {
    canDelete: any[];
    cannotDelete: any[];
}

export function getDeleteConfirmationData(
    selectionKey: string,
    dataType: EntityDataType,
    rowIds?: string[]
): Promise<DeleteConfirmationData> {
    return new Promise((resolve, reject) => {
        let params;
        if (selectionKey) {
            params = {
                dataRegionSelectionKey: selectionKey,
            };
        } else {
            params = {
                rowIds,
            };
        }
        return Ajax.request({
            url: buildURL('experiment', dataType.deleteConfirmationActionName),
            method: 'POST',
            jsonData: params,
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    resolve(response.data);
                } else {
                    reject(response.exception);
                }
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response ? response.exception : 'Unknown error getting delete confirmation data.');
            }),
        });
    });
}

export function getSampleDeleteConfirmationData(
    selectionKey: string,
    rowIds?: string[]
): Promise<DeleteConfirmationData> {
    return getDeleteConfirmationData(selectionKey, SampleTypeDataType, rowIds);
}

export function getDataDeleteConfirmationData(
    selectionKey: string,
    rowIds?: string[]
): Promise<DeleteConfirmationData> {
    return getDeleteConfirmationData(selectionKey, DataClassDataType, rowIds);
}

function getSelectedParents(
    schemaQuery: SchemaQuery,
    filterArray: Filter.IFilter[],
    isAliquotParent?: boolean
): Promise<List<EntityParentType>> {
    return new Promise((resolve, reject) => {
        return selectRows({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            columns: 'LSID,Name,RowId',
            filterArray,
        })
            .then(response => {
                resolve(resolveEntityParentTypeFromIds(schemaQuery, response, isAliquotParent));
            })
            .catch(reason => {
                console.error("There was a problem getting the selected parents' data", reason);
                reject(reason);
            });
    });
}

function getSelectedSampleParentsFromItems(itemIds: any[], isAliquotParent?: boolean): Promise<List<EntityParentType>> {
    return new Promise((resolve, reject) => {
        return getSelectedItemSamples(itemIds)
            .then(sampleIds => {
                return selectRows({
                    schemaName: "exp",
                    queryName: "materials",
                    columns: 'LSID,Name,RowId,SampleSet',
                    filterArray: [Filter.create('RowId', sampleIds, Filter.Types.IN)],
                })
                    .then(response => {
                        resolve(resolveSampleParentType(response, isAliquotParent));
                    })
                    .catch(reason => {
                        console.error("There was a problem getting the selected parents' data", reason);
                        reject(reason);
                    });
            })
            .catch(reason => {
                console.error("There was a problem getting the selected parents' data", reason);
                reject(reason);
            });

    });
}

function resolveSampleParentType(
    response: any,
    isAliquotParent?: boolean
): List<EntityParentType> {
    const { key, models, orderedModels } = response;
    const rows = fromJS(models[key]);

    let groups = {};

    // The transformation done here makes the entities compatible with the editable grid
    orderedModels[key].forEach(id => {
        const row = rows.get(id);
        const displayValue = row.getIn(['Name', 'value']);
        const sampleType = row.getIn(['SampleSet', 'displayValue']);
        const value = row.getIn(['RowId', 'value']);

        if (!groups[sampleType])
            groups[sampleType] = [];

        groups[sampleType].push({
            displayValue: displayValue,
            value: value,
        })
    });

    let results = [], index = 1;
    for (let [sampleType, data] of Object.entries(groups)) {
        results.push(EntityParentType.create({
            index,
            schema: 'samples',
            query: sampleType?.toLowerCase(),
            value: List<DisplayObject>(data),
            isAliquotParent,
        }))
        index++;
    }

    return List<EntityParentType>(results);
}

/**
 * We have either an initialParents array, and determine the schemaQuery from the first id in that list
 * or a selection key and determine the schema query from parsing the selection key.  In any case, this
 * assumes parents from a single data type.
 * @param initialParents
 * @param selectionKey
 * @param creationType
 * @param isItemSamples
 */
function initParents(
    initialParents: string[],
    selectionKey: string,
    creationType?: SampleCreationType,
    isItemSamples?: boolean,
): Promise<List<EntityParentType>> {
    const isAliquotParent = creationType === SampleCreationType.Aliquots;
    return new Promise((resolve, reject) => {
        if (selectionKey) {
            const { schemaQuery } = SchemaQuery.parseSelectionKey(selectionKey);
            const queryGridModel = getQueryGridModel(selectionKey);

            if (queryGridModel && queryGridModel.selectedLoaded) {
                return getSelectedParents(
                    schemaQuery,
                    [Filter.create('RowId', queryGridModel.selectedIds.toArray(), Filter.Types.IN)],
                    isAliquotParent
                )
                    .then(response => resolve(response))
                    .catch(reason => reject(reason));
            } else {
                return getSelected(selectionKey)
                    .then(selectionResponse => {
                        if (isItemSamples) {
                            return getSelectedSampleParentsFromItems(selectionResponse.selected, isAliquotParent)
                                .then(response => resolve(response))
                                .catch(reason => reject(reason));
                        }
                        return getSelectedParents(
                            schemaQuery,
                            [Filter.create('RowId', selectionResponse.selected, Filter.Types.IN)],
                            isAliquotParent
                        )
                            .then(response => resolve(response))
                            .catch(reason => reject(reason));
                    })
                    .catch(() => {
                        console.warn('Unable to parse selectionKey', selectionKey);
                        resolve(List<EntityParentType>());
                    });
            }
        } else if (initialParents && initialParents.length > 0) {
            const parent = initialParents[0];
            const [schema, query, value] = parent.toLowerCase().split(':');

            // if the parent key doesn't have a value, we don't need to make the request to getSelectedParents
            if (value === undefined) {
                resolve(
                    List<EntityParentType>([
                        EntityParentType.create({
                            index: 1,
                            schema,
                            query,
                            value: List<DisplayObject>(),
                            isParentTypeOnly: true, // tell the UI to keep the parent type but not add any default rows to the editable grid
                            isAliquotParent,
                        }),
                    ])
                );
            }

            return getSelectedParents(
                SchemaQuery.create(schema, query),
                [Filter.create('RowId', value)],
                isAliquotParent
            )
                .then(response => resolve(response))
                .catch(reason => reject(reason));
        } else {
            resolve(List<EntityParentType>());
        }
    });
}

function resolveEntityParentTypeFromIds(
    schemaQuery: SchemaQuery,
    response: any,
    isAliquotParent?: boolean
): List<EntityParentType> {
    const { key, models, orderedModels } = response;
    const rows = fromJS(models[key]);
    let data = List<DisplayObject>();

    // The transformation done here makes the entities compatible with the editable grid
    orderedModels[key].forEach(id => {
        const row = extractEntityTypeOptionFromRow(rows.get(id));
        data = data.push({
            displayValue: row.label,
            value: row.rowId,
        });
    });

    return List<EntityParentType>([
        EntityParentType.create({
            index: 1,
            schema: schemaQuery.getSchema(),
            query: schemaQuery.getQuery(),
            value: data,
            isAliquotParent,
        }),
    ]);
}

export function extractEntityTypeOptionFromRow(
    row: Map<string, any>,
    lowerCaseValue = true,
    entityDataType?: EntityDataType
): IEntityTypeOption {
    const name = row.getIn(['Name', 'value']);
    return {
        label: name,
        lsid: row.getIn(['LSID', 'value']),
        rowId: row.getIn(['RowId', 'value']),
        value: lowerCaseValue ? name.toLowerCase() : name, // we match values on lower case because (at least) when parsed from an id they are lower case
        query: name,
        entityDataType,
    };
}

// exported for jest testing
export function getChosenParentData(
    model: EntityIdCreationModel,
    parentEntityDataTypes: Map<string, EntityDataType>,
    allowParents: boolean,
    isItemSamples?: boolean
): Promise<Partial<EntityIdCreationModel>> {
    return new Promise((resolve, reject) => {
        const entityParents = EntityIdCreationModel.getEmptyEntityParents(
            parentEntityDataTypes.reduce(
                (names, entityDataType) => names.push(entityDataType.typeListingSchemaQuery.queryName),
                List<string>()
            )
        );

        if (allowParents) {
            const parentSchemaNames = parentEntityDataTypes.keySeq();
            initParents(model.originalParents, model.selectionKey, model.creationType, isItemSamples)
                .then(chosenParents => {
                    // if we have an initial parent, we want to start with a row in the grid (entityCount = 1) otherwise we start with none
                    let totalParentValueCount = 0, isParentTypeOnly = false, parentEntityDataType;
                    chosenParents.forEach(chosenParent => {
                        if  (chosenParent.value !== undefined && parentSchemaNames.contains(chosenParent.schema)) {
                            totalParentValueCount += chosenParent.value.size;
                            isParentTypeOnly = chosenParent.isParentTypeOnly;
                            parentEntityDataType = parentEntityDataTypes.get(chosenParent.schema).typeListingSchemaQuery.queryName;
                        }
                    });


                    const numPerParent = model.numPerParent ?? 1;
                    const validEntityCount = totalParentValueCount
                        ? model.creationType === SampleCreationType.PooledSamples
                            ? numPerParent
                            : totalParentValueCount * numPerParent
                        : 0;

                    if (
                        validEntityCount >= 1 ||
                        isParentTypeOnly ||
                        model.creationType === SampleCreationType.Aliquots
                    ) {
                        resolve({
                            entityCount: validEntityCount,
                            entityParents: entityParents.set(
                                parentEntityDataType,
                                chosenParents
                            ),
                        });
                    } else {
                        // if we did not find a valid parent, we clear out the parents and selection key from the model as they aren't relevant
                        resolve({
                            originalParents: undefined,
                            selectionKey: undefined,
                            entityParents,
                            entityCount: 0,
                        });
                    }
                })
                .catch(reason => {
                    console.error(reason);
                    reject(reason);
                });
        } else {
            resolve({
                originalParents: undefined,
                selectionKey: undefined,
                entityParents,
                entityCount: 0,
            });
        }
    });
}

// get back a map from the typeListQueryName (e.g., 'SampleSet') and the list of options for that query
// where the schema field for those options is the typeSchemaName (e.g., 'samples')
export function getEntityTypeOptions(entityDataType: EntityDataType): Promise<Map<string, List<any>>> {
    const { typeListingSchemaQuery, filterArray, instanceSchemaName } = entityDataType;

    return new Promise((resolve, reject) => {
        selectRows({
            schemaName: typeListingSchemaQuery.schemaName,
            queryName: typeListingSchemaQuery.queryName,
            columns: 'LSID,Name,RowId',
            filterArray,
        })
            .then(result => {
                const rows = fromJS(result.models[result.key]);
                let optionMap = Map<string, List<any>>();
                optionMap = optionMap.set(
                    typeListingSchemaQuery.queryName,
                    rows
                        .map(row => {
                            return {
                                ...extractEntityTypeOptionFromRow(row, true, entityDataType),
                                schema: instanceSchemaName, // e.g. "samples" or "dataclasses"
                            };
                        })
                        .sortBy(r => r.label, naturalSort)
                        .toList()
                );
                resolve(optionMap);
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

/**
 * @param model
 * @param entityDataType main data type to resolve
 * @param parentSchemaQueries map of the possible parents to the entityDataType
 * @param targetQueryName the name of the listing schema query that represents the initial target for creation.
 * @param allowParents are parents of this entity type allowed or not
 * @param isItemSamples use the selectionKey from inventory.items table to query sample parents
 */
export function getEntityTypeData(
    model: EntityIdCreationModel,
    entityDataType: EntityDataType,
    parentSchemaQueries: Map<string, EntityDataType>,
    targetQueryName: string,
    allowParents: boolean,
    isItemSamples?: boolean
): Promise<Partial<EntityIdCreationModel>> {
    return new Promise((resolve, reject) => {
        const promises: Array<Promise<any>> = [
            getEntityTypeOptions(entityDataType),
            // get all the parent schemaQuery data
            getChosenParentData(model, parentSchemaQueries, allowParents, isItemSamples),
            ...parentSchemaQueries.map(getEntityTypeOptions).toArray(),
        ];

        let partial: Partial<EntityIdCreationModel> = {};
        Promise.all(promises)
            .then(results => {
                partial = { ...results[1] }; // incorporate the chosen parent data results including entityCount and entityParents
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

export function deleteEntityType(deleteActionName: string, rowId: number): Promise<any> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', deleteActionName + '.api'),
            method: 'POST',
            params: {
                singleObjectRowId: rowId,
                forceDelete: true,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

export function handleEntityFileImport(
    importAction: string,
    importParameters: Record<string, any>,
    queryInfo: QueryInfo,
    file: File,
    isMerge: boolean,
    useAsync: boolean
): Promise<any> {
    return new Promise((resolve, reject) => {
        const { schemaQuery } = queryInfo;

        return importData({
            schemaName: schemaQuery.getSchema(),
            queryName: schemaQuery.getQuery(),
            file,
            importUrl: ActionURL.buildURL('experiment', importAction, null, {
                ...importParameters,
                schemaName: schemaQuery.getSchema(),
                'query.queryName': schemaQuery.getQuery(),
            }),
            importLookupByAlternateKey: true,
            useAsync,
            insertOption: InsertOptions[isMerge ? InsertOptions.MERGE : InsertOptions.IMPORT],
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
