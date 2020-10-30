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
import { List, Map } from 'immutable';

import { getSelectedData } from '../../actions';
import { EditorModel } from '../../models';
import { IGridLoader, IGridResponse, QueryGridModel } from '../../..';

export class EditableGridLoaderFromSelection implements IGridLoader {
    updateData: any;
    dataForSelection: Map<string, any>;
    dataIdsForSelection: List<any>;
    model: QueryGridModel;

    constructor(updateData, dataForSelection: Map<string, any>, dataIdsForSelection: List<any>) {
        this.updateData = updateData || {};
        this.dataForSelection = dataForSelection;
        this.dataIdsForSelection = dataIdsForSelection;
    }

    selectAndFetch(gridModel: QueryGridModel): Promise<IGridResponse> {
        return new Promise((resolve, reject) => {
            const { schema, query, queryParameters } = gridModel;
            const columnString = gridModel.getRequestColumnsString();
            const sorts = gridModel.getSorts();
            const selectedIds = this.dataIdsForSelection.toArray();
            return getSelectedData(schema, query, selectedIds, columnString, sorts, queryParameters)
                .then(response => {
                    const { data, dataIds, totalRows } = response;
                    resolve({
                        data: EditorModel.convertQueryDataToEditorData(data, Map<any, any>(this.updateData)),
                        dataIds,
                        totalRows,
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

    fetchFromData(): Promise<IGridResponse> {
        return new Promise(resolve => {
            const data = EditorModel.convertQueryDataToEditorData(
                this.dataForSelection,
                Map<any, any>(this.updateData)
            );

            resolve({
                data,
                dataIds: this.dataIdsForSelection,
                totalRows: data.size,
            });
        });
    }

    fetch(gridModel: QueryGridModel): Promise<IGridResponse> {
        if (this.dataForSelection) {
            return this.fetchFromData();
        } else {
            return this.selectAndFetch(gridModel);
        }
    }
}
