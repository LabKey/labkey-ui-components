import {
    buildURL,
    getQueryGridModel,
    getSelected, getStateQueryGridModel,
    naturalSort,
    QueryGridModel,
    SchemaQuery,
    SCHEMAS,
    selectRows, ViewInfo
} from '../..';
import { Ajax, Filter, Utils } from '@labkey/api';
import { fromJS, List, Map } from 'immutable';
import {
    DisplayObject,
    EntityDataType,
    EntityIdCreationModel,
    EntityParentType,
    EntityTypeOption,
    IEntityTypeOption,
    IParentOption
} from './models';
import { DataClassDataType, SampleTypeDataType } from './constants';

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
            url: buildURL('experiment', dataType.deleteConfirmationActionName, params),
            method: "GET",
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

// TODO remove
export function getParentGridModels(inputs, typeQueryNames, entityDataType: EntityDataType) : List<QueryGridModel> {
    let parentModels = List<QueryGridModel>();

    inputs.forEach((input, index) => {
        const typeName = typeQueryNames.get(index);
        if (typeName) {
            const model = getStateQueryGridModel('parent-data', SchemaQuery.create(entityDataType.instanceSchemaName, typeName), {
                bindURL: false,
                allowSelection: false,
                view: ViewInfo.DETAIL_NAME,
                baseFilters: List([Filter.create("LSID", input.get('value'))]),
                omittedColumns: List<string>(['Name', 'LSID', 'MaterialLSIDPrefix']) // TODO do dataclasses want to omit different columns here?
            });
            parentModels = parentModels.push(getQueryGridModel(model.getId()) || model);
        }
    });
    return parentModels;
}

// TODO remove
export function getParentGridData(childModel: QueryGridModel) : Promise<any> {
    return new Promise( (resolve, reject) => {
        const row = childModel.getRow();
        if (row.size > 0) {
            const materialInputs: List<Map<string, any>> = row.get("Inputs/Materials/First");
            const inputSampleSets : List<Map<string, any>> = row.get("Inputs/Materials/First/SampleSet");
            const dataInputs: List<Map<string, any>> = row.get('Inputs/Data/First');
            const inputDataClasses: List<Map<string, any>> = row.get('Inputs/Data/First/DataClass');
            let promises = [];

            materialInputs.forEach((input, index) => {
                // I'm not sure when the sample set could have more than one value here, but 'value' is an array
                const setLsid : string = inputSampleSets.getIn([index, 'value', 0]);
                const lsidParts = setLsid.split(":");

                promises.push(selectRows({
                    schemaName: SCHEMAS.SAMPLE_SETS.SCHEMA,
                    queryName: lsidParts[lsidParts.length-1],
                    viewName: ViewInfo.DETAIL_NAME,
                    columns: [],
                    filterArray: [Filter.create("lsid", input.get('value'))]
                }))
            });

            dataInputs.forEach((input, index) => {
                const classLsid : string = inputDataClasses.getIn([index, 'value', 0]);
                const lsidParts = classLsid.split(":");

                promises.push(selectRows({
                    schemaName: SCHEMAS.DATA_CLASSES.SCHEMA,
                    queryName: lsidParts[lsidParts.length-1],
                    viewName: ViewInfo.DETAIL_NAME,
                    filterArray: [Filter.create("lsid", input.get('value'))]
                }))
            });
            return Promise.all(promises).then((allParentData) => {
                // const [samplesResponse, dataClassResponse] = allParentData;
                // console.log('samplesResponse', samplesResponse);
                // console.log('dataClassResponse', dataClassResponse);
                resolve(allParentData);
            }).catch((reason) => {
                console.error(reason);
                reject(reason);
            })
        }
        else {
            resolve([]);
        }
    })

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

function extractEntityTypeOptionFromRow(row: Map<string, any>): IEntityTypeOption {
    const name = row.getIn(['Name', 'value']);
    return {
        label: name,
        lsid: row.getIn(['LSID', 'value']),
        rowId: row.getIn(['RowId', 'value']),
        value: name.toLowerCase(), // we match values on lower case because (at least) when parsed from an id they are lower case
        query: name
    }
}

function getChosenParentData(model: EntityIdCreationModel, parentSchemaQueries: Map<string, SchemaQuery>, allowParents: boolean) : Promise<Partial<EntityIdCreationModel>> {
    return new Promise((resolve, reject) => {
        let entityParents = EntityIdCreationModel.getEmptyEntityParents(
            parentSchemaQueries.reduce((names, schemaQuery) => names.push(schemaQuery.queryName), List<string>()));
        if (allowParents) {
            const parentSchemaNames = parentSchemaQueries.keySeq();
            initParents(model.originalParents, model.selectionKey).then(
                (chosenParents) => {
                    // if we have an initial parent, we want to start with a row in the grid (entityCount = 1) otherwise we start with none
                    const parentRep = chosenParents.find((parent) => parent.value !== undefined && parentSchemaNames.contains(parent.schema));
                    let validEntityCount = parentRep ? 1 : 0;

                    if (validEntityCount === 1) {
                        resolve({
                            entityCount: validEntityCount,
                            entityParents: entityParents.set(parentSchemaQueries.get(parentRep.schema).queryName, chosenParents),
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
// TODO will need an extra parameter for filtering by category
export function getEntityTypeOptions(typeListSchemaQuery: SchemaQuery, typeSchemaName: string) : Promise<Map<string, List<any>>> {
    return new Promise((resolve, reject) => {
        selectRows({
            schemaName: typeListSchemaQuery.schemaName,
            queryName: typeListSchemaQuery.queryName,
            columns: 'LSID,Name,RowId'
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
 * @param schemaQueries a map between the type schema name (e.g., "samples") and the listing SchemaQuery (e.g., exp.SampleSets)
 * @param targetQueryName the name of the listing schema query that represents the initial target for creation.
 * @param allowParents
 */
export function getEntityTypeData(model: EntityIdCreationModel, schemaQueries: Map<string, SchemaQuery>, targetQueryName: string, allowParents: boolean) : Promise<Partial<EntityIdCreationModel>> {
    return new Promise((resolve, reject) => {
        let promises = [];

        promises.push(getChosenParentData(model, schemaQueries, allowParents));

        // get all the schemaQuery data
        schemaQueries.forEach((typeListSchemaQuery, typeSchemaName) => {
            promises.push(getEntityTypeOptions(typeListSchemaQuery, typeSchemaName));
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
