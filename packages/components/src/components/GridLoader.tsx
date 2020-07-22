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
import React from 'react';
import { fromJS, List } from 'immutable';

import { selectRows } from '../query/api';
import { getSelected } from '../actions';

import { IGridLoader, IGridResponse, IGridSelectionResponse, QueryGridModel } from './base/models/model';

class GridLoader implements IGridLoader {
    fetch(model: QueryGridModel): Promise<IGridResponse> {
        return new Promise((resolve, reject) => {
            return selectRows({
                containerPath: model.containerPath,
                containerFilter: model.containerFilter,
                schemaName: model.schema,
                queryName: model.query,
                viewName: model.view,
                filterArray: model.getFilters().toJS(),
                sort: model.getSorts(),
                columns: model.getRequestColumnsString(),
                offset: model.getOffset(),
                maxRows: model.getMaxRows(),
                parameters: model.queryParameters,
                includeDetailsColumn: model.includeDetailsColumn,
                includeUpdateColumn: model.includeUpdateColumn,
            })
                .then(response => {
                    const { models, orderedModels, totalRows, messages } = response;

                    resolve({
                        data: fromJS(models[model.getModelName()]),
                        dataIds: List(orderedModels[model.getModelName()]),
                        totalRows,
                        messages,
                    });
                })
                .catch(error => {
                    reject({
                        model,
                        error,
                    });
                });
        });
    }

    fetchSelection(model: QueryGridModel): Promise<IGridSelectionResponse> {
        return new Promise((resolve, reject) => {
            // TODO: filterArray should be model.getFilters();
            return getSelected(model.getId(), model.schema, model.query, model.filterArray, model.containerPath, model.queryParameters)
                .then(response => {
                    resolve({
                        selectedIds: List(response.selected),
                    });
                })
                .catch(error => {
                    reject({
                        model,
                        error,
                    });
                });
        });
    }
}

export const DefaultGridLoader = new GridLoader();
