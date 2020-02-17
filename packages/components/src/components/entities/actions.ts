import { buildURL, EntityDataType, getQueryGridModel, getSelected, naturalSort, SchemaQuery, selectRows } from '../..';
import { Ajax, Filter, Utils } from '@labkey/api';
import { fromJS, List, Map } from 'immutable';
import {
    DisplayObject,
    EntityIdCreationModel,
    EntityParentType,
    EntityTypeOption,
    IEntityTypeOption,
    IParentOption
} from './models';

export interface DeleteConfirmationData {
    canDelete: Array<any>
    cannotDelete: Array<any>
}

export function getDeleteConfirmationData(selectionKey: string, dataTypeKey: EntityDataType, rowIds?: Array<string>): Promise<DeleteConfirmationData> {
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
            url: buildURL('experiment', dataTypeKey === EntityDataType.DataClass ? 'getDataDeleteConfirmationData.api' : "getMaterialDeleteConfirmationData.api", params),
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
    return getDeleteConfirmationData(selectionKey, EntityDataType.Sample, rowIds);
}

export function getDataDeleteConfirmationData(selectionKey: string, rowIds?: Array<string>): Promise<DeleteConfirmationData> {
    return getDeleteConfirmationData(selectionKey, EntityDataType.DataClass, rowIds);
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
                return selectRows({
                    schemaName: schemaQuery.schemaName,
                    queryName: schemaQuery.queryName,
                    columns: 'LSID,Name,RowId',
                    filterArray: [Filter.create('RowId', queryGridModel.selectedIds.toArray(), Filter.Types.IN)]
                }).then((response) => {
                    resolve(resolveEntityParentTypeFromIds(schemaQuery, response));
                }).catch((reason) => {
                    console.error("There was a problem getting the selected parents' data", reason);
                    reject(reason);
                });
            }
            else {
                getSelected(selectionKey).then((selectionResponse) => {
                    return selectRows({
                        schemaName: schemaQuery.schemaName,
                        queryName: schemaQuery.queryName,
                        columns: 'LSID,Name,RowId',
                        filterArray: [Filter.create('RowId', selectionResponse.selected, Filter.Types.IN)]
                    }).then((response) => {
                        resolve(resolveEntityParentTypeFromIds(schemaQuery, response));
                    }).catch((reason) => {
                        console.error("There was a problem getting the selected parents' data ", reason);
                        reject(reason);
                    });
                }).catch(() => {
                    console.warn('Unable to parse selectionKey', selectionKey);
                    resolve(List<EntityParentType>());
                });
            }
        }
        else if (initialParents && initialParents.length > 0) {
            const parent = initialParents[0];
            const [schema, query, value] = parent.toLowerCase().split(':');

            return selectRows({
                schemaName: schema,
                queryName: query,
                columns: 'LSID,Name,RowId',
                filterArray: [Filter.create('RowId', value)]
            }).then((response) => {
                resolve(resolveEntityParentTypeFromIds(SchemaQuery.create(schema, query), response));
            }).catch((reason) => {
                console.error("There was a problem getting the specified initial parents' data", reason);
                reject(reason);
            });
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
        const row = extractFromRow(rows.get(id));
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

function extractFromRow(row: Map<string, any>): IEntityTypeOption {
    const name = row.getIn(['Name', 'value']);
    return {
        label: name,
        lsid: row.getIn(['LSID', 'value']),
        rowId: row.getIn(['RowId', 'value']),
        value: name,
        query: name
    }
}

function getChosenParentData(model: EntityIdCreationModel, parentSchemaNames: List<string>) : Promise<Partial<EntityIdCreationModel>> {
    return new Promise((resolve, reject) => {
        initParents(model.originalParents, model.selectionKey).then(
            (chosenParents) => {
                // if we have an initial parent, we want to start with a row in the grid (entityCount = 1) otherwise we start with none
                let validEntityCount = chosenParents.find((parent) => parent.value !== undefined && parentSchemaNames.contains(parent.schema)) ? 1 : 0;
                if (validEntityCount === 1) {
                    resolve({
                        entityCount: validEntityCount
                    });
                }
                else { // if we did not find a valid parent, we clear out the parents and selection key from the model as they aren't relevant
                    resolve({
                        originalParents: undefined,
                        selectionKey: undefined,
                        entityCount: 0
                    })
                }
            }
        ).catch((reason) => {
            console.error(reason);
            reject(reason);
        });
    })
}

function getInitialTargetTypeData(model: EntityIdCreationModel, targetTypeSchema: SchemaQuery) : Promise<Partial<EntityIdCreationModel>> {
    // get the options for the target type we are creating
    return new Promise((resolve, reject) => {
        selectRows({
            schemaName: targetTypeSchema.schemaName,
            queryName: targetTypeSchema.queryName,
            columns: 'LSID,Name,RowId'
        }).then(
            (targetTypeOptionResult) => {
                const targetTypeRows = fromJS(targetTypeOptionResult.models[targetTypeOptionResult.key]);

                const targetTypeOptions = targetTypeRows
                    .map(row => extractFromRow(row))
                    .sortBy(r => r.label, naturalSort)
                    .toList();
                let initialTargetType;
                if (model.initialEntityType) {
                    const setName = model.initialEntityType.toLowerCase();
                    const data = targetTypeRows.find(row => setName === row.getIn(['Name', 'value']).toLowerCase());

                    if (data) {
                        initialTargetType = new EntityTypeOption(extractFromRow(data));
                    }
                }
                resolve({
                    entityTypeOptions: targetTypeOptions,
                    targetEntityType: initialTargetType
                })
            }
        ).catch((reason) => {
            console.error(reason);
            reject(reason);
        });
    })
}

function getEntityTypeOptions(typeListSchemaQuery: SchemaQuery, typeSchemaName: string) : Promise<List<any>> {
    return new Promise((resolve, reject) => {
        selectRows({
            schemaName: typeListSchemaQuery.schemaName,
            queryName: typeListSchemaQuery.queryName,
            columns: 'LSID,Name,RowId'
        }).then(
            (result) => {
                const rows = fromJS(result.models[result.key]);

                resolve( rows
                    .map(row => {
                        const name = row.getIn(['Name', 'value']);
                        return ({
                            ...extractFromRow(row),
                            schema: typeSchemaName,
                        });
                    })
                    .sortBy(r => r.label, naturalSort)
                    .toList()
                );
            }
        ).catch((reason) => {
            console.error(reason);
            reject(reason);
        });
    })
}

// get the set of options for the target type
// initialize the data for selected parents
// for each possible parent type, get the values for that data type (e.g., all the sample sets)
/**
 * @param model
 * @param schemaQueries a map between the type schema name (e.g., "samples") and the listing SchemaQuery (e.g., exp.SampleSets)
 * @param targetSchemaName the name of the schema (key to schemaQueries) that represents the initial target for creation.
 * @param allowParents
 */
export function getEntityTypeData(model: EntityIdCreationModel,  schemaQueries: Map<string, SchemaQuery>, targetSchemaName: string, allowParents: boolean) : Promise<Partial<EntityIdCreationModel>> {
    return new Promise((resolve, reject) => {
        let promises = [];
        // get all the schemaQuery data
        schemaQueries.forEach((typeListSchemaQuery, typeSchemaName) => {
            promises.push(getEntityTypeOptions(typeListSchemaQuery, typeSchemaName));
        });
        if (allowParents) {
            promises.push(getChosenParentData(model, schemaQueries.keySeq().toList()));
        }
        Promise.all(promises).then(
            (results) => {
                // TODO now find the data for the targetSchema and use that to populate the initial target type
            }
        ).catch((reason) => {
            console.error(reason);
            reject(reason);
        });
    });
}

export function initEntityTypeInsert(model: EntityIdCreationModel, schema: SchemaQuery, allowParents: boolean): Promise<Partial<EntityIdCreationModel>> {
    return new Promise((resolve, reject) => {
        let promises: Array<Promise<any>> = [
            selectRows({
                schemaName: schema.schemaName,
                queryName: schema.queryName,
                columns: 'LSID,Name,RowId'
            })
        ];
        if (allowParents) {
            // get the data about the parents specified in the URL.
            promises.push(initParents(model.originalParents, model.selectionKey));
        }
        return Promise.all(promises)
            .then(results => {
                let entityTypeResult = results[0]; // the set of values for the given schema
                const entityTypes = fromJS(entityTypeResult.models[entityTypeResult.key]);
                let entityParents = List<EntityParentType>(); // these are the parents that have already been specified
                let entityCount = 0;
                if (results.length > 1) {
                    entityParents = results[1];
                    // if we have an initial parent, we want to start with a row in the grid (entityCount = 1) otherwise we start with none
                    entityCount = entityParents.find((parent) => parent.value !== undefined) ? 1 : 0;
                }

                // this assumes that the initial schema and the parent options are the same
                const parentOptions = allowParents ? entityTypes.map(row => {
                    const name = row.getIn(['Name', 'value']);
                    return {
                        value: name.toLowerCase(),
                        label: name,
                        schema: "samples",
                        query: name // Issue 33653: query name is case-sensitive for some data inputs (parents)
                    }
                }).toList().sortBy(p => p.label, naturalSort) : List<IParentOption>();

                const entityTypeOptions = entityTypes
                    .map(row => extractFromRow(row))
                    .sortBy(r => r.label, naturalSort)
                    .toList();

                let targetEntityType;
                if (model.initialEntityType) {
                    const setName = model.initialEntityType.toLowerCase();
                    const data = entityTypes.find(row => setName === row.getIn(['Name', 'value']).toLowerCase());

                    if (data) {
                        targetEntityType = new EntityTypeOption(extractFromRow(data));
                    }
                }
                resolve({
                    isInit: true,
                    parentOptions: Map<string, List<IParentOption>>({"SampleSets": parentOptions}),
                    entityCount,
                    entityParents: Map<string, List<EntityParentType>>({ "SampleSets": entityParents}),
                    entityTypeOptions,
                    targetEntityType
                })
            })
            .catch((reason) => {
                console.error(reason);
                reject(reason);
            })
    });
}
