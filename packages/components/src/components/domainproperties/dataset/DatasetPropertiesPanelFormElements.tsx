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
import { Col, Checkbox, Radio, Row } from 'react-bootstrap';

import { Creatable, Option } from 'react-select';

import { DatasetModel } from './models';
import { fetchAdditionalKeyFields, fetchCategories, getHelpTip } from './actions';
import { DatasetSettingsInput, DatasetSettingsSelect } from './DatasetPropertiesAdvancedSettings';

import '../../../theme/dataset.scss';
import { DomainFieldLabel } from '../DomainFieldLabel';
import { SectionHeading } from '../SectionHeading';

import { getServerContext } from '@labkey/api';

interface BasicPropertiesInputsProps {
    model: DatasetModel;
    onInputChange: (any) => void;
    onCategoryChange?: any;
}

interface BasicPropertiesInputsState {
    availableCategories: Option[];
}

export class DescriptionInput extends React.PureComponent<BasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.description === null ? '' : model.description;

        return (
            <Row className="margin-top">
                <Col xs={4}>
                    <DomainFieldLabel label="Description" />
                </Col>

                <Col xs={7}>
                    <textarea
                        className="form-control textarea-noresize"
                        id="description"
                        value={value}
                        onChange={onInputChange}
                    />
                </Col>

                <Col xs={1} />
            </Row>
        );
    }
}

export class BasicPropertiesFields extends React.PureComponent<BasicPropertiesInputsProps, BasicPropertiesInputsState> {
    constructor(props) {
        super(props);

        this.state = {
            availableCategories: [],
        };
    }

    getHelpTipElement(field: string): JSX.Element {
        return (<> {getHelpTip(field)} </>) as JSX.Element;
    }

    componentDidMount() {
        const { model } = this.props;

        fetchCategories().then(data => {
            this.setState(() => ({
                availableCategories: data.toArray(),
            }));
        });
    }

    render() {
        const { model, onInputChange, onCategoryChange } = this.props;
        const { availableCategories } = this.state;

        return (
            <>
                <SectionHeading title="Basic Properties" />

                <DatasetSettingsInput
                    name="name"
                    label="Name"
                    helpTip={this.getHelpTipElement('name')}
                    value={model.name}
                    placeholder="Enter a name for this dataset"
                    disabled={model.isFromAssay()}
                    onValueChange={onInputChange}
                    showInAdvancedSettings={false}
                    required={true}
                />

                <DescriptionInput model={model} onInputChange={onInputChange} />

                <Row className="margin-top">
                    <Col xs={4}>
                        <DomainFieldLabel
                            label="Category"
                            required={false}
                            helpTipBody={() => this.getHelpTipElement('category')}
                        />
                    </Col>

                    <Col xs={7}>
                        <Creatable
                            name="category"
                            placeholder="Select dataset category"
                            onChange={onCategoryChange}
                            value={model.category}
                            options={availableCategories}
                        />
                    </Col>

                    <Col xs={1} />
                </Row>

                <DatasetSettingsInput
                    name="label"
                    label="Label"
                    helpTip={this.getHelpTipElement('label')}
                    value={model.label}
                    disabled={false}
                    onValueChange={onInputChange}
                    showInAdvancedSettings={false}
                    required={true}
                />
            </>
        );
    }
}

interface DataRowUniquenessElementsProps {
    onRadioChange: (evt: any) => any;
    dataRowSetting: number;
    isFromAssay: boolean;
}

class DataRowUniquenessElements extends React.PureComponent<DataRowUniquenessElementsProps> {
    render() {
        const { onRadioChange, dataRowSetting, isFromAssay } = this.props;
        const radioName = 'dataRowSetting';

        const participantIdTxt = getServerContext().moduleContext.study.subject.nounPlural;
        const timepointTxt = getServerContext().moduleContext.study.timepointType === 'VISIT' ? 'Visit' : 'Timepoint';

        return (
            <div className="dataset_data_row_uniqueness_container">
                <Radio
                    name={radioName}
                    value={0}
                    checked={dataRowSetting === 0}
                    onChange={onRadioChange}
                    disabled={isFromAssay}
                >
                    {participantIdTxt} only (demographic data)
                </Radio>

                <Radio
                    name={radioName}
                    value={1}
                    checked={dataRowSetting === 1}
                    onChange={onRadioChange}
                    disabled={isFromAssay}
                >
                    {participantIdTxt} and {timepointTxt}
                </Radio>

                <Radio
                    name={radioName}
                    value={2}
                    checked={dataRowSetting === 2}
                    onChange={onRadioChange}
                    disabled={isFromAssay}
                >
                    {participantIdTxt}, {timepointTxt}, and additional key field
                </Radio>
            </div>
        );
    }
}

interface DataRowUniquenessContainerProps {
    model: DatasetModel;
    onRadioChange: (e: any) => any;
    onCheckBoxChange: (any) => void;
    onSelectChange: (name, formValue, selected) => void;
    keyPropertyIndex?: number;
}

export class DataRowUniquenessContainer extends React.PureComponent<DataRowUniquenessContainerProps> {
    getHelpTipForAdditionalField(): JSX.Element {
        return (
            <>
                <p>
                    If dataset has more than one row per participant/visit, an additional key field must be provided.
                    There can be at most one row in the dataset for each combination of participant, visit and key.
                </p>
                <ul>
                    <li>None: No additional key</li>
                    <li>Data Field: A user-managed key field</li>
                    <li>
                        Managed Field: A numeric or string field defined below will be managed by the server to make
                        each new entry unique. Numbers will be assigned auto-incrementing integer values, strings will
                        be assigned globally unique identifiers (GUIDs).
                    </li>
                </ul>
            </>
        ) as JSX.Element;
    }

    getHelpTipElement(field: string): JSX.Element {
        return (<> {getHelpTip(field)} </>) as JSX.Element;
    }

    render() {
        const { model, onRadioChange, onCheckBoxChange, onSelectChange, keyPropertyIndex } = this.props;
        const domain = model.domain;
        const additionalKeyFields = fetchAdditionalKeyFields(domain);

        const dataRowSetting = model.getDataRowSetting();
        const showAdditionalKeyField = dataRowSetting === 2 || model.isFromAssay();

        const validKeyField = model.validManagedKeyField();

        const showAdditionalKeyFieldCls = showAdditionalKeyField
            ? 'dataset_data_row_element_show margin-top'
            : 'dataset_data_row_element_hide';
        const keyPropertyManagedCls =
            showAdditionalKeyField && validKeyField
                ? 'dataset_data_row_element_show margin-top'
                : 'dataset_data_row_element_hide margin-top';

        const keyPropertyName =
            keyPropertyIndex !== undefined ? model.domain.fields.get(keyPropertyIndex).name : model.keyPropertyName;

        return (
            <>
                <SectionHeading
                    title="Data Row Uniqueness"
                    helpTipBody={() => this.getHelpTipElement('dataRowUniqueness')}
                />

                <DataRowUniquenessElements
                    onRadioChange={onRadioChange}
                    dataRowSetting={dataRowSetting}
                    isFromAssay={model.isFromAssay()}
                />

                <div className={showAdditionalKeyFieldCls}>
                    <DatasetSettingsSelect
                        name="keyPropertyName"
                        label="Additional Key Field"
                        selectOptions={additionalKeyFields.toArray()}
                        onSelectChange={onSelectChange}
                        labelKey="label"
                        valueKey="value"
                        selectedValue={keyPropertyName}
                        disabled={!showAdditionalKeyField}
                        helpTip={this.getHelpTipForAdditionalField()}
                        clearable={false}
                    />
                </div>

                <div className={keyPropertyManagedCls}>
                    <Checkbox
                        checked={model.keyPropertyManaged}
                        onChange={onCheckBoxChange}
                        id="keyPropertyManaged"
                        disabled={!showAdditionalKeyField || !validKeyField || model.isFromAssay()}
                    >
                        Let server manage fields to make entries unique
                    </Checkbox>
                </div>
            </>
        );
    }
}
