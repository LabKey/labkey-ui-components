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

function initParents(initialParents: Array<string>, selectionKey: string): Promise<List<EntityParentType>> {
    return new Promise((resolve) => {

        if (selectionKey) {
            const {schemaQuery} = SchemaQuery.parseSelectionKey(selectionKey);
            const queryGridModel = getQueryGridModel(selectionKey);

            if (queryGridModel && queryGridModel.selectedLoaded) {
                return selectRows({
                    schemaName: schemaQuery.schemaName,
                    queryName: schemaQuery.queryName,
                    columns: 'LSID,Name,RowId',
                    filterArray: [Filter.create('RowId', queryGridModel.selectedIds.toArray(), Filter.Types.IN)]
                }).then((response) => {
                    resolve(resolveEntityParentTypeFromIds(schemaQuery, response));
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
    return {
        label: row.getIn(['Name', 'value']),
        lsid: row.getIn(['LSID', 'value']),
        rowId: row.getIn(['RowId', 'value']),
        value: row.getIn(['Name', 'value'])
    }
}

export function initEntityTypeInsert(model: EntityIdCreationModel, schema: SchemaQuery, parentSchemaName: string): Promise<Partial<EntityIdCreationModel>> {
    return new Promise((resolve, reject) => {
        let promises: Array<Promise<any>> = [
            selectRows({
                schemaName: schema.schemaName,
                queryName: schema.queryName,
                columns: 'LSID,Name,RowId'
            })
        ];
        if (parentSchemaName) {
            promises.push(initParents(model.parents, model.selectionKey));
        }
        return Promise.all(promises)
            .then(results => {
                let entityTypeResult = results[0];
                let entityParents = List<EntityParentType>();
                let entityCount = 0;
                if (results.length > 1) {
                    entityParents = results[1];
                    entityCount = entityParents.find((parent) => parent.value !== undefined) ? 1 : 0;
                }
                const entityTypes = fromJS(entityTypeResult.models[entityTypeResult.key]);
                const parentOptions = parentSchemaName ? entityTypes.map(row => {
                    const name = row.getIn(['Name', 'value']);
                    return {
                        value: name.toLowerCase(),
                        label: name,
                        schema: parentSchemaName,
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
                    parentOptions,
                    entityCount,
                    entityParents,
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
