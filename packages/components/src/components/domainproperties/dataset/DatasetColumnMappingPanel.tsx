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
import {DomainField, SelectInput} from "../../..";

interface Props {
    model: DatasetModel;
    onModelChange: (model: DatasetModel) => void;
    subjectColumnName?: string;
    timepointType?: string;
}

export class DatasetColumnMappingPanel extends React.PureComponent<Props>{

    areColumnNamesAndTypesEquivalent(targetColumnName: string, inferredField: DomainField): boolean {
        const { subjectColumnName, timepointType } = this.props;

        const targetColumn = targetColumnName.toLowerCase().replace(" ", "");
        const  inferredFieldName = inferredField.name.toLowerCase().replace(" ", "");

        if (targetColumnName === subjectColumnName) {
            return (targetColumn === inferredFieldName ||
                targetColumn.indexOf(inferredFieldName) >= 0 ||
                inferredFieldName.indexOf(targetColumn) >= 0) &&
                inferredField.rangeURI === "xsd:string";
        }
        else if (targetColumnName == timepointType && timepointType === "DATE") {
            const nameToFind = "visitdate";
            return (nameToFind === inferredFieldName ||
                nameToFind.indexOf(inferredFieldName) >= 0 ||
                inferredFieldName.indexOf(nameToFind) >= 0) &&
                inferredField.rangeURI === "xsd:datetime";
        }
        else if (targetColumnName == timepointType && timepointType === "VISIT") {
            const nameToFind = "sequencenum";
            return (nameToFind === inferredFieldName ||
                nameToFind.indexOf(inferredFieldName) >= 0 ||
                inferredFieldName.indexOf(nameToFind) >= 0) &&
                inferredField.rangeURI === "xsd:double";
        }
        else if (targetColumnName == timepointType) {
            const nameToFind = "date";
            return (nameToFind === inferredFieldName ||
                nameToFind.indexOf(inferredFieldName) >= 0 ||
                inferredFieldName.indexOf(nameToFind) >= 0) &&
                inferredField.rangeURI === "xsd:datetime";
        }
    }

    findClosestColumn(targetColumn: string): string {
        const inferredColumns = this.props.model.domain.fields;

        const matchedParticipantField = inferredColumns.find((field) => {
            let matchingNames = false;

            if (field.name && field.rangeURI) {
                matchingNames = this.areColumnNamesAndTypesEquivalent(targetColumn, field);
            }
            return matchingNames;
        });


        return matchedParticipantField ? matchedParticipantField.name : undefined;
    }

    render() {
        const { model, subjectColumnName, timepointType } = this.props;
        const domain = model.domain;

        const closestParticipantIdField = this.findClosestColumn(subjectColumnName);
        const closestTimepointField = this.findClosestColumn(timepointType);

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
                            value={closestParticipantIdField}
                            options={domain.fields.toArray()}
                            inputClass=""
                            containerClass=""
                            labelClass=""
                            formsy={false}
                            multiple={false}
                            required={false}
                            name={"participantIdField"}
                            labelKey={"name"}
                            valueKey={"name"}
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
                            value={closestTimepointField}
                            options={domain.fields.toArray()}
                            inputClass=""
                            containerClass=""
                            labelClass=""
                            formsy={false}
                            multiple={false}
                            required={false}
                            name={"timepointField"}
                            labelKey={"name"}
                            valueKey={"name"}
                            clearable={false}
                        />
                    </Col>
                    <Col xs={3}/>
                </Row>
            </>
        );
    }
}
