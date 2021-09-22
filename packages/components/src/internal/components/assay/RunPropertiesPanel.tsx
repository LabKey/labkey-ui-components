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
import React, { FC, memo } from 'react';
import Formsy from 'formsy-react';
import { Input, Textarea } from 'formsy-react-components';

import { QueryFormInputs, LabelOverlay } from '../../..';

import { AssayPropertiesPanelProps } from './models';

export const RunPropertiesPanel: FC<AssayPropertiesPanelProps> = memo(props => {
    const { model, onChange, title = 'Run Details', showQuerySelectPreviewOptions } = props;

    return (
        <div className="panel panel-default">
            <div className="panel-heading">{title}</div>
            <div className="panel-body">
                <Formsy className="form-horizontal" onChange={onChange}>
                    <Input
                        changeDebounceInterval={0}
                        id="runname"
                        label={
                            <LabelOverlay
                                description="The assay/experiment ID that uniquely identifies this assay run."
                                label="Assay ID"
                                type="Text (String)"
                            />
                        }
                        labelClassName="text-left"
                        name="runname"
                        type="text"
                        value={model.runName}
                    />
                    <Textarea
                        changeDebounceInterval={0}
                        cols={60}
                        id="comment"
                        label={
                            <LabelOverlay
                                description="Contains comments about this run"
                                label="Comments"
                                type="Text (String)"
                            />
                        }
                        labelClassName="text-left"
                        name="comment"
                        rows={2}
                        value={model.comment}
                    />
                    {model.runColumns.size !== 0 && (
                        <QueryFormInputs
                            fieldValues={model.runProperties.toObject()}
                            queryColumns={model.runColumns}
                            renderFileInputs
                            showQuerySelectPreviewOptions={showQuerySelectPreviewOptions}
                        />
                    )}
                </Formsy>
            </div>
        </div>
    );
});

RunPropertiesPanel.displayName = 'RunPropertiesPanel';
