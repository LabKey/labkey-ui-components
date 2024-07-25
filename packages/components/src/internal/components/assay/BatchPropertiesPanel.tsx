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
import React, { FC, memo, useMemo } from 'react';
import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn } from '../../../public/QueryColumn';

import { Formsy } from '../forms/formsy';
import { QueryFormInputs } from '../forms/QueryFormInputs';

import { getContainerFilterForLookups } from '../../query/api';

import { AssayPropertiesPanelProps } from './models';

export const BatchPropertiesPanel: FC<AssayPropertiesPanelProps> = memo(({ model, onChange, operation }) => {
    if (model.batchColumns.size === 0) {
        return null;
    }

    // FIXME: Update the AssayWizardModel to use ExtendedMap for batchColumns so we don't need to do this conversion.
    const queryColumns = useMemo(
        () => new ExtendedMap<string, QueryColumn>(model.batchColumns.toJS()),
        [model.batchColumns]
    );

    const disabled = model.batchId !== undefined;

    return (
        <div className="panel panel-default">
            <div className="panel-heading">Batch Details</div>

            <div className="panel-body">
                <Formsy className="form-horizontal" onChange={onChange} disabled={disabled}>
                    <QueryFormInputs
                        containerFilter={getContainerFilterForLookups()}
                        fieldValues={model.batchProperties.toObject()}
                        operation={operation}
                        queryColumns={queryColumns}
                        renderFileInputs
                    />
                </Formsy>
            </div>
        </div>
    );
});

BatchPropertiesPanel.displayName = 'BatchPropertiesPanel';
