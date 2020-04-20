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
import Formsy from 'formsy-react';
import { is } from 'immutable';

import { QueryFormInputs } from '../forms/QueryFormInputs';

import { AssayPropertiesPanelProps } from './models';

export class BatchPropertiesPanel extends React.Component<AssayPropertiesPanelProps, any> {
    shouldComponentUpdate(nextProps: AssayPropertiesPanelProps) {
        const { model } = this.props;

        return (
            !is(model.batchColumns, nextProps.model.batchColumns) ||
            !is(model.batchProperties, nextProps.model.runProperties)
        );
    }

    render() {
        const { model, onChange, title } = this.props;
        const panelTitle = title || 'Batch Details';

        if (model.batchColumns.size) {
            const disabled = model.batchId !== undefined;

            return (
                <div className="panel panel-default">
                    <div className="panel-heading">{panelTitle}</div>

                    <div className="panel-body">
                        <Formsy className="form-horizontal" onChange={onChange} disabled={disabled}>
                            <QueryFormInputs
                                renderFileInputs={true}
                                queryColumns={model.batchColumns}
                                fieldValues={model.batchProperties.toObject()}
                                onChange={onChange}
                            />
                        </Formsy>
                    </div>
                </div>
            );
        }

        return null;
    }
}
