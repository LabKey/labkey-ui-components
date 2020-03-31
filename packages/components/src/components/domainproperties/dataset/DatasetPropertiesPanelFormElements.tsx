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
import {Col, Radio, Row} from 'react-bootstrap';
import {DatasetModel} from './models';
import {BasicPropertiesTitle} from "../PropertiesPanelFormElements";
import {LabelHelpTip, SelectInput} from "../../..";
import {Creatable} from 'react-select'
import {fetchCategories} from "./actions";
import {DatasetSettingsInput} from "./DatasetPropertiesAdvancedSettings";
import {CheckBox} from "../list/ListPropertiesPanelFormElements";
import "../../../theme/dataset.scss";

interface BasicPropertiesInputsProps {
    model?: DatasetModel;
    onInputChange: (any) => void;
    name?: string;
    description?: string;
    categoryId?: number;
    onCategoryChange?: any;
    label?: string;
}

export class DescriptionInput extends React.PureComponent<BasicPropertiesInputsProps> {
    render() {
        const { description, onInputChange } = this.props;
        const value = description === null ? '' : description;

        return(
            <Row className={'margin-top'}>
                <Col xs={4}>
                    Description
                </Col>

                <Col xs={7}>
                    <textarea
                        className="form-control textarea-noresize"
                        id="description"
                        value={value}
                        onChange={onInputChange}
                    />
                </Col>
            </Row>
        );
    }
}

export class SelectPropertyInput extends React.PureComponent<any> {
    render() {
        const { label, labelKey, valueKey, onInputChange, options, disabled } = this.props;

        return(
            <Row className={'margin-top'}>
                <Col xs={4} >
                    {label}
                </Col>

                <Col xs={7} >
                    <SelectInput
                        onChange={onInputChange}
                        options={options}
                        inputClass="" // This attr is necessary for proper styling
                        labelClass=""
                        valueKey={valueKey}
                        labelKey={labelKey}
                        formsy={false}
                        multiple={false}
                        required={false}
                        disabled={disabled}
                    />
                </Col>

                <Col lg={3}/>
            </Row>
        );
    }
}

export class BasicPropertiesFields extends React.PureComponent<BasicPropertiesInputsProps, any> {

    constructor(props) {
        super(props);

        this.state = {
             category: this.props.model.categoryId,
             availableCategories: []
        };
    }

    componentDidMount() {
        const { model } = this.props;

        // Ajax call handling to get available categories
        fetchCategories()
            .then((data) => {
                this.setState(() => ({
                    availableCategories: data.categories
                }))
            })
    }

    render() {
        const { name, description, categoryId, label, onInputChange, onCategoryChange } = this.props;
        const { availableCategories } = this.state;

        const nameTip =
            <>
                Required. This name must be unique. It is used when identifying datasets during data upload.
            </> as JSX.Element;

        const categoryTip =
            <>
                Assigning a category to a dataset will group it with similar datasets in the navigator and data browser.
            </> as JSX.Element;

        const labelTip =
            <>
                The name of the dataset shown to users. If no Label is provided, the Name is used.
            </> as JSX.Element;

        return (
            <Col md={6}>
                <BasicPropertiesTitle title="Basic Properties" />

                <DatasetSettingsInput
                    name="name"
                    label="Name *"
                    helpTip={nameTip}
                    value={name}
                    placeholder="Enter a name for this dataset"
                    disabled={false}
                    onValueChange={onInputChange}
                    showInAdvancedSettings={false}
                />

                <DescriptionInput
                    description={description}
                    onInputChange={onInputChange}
                />

                <Row className={'margin-top'}>

                    <Col xs={4}>
                        Category
                        <LabelHelpTip
                            title="Category"
                            body={() => {
                                return <> {categoryTip} </>;
                            }}
                        />
                    </Col>

                    <Col xs={7}>
                        {/*TODO: could be replaced by QuerySelect along with server side story*/}
                        <Creatable
                            name="categoryId"
                            placeholder="Select dataset category"
                            onChange={onCategoryChange}
                            value={categoryId}
                            options={availableCategories}
                        />
                    </Col>

                </Row>

                <DatasetSettingsInput
                    name="label"
                    label="Label"
                    helpTip={labelTip}
                    value={label}
                    disabled={false}
                    onValueChange={onInputChange}
                    showInAdvancedSettings={false}
                />

            </Col>
        );
    }
}

interface DataRowUniquenessElementsProps {
    onRadioChange: (evt: any) => any;
    dataRowSetting: number;
}

class DataRowUniquenessElements extends React.PureComponent<DataRowUniquenessElementsProps> {
    render() {
        const { onRadioChange, dataRowSetting } = this.props;
        const radioName = "dataRowSetting";

        return (
            <div className='dataset_data_row_uniqueness_container'>
                <Radio
                    name={radioName}
                    value={0}
                    checked={dataRowSetting == 0}
                    onChange={onRadioChange}
                >
                    Participant ID only (demographic data)
                </Radio>

                <Radio
                    name={radioName}
                    value={1}
                    checked={dataRowSetting == 1}
                    onChange={onRadioChange}
                >
                    Participant ID and timepoint
                </Radio>

                <Radio
                    name={radioName}
                    value={2}
                    checked={dataRowSetting == 2}
                    onChange={onRadioChange}
                >
                    Participant ID, timepoint, and additional key field
                </Radio>
            </div>
        );
    }
}

interface DataRowUniquenessContainerProps {
    model: DatasetModel;
    onRadioChange: (e: any) => any;
    dataRowSetting: number;
    showAdditionalKeyField: boolean;
}

export class DataRowUniquenessContainer extends React.PureComponent<DataRowUniquenessContainerProps> {
    render() {
        const { model, dataRowSetting, showAdditionalKeyField } = this.props;
        const domain = model.domain;

        const showAdditionalKeyFieldCls = showAdditionalKeyField ? "dataset_data_row_uniqueness_keyField_show" : "dataset_data_row_uniqueness_keyField_hide";

        return (
            <>
                <Col md={6}>
                    <BasicPropertiesTitle
                        title="Data Row Uniqueness"
                    />

                    <div>
                        Choose criteria for how participants and visits are paired with or without an additional data column
                    </div>

                    <DataRowUniquenessElements
                        onRadioChange={this.props.onRadioChange}
                        dataRowSetting={dataRowSetting}
                    />

                    <div className={showAdditionalKeyFieldCls}>
                        <SelectPropertyInput
                            label="Additional Key Field"
                            options={domain.fields.toArray()}
                            labelKey="name"
                            valueKey="propertyId"
                            disabled={!showAdditionalKeyField}
                        />

                        <CheckBox
                            checked={false}
                            onClick={() => {}}
                        />
                        &nbsp; Let server manage fields to make entries unique
                    </div>

                </Col>
            </>
        );
    }
}
