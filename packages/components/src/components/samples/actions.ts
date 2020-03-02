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
import { Ajax, Filter, Utils } from '@labkey/api';
import { fromJS, List, Map, OrderedMap } from 'immutable';

import { IEntityTypeDetails, IParentOption, } from '../entities/models';
import { getSelection } from '../../actions';
import { SCHEMAS } from '../base/models/schemas';
import { QueryColumn, SchemaQuery } from '../base/models/model';
import { buildURL } from '../../url/ActionURL';
import { naturalSort } from '../../util/utils';
import { selectRows } from '../../query/api';
import { Location } from '../../util/URL';

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

export function createSampleSet(config: IEntityTypeDetails): Promise<any> {
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

export function updateSampleSet(config: IEntityTypeDetails): Promise<any> {
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

/**
 * Fetches an OrderedMap of Sample Set rows specified by a schemaQuery and collection of filters. This data
 * is mapped via the sampleColumn to make it compatible with editable grid data.
 * @param schemaQuery SchemaQuery which sources the request for rows
 * @param sampleColumn A QueryColumn used to map fieldKey, displayColumn, and keyColumn data
 * @param filterArray A collection of filters used when requesting rows
 */
export function fetchSamples(schemaQuery: SchemaQuery, sampleColumn: QueryColumn, filterArray: Array<Filter.IFilter>): Promise<OrderedMap<any, any>> {
    return selectRows({
        schemaName: schemaQuery.schemaName,
        queryName: schemaQuery.queryName,
        filterArray,
    }).then(response => {
        const { key, models, orderedModels } = response;
        const rows = fromJS(models[key]);
        let data = OrderedMap<any, any>();

        orderedModels[key].forEach((id) => {
            data = data.setIn([id, sampleColumn.fieldKey], List([{
                displayValue: rows.getIn([id, sampleColumn.lookup.displayColumn, 'value']),
                value: rows.getIn([id, sampleColumn.lookup.keyColumn, 'value']),
            }]));
        });

        return data;
    });
}

/**
 * Loads a collection of RowIds from a selectionKey found on "location". Uses [[fetchSamples]] to query and filter
 * the Sample Set data.
 * @param location The location to search for the selectionKey on
 * @param sampleColumn A QueryColumn used to map data in [[fetchSamples]]
 */
export function loadSelectedSamples(location: Location, sampleColumn: QueryColumn): Promise<OrderedMap<any, any>> {
    return getSelection(location).then((selection) => {
        if (selection.resolved && selection.schemaQuery && selection.selected.length) {
            return fetchSamples(selection.schemaQuery, sampleColumn, [
                Filter.create('RowId', selection.selected, Filter.Types.IN)
            ]);
        }
    });
}
