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
import { Ajax, Filter, Utils } from '@labkey/api'
import { fromJS, List, Map, OrderedMap } from 'immutable'

import {
    DisplayObject,
    IParentOption,
    ISampleSetDetails,
    ISampleSetOption,
    SampleIdCreationModel,
    SampleSetOption,
    SampleSetParentType,
} from './models';
import { getSelected, getSelection } from '../../actions';
import { SCHEMAS } from '../base/models/schemas';
import { QueryColumn, SchemaQuery } from '../base/models/model';
import { buildURL } from '../../url/ActionURL';
import { getQueryGridModel } from '../../global';
import { naturalSort } from '../../util/utils';
import { selectRows } from '../../query/api';

function initParents(initialParents: Array<string>, selectionKey: string): Promise<List<SampleSetParentType>> {
    return new Promise((resolve) => {

        if (selectionKey) {
            const { schemaQuery } = SchemaQuery.parseSelectionKey(selectionKey);
            const queryGridModel = getQueryGridModel(selectionKey);

            if (queryGridModel && queryGridModel.selectedLoaded) {
                return selectRows({
                            schemaName: schemaQuery.schemaName,
                            queryName: schemaQuery.queryName,
                            columns: 'LSID,Name,RowId',
                            filterArray: [Filter.create('RowId', queryGridModel.selectedIds.toArray(), Filter.Types.IN)]
                        }).then((samplesResponse) => {
                            resolve(resolveSampleSetParentTypeFromIds(schemaQuery, samplesResponse));
                        });
            }
            else {
                getSelected(selectionKey).then((selectionResponse) => {
                    return selectRows({
                        schemaName: schemaQuery.schemaName,
                        queryName: schemaQuery.queryName,
                        columns: 'LSID,Name,RowId',
                        filterArray: [Filter.create('RowId', selectionResponse.selected, Filter.Types.IN)]
                    }).then((samplesResponse) => {
                        resolve(resolveSampleSetParentTypeFromIds(schemaQuery, samplesResponse));
                    });
                }).catch(() => {
                    console.warn('Unable to parse selectionKey', selectionKey);
                    resolve(List<SampleSetParentType>());
                });
            }
        }
        else if (initialParents && initialParents.length > 0) {
            const parent = initialParents[0];
            const [ schema, query, value ] = parent.toLowerCase().split(':');

            return selectRows({
                schemaName: schema,
                queryName: query,
                columns: 'LSID,Name,RowId',
                filterArray: [Filter.create('RowId', value)]
            }).then((samplesResponse) => {
                resolve(resolveSampleSetParentTypeFromIds(SchemaQuery.create(schema, query), samplesResponse));
            });
        }
        else {
            resolve(List<SampleSetParentType>());
        }
    });
}

function resolveSampleSetParentTypeFromIds(schemaQuery: SchemaQuery, response: any): List<SampleSetParentType> {
    const { key, models, orderedModels } = response;
    const rows = fromJS(models[key]);
    let data = List<DisplayObject>();

    // The transformation done here makes the samples compatible with the editable grid
    orderedModels[key].forEach((id) => {
        const row = extractFromRow(rows.get(id));
        data = data.push({
            displayValue: row.label,
            value: row.rowId
        });
    });

    return List<SampleSetParentType>([
        SampleSetParentType.create({
            index: 1,
            schema: schemaQuery.getSchema(),
            query: schemaQuery.getQuery(),
            value: data
        })
    ]);
}

function extractFromRow(row: Map<string, any>): ISampleSetOption {
    return {
        label: row.getIn(['Name', 'value']),
        lsid: row.getIn(['LSID', 'value']),
        rowId: row.getIn(['RowId', 'value']),
        value: row.getIn(['Name', 'value'])
    }
}

export function initSampleSetSelects(isUpdate: boolean, ssName: string, placeholderOption: IParentOption, prefix: string, ) :Promise<List<IParentOption>> {
    return selectRows({
        schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
        queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
        columns: 'LSID, Name, RowId'
    }).then(results => {
        const sampleSets = fromJS(results.models[results.key]);

        let sets = List<IParentOption>();
        sampleSets.forEach(row => {
            const name = row.getIn(['Name', 'value']);
            let label = placeholderOption && name === ssName ? placeholderOption.label : name;
            sets = sets.push({
                value: prefix + name,
                label: label,
                schema: SCHEMAS.SAMPLE_SETS.SCHEMA,
                query: name, // Issue 33653: query name is case-sensitive for some data inputs (sample parents)
            });
        });

        if(!isUpdate) {
            sets = sets.push(placeholderOption);
        }

        return sets.sortBy(p => p.label, naturalSort) as List<IParentOption>;
    });
}



export function initSampleSetInsert(model: SampleIdCreationModel)  : Promise<Partial<SampleIdCreationModel>> {
    return new Promise( (resolve) => {

        return Promise.all([
            selectRows({
                schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
                queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
                columns: 'LSID,Name,RowId'
            }),
            initParents(model.parents, model.selectionKey)
        ]).then(results => {
            let [ sampleSetResult, sampleParents ] = results;
            const sampleSets = fromJS(sampleSetResult.models[sampleSetResult.key]);
            const sampleCount = sampleParents.find((parent) => parent.value !== undefined) ? 1 : 0;
            const parentOptions = sampleSets.map(row => {
                const name = row.getIn(['Name', 'value']);
                return {
                    value: name.toLowerCase(),
                    label: name,
                    schema: SCHEMAS.SAMPLE_SETS.SCHEMA,
                    query: name // Issue 33653: query name is case-sensitive for some data inputs (sample parents)
                }
            }).toList().sortBy(p => p.label, naturalSort);

            const sampleSetOptions = sampleSets
                .map(row => extractFromRow(row))
                .sortBy(r => r.label, naturalSort)
                .toList();

            let targetSampleSet;
            if (model.initialSampleSet) {
                const setName = model.initialSampleSet.toLowerCase();
                const data = sampleSets.find(row => setName === row.getIn(['Name', 'value']).toLowerCase());

                if (data) {
                    targetSampleSet = new SampleSetOption(extractFromRow(data));
                }
            }
            resolve({
                isInit: true,
                parentOptions,
                sampleCount,
                sampleParents,
                sampleSetOptions,
                targetSampleSet
            })
        })

    });
}

export function createSampleSet(config: ISampleSetDetails): Promise<any> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', 'createSampleSetApi.api'),
            method: 'POST',
            params: config,
            success: Utils.getCallbackWrapper((response) => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response);
            }),
        });
    });
}

export function getSampleSet(config: ISampleSetDetails): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', 'getSampleSetApi.api'),
            method: 'GET',
            params: config,
            success: Utils.getCallbackWrapper((response) => {
                resolve(Map(response));
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response);
            }),
        });
    });
}

export function updateSampleSet(config: ISampleSetDetails): Promise<any> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', 'updateMaterialSourceApi.api'),
            method: 'POST',
            params: config,
            success: Utils.getCallbackWrapper((response) => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response);
            }),
        });
    });
}

export function deleteSampleSet(rowId: number): Promise<any> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', 'deleteMaterialSource.api'),
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

export interface DeleteConfirmationData {
    canDelete: Array<any>
    cannotDelete: Array<any>
}

export function getSampleDeleteConfirmationData(selectionKey: string, rowIds?: Array<string>) : Promise<DeleteConfirmationData> {
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
           url: buildURL('experiment', "getMaterialDeleteConfirmationData.api", params),
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
               reject(response.exception);
           })
       })
    });
}

export function loadSelectedSamples(location: any, sampleColumn: QueryColumn): Promise<OrderedMap<any, any>> {
    return getSelection(location).then((selection) => {
        if (selection.resolved && selection.schemaQuery && selection.selected.length) {
            return selectRows({
                schemaName: selection.schemaQuery.schemaName,
                queryName: selection.schemaQuery.queryName,
                filterArray: [
                    Filter.create('RowId', selection.selected, Filter.Types.IN)
                ]
            }).then(response => {
                const { key, models, orderedModels } = response;
                const rows = fromJS(models[key]);
                let data = OrderedMap<any, any>();

                // The transformation done here makes the samples compatible with the editable grid on the assay upload
                // wizard.
                orderedModels[key].forEach((id) => {
                    data = data.setIn([id, sampleColumn.fieldKey], List([{
                        displayValue: rows.getIn([id, sampleColumn.lookup.displayColumn, 'value']),
                        value: rows.getIn([id, sampleColumn.lookup.keyColumn, 'value'])
                    }]));
                });

                return data;
            });
        }
    });
}
