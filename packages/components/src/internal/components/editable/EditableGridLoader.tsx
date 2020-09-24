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

import { EditorModel } from '../../models';
import { selectRows } from '../../query/api';
import { IGridLoader, IGridResponse, QueryGridModel } from '../base/models/model';

export class EditableGridLoader implements IGridLoader {
    fetch(gridModel: QueryGridModel): Promise<IGridResponse> {
        return new Promise((resolve, reject) => {
            return selectRows({
                schemaName: gridModel.schema,
                queryName: gridModel.query,
                filterArray: gridModel.getFilters().toJS(),
                sort: gridModel.getSorts(),
                columns: gridModel.getRequestColumnsString(),
                offset: gridModel.getOffset(),
                maxRows: gridModel.getMaxRows(),
            })
                .then(response => {
                    const { models, orderedModels, totalRows, messages } = response;

                    resolve({
                        data: EditorModel.convertQueryDataToEditorData(fromJS(models[gridModel.getModelName()])),
                        dataIds: List(orderedModels[gridModel.getModelName()]),
                        totalRows,
                        messages,
                    });
                })
                .catch(error => {
                    reject({
                        gridModel,
                        error,
                    });
                });
        });
    }
}
