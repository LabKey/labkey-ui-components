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
import { Map } from 'immutable';

import { getSelectedData } from '../../actions';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { QueryInfo } from '../../../public/QueryInfo';
import { QueryColumn } from '../../../public/QueryColumn';

import { EditorMode, EditorModel, EditableGridLoader, GridResponse } from './models';

export class EditableGridLoaderFromSelection implements EditableGridLoader {
    columns: QueryColumn[];
    id: string;
    idsNotPermitted: number[];
    idsNotToUpdate: number[];
    fieldsNotToUpdate: string[];
    mode: EditorMode;
    model: QueryModel;
    omittedColumns: string[];
    queryInfo: QueryInfo;
    requiredColumns: string[];
    updateData: any;

    constructor(
        id: string,
        queryInfo: QueryInfo,
        updateData,
        requiredColumns?: string[],
        omittedColumns?: string[],
        columns?: QueryColumn[],
        idsNotToUpdate?: number[],
        fieldsNotToUpdate?: string[],
        idsNotPermitted?: number[]
    ) {
        this.columns = columns;
        this.id = id;
        this.mode = EditorMode.Update;
        this.queryInfo = queryInfo;
        this.updateData = updateData || {};
        this.requiredColumns = requiredColumns || [];
        this.omittedColumns = omittedColumns || [];
        this.idsNotToUpdate = idsNotToUpdate || [];
        this.fieldsNotToUpdate = fieldsNotToUpdate || [];
        this.idsNotPermitted = idsNotPermitted || [];
    }

    fetch(gridModel: QueryModel): Promise<GridResponse> {
        return new Promise((resolve, reject) => {
            const { queryName, queryParameters, schemaName, selections, sortString, viewName } = gridModel;

            const selections_ = [...selections].filter(s => this.idsNotPermitted.indexOf(parseInt(s, 10)) === -1);

            return getSelectedData(
                schemaName,
                queryName,
                selections_,
                gridModel.getRequestColumnsString(this.requiredColumns, this.omittedColumns, true),
                sortString,
                queryParameters,
                viewName
            )
                .then(response => {
                    const { data, dataIds } = response;
                    resolve({
                        data: EditorModel.convertQueryDataToEditorData(
                            data,
                            Map<any, any>(this.updateData),
                            this.idsNotToUpdate,
                            this.fieldsNotToUpdate
                        ),
                        dataIds,
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
