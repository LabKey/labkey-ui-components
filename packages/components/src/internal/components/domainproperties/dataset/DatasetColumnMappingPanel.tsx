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

import React from 'react';

import { Col, Row } from 'react-bootstrap';

import { List } from 'immutable';

import { SectionHeading } from '../SectionHeading';
import { DomainFieldLabel } from '../DomainFieldLabel';
import { DATETIME_RANGE_URI } from '../constants';

import { DomainField } from '../models';

import { SelectInput } from '../../forms/input/SelectInput';

import { DatasetModel } from './models';
import { getStudySubjectProp, getStudyTimepointLabel } from './utils';

interface Props {
    model: DatasetModel;
    onColumnMappingChange: (participantIdField?: string, timePointField?: string) => void;
    subjectColumnName: string;
    timepointType: string;
}

interface State {
    closestParticipantIdField?: string;
    closestTimepointField?: string;
}

export class DatasetColumnMappingPanel extends React.PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            closestParticipantIdField: this.findClosestColumn(this.props.subjectColumnName),
            closestTimepointField: this.findClosestColumn(this.props.timepointType),
        };

        this.props.onColumnMappingChange(this.state.closestParticipantIdField, this.state.closestTimepointField);
    }

    compareNames(name1: string, name2: string): boolean {
        return name1 === name2 || name1.indexOf(name2) >= 0 || name2.indexOf(name1) >= 0;
    }

    areColumnNamesAndTypesEquivalent(targetColumnName: string, inferredField: DomainField): boolean {
        const { subjectColumnName, timepointType } = this.props;

        const targetColumn = targetColumnName.toLowerCase().replace(' ', '');
        const inferredFieldName = inferredField.name.toLowerCase().replace(' ', '');

        if (targetColumnName === subjectColumnName) {
            return this.compareNames(targetColumn, inferredFieldName);
        } else if (targetColumnName === timepointType && timepointType === 'DATE') {
            return (
                this.compareNames('visitdate', inferredFieldName) &&
                (inferredField.rangeURI === 'xsd:datetime' || inferredField.rangeURI === 'xsd:dateTime')
            );
        } else if (targetColumnName === timepointType && timepointType === 'VISIT') {
            return this.compareNames('sequencenum', inferredFieldName) && inferredField.rangeURI === 'xsd:double';
        } else if (targetColumnName === timepointType) {
            return (
                this.compareNames('date', inferredFieldName) &&
                (inferredField.rangeURI === 'xsd:datetime' || inferredField.rangeURI === 'xsd:dateTime')
            );
        }

        return false;
    }

    findClosestColumn(targetColumn: string): string {
        const inferredColumns = this.props.model.domain.fields;

        const matchedField = inferredColumns.find(
            field => field.name && field.rangeURI && this.areColumnNamesAndTypesEquivalent(targetColumn, field)
        );

        return matchedField ? matchedField.name : undefined;
    }

    onSelectChange = (name, formValue, selected): void => {
        const value = selected ? selected.name : undefined;

        this.setState(
            () => ({ [name]: value }),
            () => {
                this.props.onColumnMappingChange(
                    this.state.closestParticipantIdField,
                    this.state.closestTimepointField
                );
            }
        );
    };

    getTimepointFields(): List<DomainField> {
        const { model, timepointType } = this.props;

        if (timepointType === 'VISIT') {
            return model.domain.fields
                .filter(field => field.dataType.isNumeric() || field.dataType.isString())
                .toList();
        } else {
            // DATE or CONTINUOUS
            return model.domain.fields
                .filter(
                    field => field.rangeURI?.toLowerCase() === 'xsd:datetime' || field.rangeURI === DATETIME_RANGE_URI
                )
                .toList();
        }
    }

    render() {
        const { model } = this.props;
        const { closestParticipantIdField, closestTimepointField } = this.state;
        const participantIdTxt = getStudySubjectProp('nounPlural');
        const timepointTxt = getStudyTimepointLabel();
        const domain = model.domain;

        return (
            <>
                <SectionHeading title="Column mapping" />
                <div className="margin-top">
                    Columns already existing in the base dataset can be mapped with columns from your file. Choose a
                    column to map your {participantIdTxt} and {timepointTxt}.
                </div>
                <div className="row margin-top">
                    <Col lg={2} xs={2}>
                        <DomainFieldLabel label={participantIdTxt} />
                    </Col>
                    <Col lg={4} xs={5}>
                        <SelectInput
                            onChange={this.onSelectChange}
                            value={closestParticipantIdField}
                            options={domain.fields.toArray()}
                            inputClass=""
                            containerClass=""
                            labelClass=""
                            name="closestParticipantIdField"
                            labelKey="name"
                            valueKey="name"
                        />
                    </Col>
                    <Col lg={6} xs={5} />
                </div>
                <div className="row margin-top">
                    <Col lg={2} xs={2}>
                        <DomainFieldLabel label={timepointTxt} />
                    </Col>
                    <Col lg={4} xs={5}>
                        <SelectInput
                            onChange={this.onSelectChange}
                            value={closestTimepointField}
                            options={this.getTimepointFields().toArray()}
                            inputClass=""
                            containerClass=""
                            labelClass=""
                            name="closestTimepointField"
                            labelKey="name"
                            valueKey="name"
                        />
                    </Col>
                    <Col lg={6} xs={5} />
                </div>
            </>
        );
    }
}
