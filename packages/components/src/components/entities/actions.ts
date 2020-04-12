import {
    buildURL,
    getQueryGridModel,
    getSelected,
    naturalSort,
    queryGridInvalidate,
    QueryGridModel,
    SchemaQuery,
    selectRows
} from '../..';
import { Ajax, Filter, Utils } from '@labkey/api';
import { fromJS, List, Map } from 'immutable';
import {
    DisplayObject,
    EntityChoice,
    EntityDataType,
    EntityIdCreationModel,
    EntityParentType,
    EntityTypeOption,
    IEntityTypeOption,
    IParentOption
} from './models';
import { DataClassDataType, SampleTypeDataType } from './constants';
import { DELIMITER } from '../forms/input/SelectInput';

export interface DeleteConfirmationData {
    canDelete: Array<any>
    cannotDelete: Array<any>
}

export function getDeleteConfirmationData(selectionKey: string, dataType: EntityDataType, rowIds?: Array<string>): Promise<DeleteConfirmationData> {
    return new Promise((resolve, reject) => {
        let params;
        if (selectionKey) {
            params = {
                dataRegionSelectionKey: selectionKey
            }
        }
        else {
            params = {
                rowIds
            }
        }
        return Ajax.request({
            url: buildURL('experiment', dataType.deleteConfirmationActionName),
            method: "POST",
            jsonData: params,
            success: Utils.getCallbackWrapper((response) => {
                if (response.success) {
                    resolve(response.data);
                }
                else {
                    reject(response.exception);
                }
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response ? response.exception : 'Unknown error getting delete confirmation data.');
            })
        })
    });
}

export function getSampleDeleteConfirmationData(selectionKey: string, rowIds?: Array<string>): Promise<DeleteConfirmationData> {
    return getDeleteConfirmationData(selectionKey, SampleTypeDataType, rowIds);
}

export function getDataDeleteConfirmationData(selectionKey: string, rowIds?: Array<string>): Promise<DeleteConfirmationData> {
    return getDeleteConfirmationData(selectionKey, DataClassDataType, rowIds);
}

function getSelectedParents(schemaQuery: SchemaQuery, filterArray: Array<Filter.IFilter>) : Promise<List<EntityParentType>> {
    return new Promise((resolve, reject) => {
        return selectRows({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            columns: 'LSID,Name,RowId',
            filterArray
        }).then((response) => {
            resolve(resolveEntityParentTypeFromIds(schemaQuery, response));
        }).catch((reason) => {
            console.error("There was a problem getting the selected parents' data", reason);
            reject(reason);
        });
    });
}

/**
 * We have either an initialParents array, and determine the schemaQuery from the first id in that list
 * or a selection key and determine the schema query from parsing the selection key.  In any case, this
 * assumes parents from a single data type.
 * @param initialParents
 * @param selectionKey
 */
function initParents(initialParents: Array<string>, selectionKey: string): Promise<List<EntityParentType>> {
    return new Promise((resolve, reject) => {

        if (selectionKey) {
            const { schemaQuery } = SchemaQuery.parseSelectionKey(selectionKey);
            const queryGridModel = getQueryGridModel(selectionKey);

            if (queryGridModel && queryGridModel.selectedLoaded) {
                return getSelectedParents(schemaQuery, [Filter.create('RowId', queryGridModel.selectedIds.toArray(), Filter.Types.IN)])
                    .then((response) => resolve(response))
                    .catch((reason) => reject(reason));
            }
            else {
                return getSelected(selectionKey).then((selectionResponse) => {
                    return getSelectedParents(schemaQuery, [Filter.create('RowId', selectionResponse.selected, Filter.Types.IN)])
                        .then((response) => resolve(response))
                        .catch((reason) => reject(reason));
                }).catch(() => {
                    console.warn('Unable to parse selectionKey', selectionKey);
                    resolve(List<EntityParentType>());
                });
            }
        }
        else if (initialParents && initialParents.length > 0) {
            const parent = initialParents[0];
            const [schema, query, value] = parent.toLowerCase().split(':');

            return getSelectedParents(SchemaQuery.create(schema, query), [Filter.create('RowId', value)])
                .then((response) => resolve(response))
                .catch((reason) => reject(reason));
        }
        else {
            resolve(List<EntityParentType>());
        }
    });
}

function resolveEntityParentTypeFromIds(schemaQuery: SchemaQuery, response: any): List<EntityParentType> {
    const {key, models, orderedModels} = response;
    const rows = fromJS(models[key]);
    let data = List<DisplayObject>();

    // The transformation done here makes the entities compatible with the editable grid
    orderedModels[key].forEach((id) => {
        const row = extractEntityTypeOptionFromRow(rows.get(id));
        data = data.push({
            displayValue: row.label,
            value: row.rowId
        });
    });

    return List<EntityParentType>([
        EntityParentType.create({
            index: 1,
            schema: schemaQuery.getSchema(),
            query: schemaQuery.getQuery(),
            value: data
        })
    ]);
}

export function extractEntityTypeOptionFromRow(row: Map<string, any>, lowerCaseValue = true): IEntityTypeOption {
    const name = row.getIn(['Name', 'value']);
    return {
        label: name,
        lsid: row.getIn(['LSID', 'value']),
        rowId: row.getIn(['RowId', 'value']),
        value: (lowerCaseValue ? name.toLowerCase() : name), // we match values on lower case because (at least) when parsed from an id they are lower case
        query: name
    }
}

function getChosenParentData(model: EntityIdCreationModel, parentEntityDataTypes: Map<string, EntityDataType>, allowParents: boolean) : Promise<Partial<EntityIdCreationModel>> {
    return new Promise((resolve, reject) => {
        let entityParents = EntityIdCreationModel.getEmptyEntityParents(
            parentEntityDataTypes.reduce((names, entityDataType) => names.push(entityDataType.typeListingSchemaQuery.queryName), List<string>())
        );

        if (allowParents) {
            const parentSchemaNames = parentEntityDataTypes.keySeq();
            initParents(model.originalParents, model.selectionKey).then(
                (chosenParents) => {
                    // if we have an initial parent, we want to start with a row in the grid (entityCount = 1) otherwise we start with none
                    const parentRep = chosenParents.find((parent) => parent.value !== undefined && parentSchemaNames.contains(parent.schema));
                    let validEntityCount = parentRep ? 1 : 0;

                    if (validEntityCount === 1) {
                        resolve({
                            entityCount: validEntityCount,
                            entityParents: entityParents.set(parentEntityDataTypes.get(parentRep.schema).typeListingSchemaQuery.queryName, chosenParents),
                        });
                    }
                    else { // if we did not find a valid parent, we clear out the parents and selection key from the model as they aren't relevant
                        resolve({
                            originalParents: undefined,
                            selectionKey: undefined,
                            entityParents,
                            entityCount: 0
                        })
                    }
                }
            ).catch((reason) => {
                console.error(reason);
                reject(reason);
            });
        }
        else {
            resolve({
                originalParents: undefined,
                selectionKey: undefined,
                entityParents,
                entityCount: 0
            })
        }
    })
}

// get back a map from the typeListQueryName (e.g., 'SampleSet') and the list of options for that query
// where the schema field for those options is the typeSchemaName (e.g., 'samples')
export function getEntityTypeOptions(typeListSchemaQuery: SchemaQuery, typeSchemaName: string, filterArray?: Array<Filter.IFilter>) : Promise<Map<string, List<any>>> {
    return new Promise((resolve, reject) => {
        selectRows({
            schemaName: typeListSchemaQuery.schemaName,
            queryName: typeListSchemaQuery.queryName,
            columns: 'LSID,Name,RowId',
            filterArray
        }).then(
            (result) => {
                const rows = fromJS(result.models[result.key]);
                let optionMap = Map<string, List<any>>();
                optionMap = optionMap.set(typeListSchemaQuery.queryName, rows
                    .map(row => {
                        return ({
                            ...extractEntityTypeOptionFromRow(row),
                            schema: typeSchemaName, // e.g. "samples" or "dataclasses"
                        });
                    })
                    .sortBy(r => r.label, naturalSort)
                    .toList()
                );
                resolve(optionMap);
            }
        ).catch((reason) => {
            console.error(reason);
            reject(reason);
        });
    })
}

/**
 * @param model
 * @param entityDataTypes a map between the type schema name (e.g., "samples") and the EntityDataType
 * @param targetQueryName the name of the listing schema query that represents the initial target for creation.
 * @param allowParents are parents of this entity type allowed or not
 */
export function getEntityTypeData(model: EntityIdCreationModel, entityDataTypes: Map<string, EntityDataType>, targetQueryName: string, allowParents: boolean) : Promise<Partial<EntityIdCreationModel>> {
    return new Promise((resolve, reject) => {
        let promises = [];

        promises.push(getChosenParentData(model, entityDataTypes, allowParents));

        // get all the schemaQuery data
        entityDataTypes.forEach((entityDataType: EntityDataType, typeSchemaName: string) => {
            promises.push(getEntityTypeOptions(entityDataType.typeListingSchemaQuery, typeSchemaName, entityDataType.filterArray));
        });

        let partial : Partial<EntityIdCreationModel> = {};
        Promise.all(promises).then(
            (results) => {
                partial = {...results[0]}; // incorporate the chosen parent data results including entityCount and entityParents
                let parentOptions = Map<string, List<IParentOption>>();
                if (results.length > 1) {
                    results.slice(1).forEach((typeOptionsMap) => {
                        parentOptions = parentOptions.merge(typeOptionsMap);
                    });
                }
                partial.parentOptions = parentOptions;
                // now we have a full set of options.  Get the one for the targetSchemaName
                partial.entityTypeOptions = partial.parentOptions.get(targetQueryName) as List<IEntityTypeOption>;
                // and populate the targetEntityType if one is provided
                if (model.initialEntityType && partial.entityTypeOptions) {
                    const initialTargetTypeName = model.initialEntityType;
                    const data = partial.entityTypeOptions.find(row => initialTargetTypeName.toLowerCase() === row.value);
                    if (data) {
                        partial.targetEntityType = new EntityTypeOption(data);
                    }
                }
                resolve ({
                    isInit: true,
                    ...partial
                })
            }
        ).catch((reason) => {
            console.error(reason);
            reject(reason);
        });
    });
}

export function getInitialParentChoices(parentTypeOptions: List<IEntityTypeOption>, parentDataType: EntityDataType, childModel: QueryGridModel) : List<EntityChoice> {
    let parentValuesByType = Map<string, EntityChoice>();

    if (childModel && childModel.isLoaded) {
        const row = childModel.getRow();

        if (row.size > 0) {
            const inputs: List<Map<string, any>> = row.get(parentDataType.inputColumnName);
            const inputTypes: List<Map<string, any>> = row.get(parentDataType.inputTypeColumnName);
            if (inputs && inputTypes) {

                // group the inputs by parent type so we can show each in its own grid.
                inputTypes.forEach((typeMap, index) => {
                    // I'm not sure when the type could have more than one value here, but 'value' is an array
                    const typeValue = typeMap.getIn(['value', 0]);
                    const typeOption = parentTypeOptions.find((option) => option[parentDataType.inputTypeValueField] === typeValue);
                    if (!typeOption) {
                        console.warn("Unable to find parent type.", typeValue);
                    }
                    else {
                        if (!parentValuesByType.has(typeOption.query)) {
                            parentValuesByType = parentValuesByType.set(typeOption.query, {
                                type: typeOption,
                                ids: [],
                                value: undefined
                            })
                        }
                        let updatedChoice = parentValuesByType.get(typeOption.query);
                        updatedChoice.ids.push(inputs.getIn([index, 'value']));
                        parentValuesByType = parentValuesByType.set(typeOption.query, updatedChoice)
                    }
                });
            }
        }
    }
    // having collected the values by type, create a list, sorted by the type label and return that.
    return parentValuesByType.sortBy(choice => choice.type.label, naturalSort).toList();
}

export function getUpdatedRowForParentChanges(parentDataType: EntityDataType, originalParents: List<EntityChoice>, currentParents: List<EntityChoice>, childModel: QueryGridModel) {
    const queryData = childModel.getRow();
    const queryInfo = childModel.queryInfo;

    const definedCurrentParents = currentParents.filter((parent) => (parent.type !== null && parent.type !== undefined)).toList();
    let updatedValues = {};
    if (definedCurrentParents.isEmpty()) { // have no current parents but have original parents, send in empty strings so original parents are removed.
        originalParents.forEach((parentChoice) => {
            updatedValues[parentDataType.insertColumnNamePrefix + parentChoice.type.label] = null;
        })
    }
    else {
        definedCurrentParents.forEach((parentChoice) => {
            // Label may seem wrong here, but it is the same as query when extracted from the original query to get
            // the entity types.
            updatedValues[parentDataType.insertColumnNamePrefix + parentChoice.type.label] = parentChoice.value || null;
        });
    }

    queryInfo.getPkCols().forEach((pkCol) => {
        const pkVal = queryData.getIn([pkCol.fieldKey, 'value']);

        if (pkVal !== undefined && pkVal !== null) {
            updatedValues[pkCol.fieldKey] = pkVal;
        }
        else {
            console.warn('Unable to find value for pkCol \"' + pkCol.fieldKey + '\"');
        }
    });
    return updatedValues;

}

export function deleteEntityType(deleteActionName: string, rowId: number): Promise<any> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', deleteActionName + '.api'),
            method: 'POST',
            params: {
                singleObjectRowId: rowId,
                forceDelete: true
            },
            success: Utils.getCallbackWrapper((response) => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response);
            }),
        });
    });
}

export function parentValuesDiffer(sortedOriginalParents: List<EntityChoice>, currentParents: List<EntityChoice>) : boolean {
    const sortedCurrentParents = currentParents.sortBy(choice => choice.type ? choice.type.label : "~~NO_TYPE~~", naturalSort).toList();
    const difference = sortedOriginalParents.find((original, index) => {
        const current = sortedCurrentParents.get(index);
        if (!current)
            return true;
        if (current.type && original.type.rowId !== current.type.rowId) {
            return true;
        }
        const originalValues = original.value ? original.value.split(DELIMITER).sort(naturalSort).join(DELIMITER) : "";
        const currentValues = current.value ? current.value.split(DELIMITER).sort(naturalSort).join(DELIMITER) : "";
        if (originalValues !== currentValues) {
            return true;
        }
    });
    if (difference) {
        return true;
    }
    // we have more current parents than the original and we have selected a value for at least one of these parents.
    if (sortedCurrentParents.size > sortedOriginalParents.size) {
        return sortedCurrentParents.slice(sortedOriginalParents.size).find((parent) => parent.value !== undefined) !== undefined;
    }
    return false;
}

export function invalidateParentModels(originalParents: List<EntityChoice>, currentParents: List<EntityChoice>, parentDataType: EntityDataType) {
    // clear out the original parents' grid data (which may no longer be represented in the current parents)
    let cleared = [];
    originalParents.forEach((parentChoice) => {
        cleared.push(parentChoice.type.label);
        queryGridInvalidate(SchemaQuery.create(parentDataType.instanceSchemaName, parentChoice.type.label), true);
    });
    // also clear out the current parents' grid data if it hasn't already been cleared
    currentParents.forEach((parentChoice) => {
        if (parentChoice.type && cleared.indexOf(parentChoice.type.label) < 0) {
            queryGridInvalidate(SchemaQuery.create(parentDataType.instanceSchemaName, parentChoice.type.label), true);
        }
    });
}
