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
import {SelectInput} from "../../..";
import {Creatable, Option} from 'react-select'
import {fetchCategories, getHelpTip} from "./actions";
import {DatasetSettingsInput} from "./DatasetPropertiesAdvancedSettings";
import {CheckBox} from "../list/ListPropertiesPanelFormElements";
import "../../../theme/dataset.scss";
import {DomainFieldLabel} from "../DomainFieldLabel";
import {SectionHeading} from "../SectionHeading";

interface BasicPropertiesInputsProps {
    model: DatasetModel;
    onInputChange: (any) => void;
    onCategoryChange?: any;
}

interface BasicPropertiesInputsState {
    availableCategories: Array<Option>;
}

export class DescriptionInput extends React.PureComponent<BasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.description === null ? '' : model.description;

        return(
            <Row className={'margin-top'}>
                <Col xs={4}>
                    <DomainFieldLabel
                        label={'Description'}
                    />
                </Col>

                <Col xs={7}>
                    <textarea
                        className="form-control textarea-noresize"
                        id={'description'}
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

export class BasicPropertiesFields extends React.PureComponent<BasicPropertiesInputsProps, BasicPropertiesInputsState> {

    constructor(props) {
        super(props);

        this.state = {
             availableCategories: []
        };
    }

  getHelpTipElement(field: string) : JSX.Element {
        return <> {getHelpTip(field)} </> as JSX.Element;
  }

    componentDidMount() {
        const { model } = this.props;

        fetchCategories()
            .then((data) => {
                this.setState(() => ({
                    availableCategories: data.categories
                }))
            })
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
                    helpTip={this.getHelpTipElement("name")}
                    value={model.name}
                    placeholder="Enter a name for this dataset"
                    disabled={false}
                    onValueChange={onInputChange}
                    showInAdvancedSettings={false}
                    required={true}
                />

                <DescriptionInput
                    model={model}
                    onInputChange={onInputChange}
                />

                <Row className={'margin-top'}>

                    <Col xs={4}>
                        <DomainFieldLabel
                            label={"Category"}
                            required={false}
                            helpTipBody={() => this.getHelpTipElement("category")}
                        />
                    </Col>

                    <Col xs={7}>
                        {/*TODO: could be replaced by QuerySelect along with server side story*/}
                        <Creatable
                            name="categoryId"
                            placeholder="Select dataset category"
                            onChange={onCategoryChange}
                            value={model.categoryId}
                            options={availableCategories}
                        />
                    </Col>

                    <Col xs={1}/>

                </Row>

                <DatasetSettingsInput
                    name="label"
                    label="Label"
                    helpTip={this.getHelpTipElement("label")}
                    value={model.label}
                    disabled={false}
                    onValueChange={onInputChange}
                    showInAdvancedSettings={false}
                    required={false}
                />

            </>
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
}

export class DataRowUniquenessContainer extends React.PureComponent<DataRowUniquenessContainerProps> {

    getDataRowSetting(model: DatasetModel) : number {
        let dataRowSetting = -1;

        // participant id
        if (model.keyProperty === undefined || model.keyProperty === null) {
            dataRowSetting = 0;
        }

        // participant id and timepoint
        if (model.keyProperty !== null && (model.keyManagementType === undefined || model.keyManagementType === null)) {
            dataRowSetting = 1;
        }

        // participant id, timepoint and additional key field
        if (model.keyProperty !== null && model.keyManagementType !== null) {
            dataRowSetting = 2;
        }

        return dataRowSetting;
    }

    render() {
        const { model, onRadioChange } = this.props;
        const domain = model.domain;

        // const dataRowSetting = this.getDataRowSetting(model);
        const dataRowSetting = model.dataRowSetting;
        const showAdditionalKeyField = dataRowSetting === 2;

        const showAdditionalKeyFieldCls = showAdditionalKeyField ? "dataset_data_row_uniqueness_keyField_show" : "dataset_data_row_uniqueness_keyField_hide";

        return (
            <>
                <SectionHeading title="Data Row Uniqueness" />

                <div>
                    Choose criteria for how participants and visits are paired with or without an additional data column
                </div>

                <DataRowUniquenessElements
                    onRadioChange={onRadioChange}
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
            </>
        );
    }
}
