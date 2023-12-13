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
import Formsy from 'formsy-react';

import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn } from '../../../public/QueryColumn';

import { AssayTaskInput } from '../forms/input/AssayTaskInput';

import { isWorkflowEnabled } from '../../app/utils';
import { LabelOverlay } from '../forms/LabelOverlay';
import { QueryFormInputs } from '../forms/QueryFormInputs';
import { FormsyInput, FormsyTextArea } from '../forms/input/FormsyReactComponents';

import { getContainerFilterForLookups } from '../../query/api';

import { useServerContext } from '../base/ServerContext';

import { AssayPropertiesPanelProps } from './models';

const NAME_LABEL = (
    <LabelOverlay
        description="The assay/experiment ID that uniquely identifies this assay run."
        label="Assay ID"
        type="Text (String)"
    />
);

const COMMENT_LABEL = (
    <LabelOverlay description="Contains comments about this run" label="Comments" type="Text (String)" />
);

export const RunPropertiesPanel: FC<AssayPropertiesPanelProps> = memo(
    ({ model, onChange, onWorkflowTaskChange, operation }) => {
        const { moduleContext } = useServerContext();
        // FIXME: Update the AssayWizardModel to use ExtendedMap for runColumns so we don't need to do this conversion.
        const queryColumns = useMemo(
            () => new ExtendedMap<string, QueryColumn>(model.runColumns.toJS()),
            [model.runColumns]
        );
        return (
            <div className="panel panel-default">
                <div className="panel-heading">Run Details</div>
                <div className="panel-body">
                    <Formsy className="form-horizontal" onChange={onChange}>
                        <FormsyInput
                            id="runname"
                            label={NAME_LABEL}
                            labelClassName="text-left"
                            name="runname"
                            value={model.runName}
                        />
                        <FormsyTextArea
                            cols={60}
                            id="comment"
                            label={COMMENT_LABEL}
                            labelClassName="text-left"
                            name="comment"
                            rows={2}
                            value={model.comment}
                        />
                        {isWorkflowEnabled(moduleContext) && (
                            <AssayTaskInput
                                assayId={model.assayDef.id}
                                containerFilter={getContainerFilterForLookups()}
                                formsy
                                name="workflowtask"
                                value={model.workflowTask}
                                onChange={onWorkflowTaskChange}
                            />
                        )}
                        {model.runColumns.size !== 0 && (
                            <QueryFormInputs
                                containerFilter={getContainerFilterForLookups()}
                                fieldValues={model.runProperties.toObject()}
                                operation={operation}
                                queryColumns={queryColumns}
                                renderFileInputs
                            />
                        )}
                    </Formsy>
                </div>
            </div>
        );
    }
);

RunPropertiesPanel.displayName = 'RunPropertiesPanel';
