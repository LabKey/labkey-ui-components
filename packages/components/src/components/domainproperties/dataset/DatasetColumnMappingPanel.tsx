/*
 * Copyright (c) 2020 LabKey Corporation
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

import {DatasetModel} from "./models";
import React from "react";
import {SectionHeading} from "../SectionHeading";
import {Col, Row} from "react-bootstrap";
import {DomainFieldLabel} from "../DomainFieldLabel";
import {SelectInput} from "../../..";

interface Props {
    model: DatasetModel;
    onModelChange: (model: DatasetModel) => void;
}

export class DatasetColumnMappingPanel extends React.PureComponent<Props>{
    render() {
        const { model } = this.props;
        const domain = model.domain;

        return (
            <>
                <SectionHeading title="Column mapping" />
                <div className='margin-top'>
                    Columns already existing in the domain can be mapped with columns from your file.
                    Choose a column to match your ParticipantID and Timepoints.
                </div>
                <Row className='margin-top'>
                    <Col xs={4}>
                        <DomainFieldLabel
                            label={'ParticipantID'}
                        />
                    </Col>
                    <Col xs={5}>
                        <SelectInput
                            onChange={() => {}}
                            // value={selectedValue}
                            options={domain.fields.toArray()}
                            inputClass=""
                            containerClass=""
                            labelClass=""
                            formsy={false}
                            multiple={false}
                            required={false}
                            name={"participantIdField"}
                            labelKey={"label"}
                            valueKey={"propertyId"}
                            clearable={false}
                        />
                    </Col>
                    <Col xs={3}/>
                </Row>
                <Row className='margin-top'>
                    <Col xs={4}>
                        <DomainFieldLabel
                            label={'Timepoint'}
                        />
                    </Col>
                    <Col xs={5}>
                        <SelectInput
                            onChange={() => {}}
                            // value={selectedValue}
                            options={domain.fields.toArray()}
                            inputClass=""
                            containerClass=""
                            labelClass=""
                            formsy={false}
                            multiple={false}
                            required={false}
                            name={"timepointField"}
                            labelKey={"label"}
                            valueKey={"propertyId"}
                            clearable={false}
                        />
                    </Col>
                    <Col xs={3}/>
                </Row>
            </>
        );
    }
}
