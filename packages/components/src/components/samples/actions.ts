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
import {ActionURL, Ajax, Domain, Filter, Query, Utils} from '@labkey/api';
import { fromJS, List, Map, OrderedMap } from 'immutable';

import { IEntityTypeDetails, IParentOption, } from '../entities/models';
import { getSelection } from '../../actions';
import { SCHEMAS } from '../base/models/schemas';
import { QueryColumn, SchemaQuery } from '../base/models/model';
import { buildURL } from '../../url/ActionURL';
import { naturalSort } from '../../util/utils';
import { selectRows } from '../../query/api';
import {DomainDetails} from "../domainproperties/models";

export function initSampleSetSelects(isUpdate: boolean, ssName: string, includeDataClasses: boolean): Promise<any[]> {
    let promises = [];

    //Get Sample Types
    promises.push(
            selectRows({
            schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
            queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
            columns: 'LSID, Name, RowId, Folder',
            containerFilter: Query.containerFilter.currentPlusProjectAndShared,
        })
    );

    //Get Data Classes
    if (includeDataClasses) {
        promises.push(
            selectRows({
                schemaName: SCHEMAS.EXP_TABLES.DATA_CLASSES.schemaName,
                queryName: SCHEMAS.EXP_TABLES.DATA_CLASSES.queryName,
                columns: 'LSID, Name, RowId, Folder',
                containerFilter: Query.containerFilter.currentPlusProjectAndShared,
            })
        );
    }

    return new Promise<any[]>((resolve, reject) => {
        return Promise.all(promises).then((responses) => {
            resolve(responses);
        }).catch((errorResponse) => {
            reject(errorResponse);
        });
    });



    // selectRows({
    //     schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
    //     queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
    //     columns: 'LSID, Name, RowId'
    // }).then(results => {
    //
    // });
}

export function getSampleSet(config: IEntityTypeDetails): Promise<any> {
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

export function getSampleTypeDetails(query: SchemaQuery, domainId?: number): Promise<any> {
    return new Promise<DomainDetails>((resolve, reject) => {
        const sampleSetConfig = {
            domainId,
            containerPath: ActionURL.getContainer(),
            queryName: query.getQuery(),
            schemaName: query.getSchema(),
        } as Domain.GetDomainOptions;

        return Ajax.request({
            url: buildURL('property', 'getDomainDetails.api'),
            method: 'GET',
            params: sampleSetConfig,
            success: Utils.getCallbackWrapper((response) => {
                resolve(DomainDetails.create(Map(response)));
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response);
            }),
        });
    });
}

// export function updateSampleSet(config: IEntityTypeDetails): Promise<any> {
//     return new Promise((resolve, reject) => {
//         return Ajax.request({
//             url: buildURL('experiment', 'updateMaterialSourceApi.api'),
//             method: 'POST',
//             params: config,
//             success: Utils.getCallbackWrapper((response) => {
//                 resolve(response);
//             }),
//             failure: Utils.getCallbackWrapper((response) => {
//                 reject(response);
//             }),
//         });
//     });
// }

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
