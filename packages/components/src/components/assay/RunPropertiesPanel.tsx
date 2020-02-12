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
import { Input, Textarea } from 'formsy-react-components';
import { is } from 'immutable';

import { QueryFormInputs } from '../forms/QueryFormInputs';
import { LabelOverlay } from '../forms/LabelOverlay';

import { AssayPropertiesPanelProps } from './models';

const ASSAY_ID_LABEL = (
    <LabelOverlay
        label="Assay Id"
        description="The assay/experiment ID that uniquely identifies this assay run."
        type="Text (String)"
    />
);

const COMMENT_LABEL = (
    <LabelOverlay label="Comments" description="Contains comments about this run" type="Text (String)" />
);

export class RunPropertiesPanel extends React.Component<AssayPropertiesPanelProps, any> {
    shouldComponentUpdate(nextProps: AssayPropertiesPanelProps) {
        return (
            this.props.model.comment !== nextProps.model.comment ||
            this.props.model.runName !== nextProps.model.runName ||
            !is(this.props.model.runColumns, nextProps.model.runColumns) ||
            !is(this.props.model.runProperties, nextProps.model.runProperties)
        );
    }

    render() {
        const { model, onChange, title } = this.props;
        const panelTitle = title || 'Run Details';

        return (
            <div className="panel panel-default">
                <div className="panel-heading">{panelTitle}</div>
                <div className="panel-body">
                    <Formsy className="form-horizontal" onChange={onChange}>
                        <Input
                            changeDebounceInterval={0}
                            label={ASSAY_ID_LABEL}
                            labelClassName="text-left"
                            name="runname"
                            type="text"
                            value={model.runName}
                        />
                        <Textarea
                            changeDebounceInterval={0}
                            cols={60}
                            label={COMMENT_LABEL}
                            labelClassName="text-left"
                            name="comment"
                            rows={2}
                            value={model.comment}
                        />
                        {model.runColumns.size !== 0 && (
                            <QueryFormInputs
                                renderFileInputs={true}
                                queryColumns={model.runColumns}
                                fieldValues={model.runProperties.toObject()}
                                onChange={onChange}
                            />
                        )}
                    </Formsy>
                </div>
            </div>
        );
    }
}
