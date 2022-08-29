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
import { List, Map } from 'immutable';

import { getSelectedData } from '../../actions';
import { EditorModel, IEditableGridLoader, IGridResponse } from '../../models';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { QueryInfo } from '../../../public/QueryInfo';
import { QueryColumn } from '../../../public/QueryColumn';

export class EditableGridLoaderFromSelection implements IEditableGridLoader {
    id: string;
    idsNotToUpdate: number[];
    fieldsNotToUpdate: string[];
    model: QueryModel;
    omittedColumns: string[];
    queryInfo: QueryInfo;
    requiredColumns: string[];
    updateColumns: List<QueryColumn>;
    updateData: any;

    constructor(
        id: string,
        queryInfo: QueryInfo,
        updateData,
        requiredColumns?: string[],
        omittedColumns?: string[],
        updateColumns?: List<QueryColumn>,
        idsNotToUpdate?: any[],
        fieldsNotToUpdate?: string[]
    ) {
        this.id = id;
        this.queryInfo = queryInfo;
        this.updateData = updateData || {};
        this.requiredColumns = requiredColumns || [];
        this.omittedColumns = omittedColumns || [];
        this.updateColumns = updateColumns;
        this.idsNotToUpdate = idsNotToUpdate || [];
        this.fieldsNotToUpdate = fieldsNotToUpdate || [];
    }

    selectAndFetch(gridModel: QueryModel): Promise<IGridResponse> {
        return new Promise((resolve, reject) => {
            const { queryParameters, schemaQuery } = gridModel;
            const columnString = gridModel.getRequestColumnsString(this.requiredColumns, this.omittedColumns);
            const sorts = gridModel.sortString;
            const selectedIds = [...gridModel.selections];

            return getSelectedData(
                schemaQuery.schemaName,
                schemaQuery.queryName,
                selectedIds,
                columnString,
                sorts,
                queryParameters
            )
                .then(response => {
                    const { data, dataIds, totalRows } = response;
                    resolve({
                        data: EditorModel.convertQueryDataToEditorData(
                            data,
                            Map<any, any>(this.updateData),
                            this.idsNotToUpdate,
                            this.fieldsNotToUpdate
                        ),
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

    fetch(gridModel: QueryModel): Promise<IGridResponse> {
        return this.selectAndFetch(gridModel);
    }
}
