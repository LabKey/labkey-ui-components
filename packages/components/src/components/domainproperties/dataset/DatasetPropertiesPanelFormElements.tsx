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
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCheckSquare} from '@fortawesome/free-solid-svg-icons/faCheckSquare';
import {faSquare} from '@fortawesome/free-regular-svg-icons/faSquare';
import {DatasetModel} from './models';
import {BasicPropertiesTitle, TextInputWithLabel} from "../PropertiesPanelFormElements";
import {SelectInput} from "../../../index";
import {Creatable} from 'react-select'
import {fetchCategories} from "./actions";

interface BasicPropertiesInputsProps {
    model: DatasetModel;
    onInputChange: (any) => void;
}

export class DescriptionInput extends React.PureComponent<BasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.description === null ? '' : model.description;

        return(
            <Row className={'margin-top'}>
                <Col xs={3} lg={2}>
                    Description
                </Col>

                <Col xs={9} lg={8}>
                    <textarea
                        className="form-control textarea-noresize"
                        id={'description'}
                        value={value}
                        onChange={onInputChange}
                    />
                </Col>

                <Col lg={2}/>
            </Row>
        );
    }
}

export class SelectPropertyInput extends React.PureComponent<any> {
    render() {
        const { label, model, onInputChange, options } = this.props;

        return(
            <Row className={'margin-top'}>
                <Col xs={4} lg={2}>
                    {label}
                </Col>

                <Col xs={8} lg={7}>
                    <SelectInput
                        onChange={onInputChange}
                        value={model.category}
                        options={options}
                        inputClass="" // This attr is necessary for proper styling
                        labelClass=""
                        valueKey="name"
                        labelKey="label"
                        formsy={false}
                        multiple={false}
                        required={false}
                        placeholder="Select dataset category"
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
                    category: model.categoryId,
                    availableCategories: data.categories
                }))
            })

    }

    handleChange = (value) => {
        this.setState(() => ({value}));
    };

    render() {
        const { model, onInputChange } = this.props;
        const { availableCategories, category } = this.state;

        return (
            <Col xs={12} md={7}>
                <BasicPropertiesTitle title="Basic Properties" />

                <TextInputWithLabel
                    name="Name *"
                    value={model.name}
                    placeholder="Enter a name for this dataset"
                    onInputChange={onInputChange}
                />

                <DescriptionInput model={model} onInputChange={onInputChange} />

                <Row className={'margin-top'}>
                    <Col xs={3} lg={2}>
                        Category
                    </Col>

                    <Col xs={9} lg={8}>
                        <Creatable
                            placeholder="Select dataset category"
                            onChange={this.handleChange}
                            value={category}
                            options={availableCategories}
                        />
                    </Col>

                    <Col lg={2}/>
                </Row>

                <TextInputWithLabel
                    name="Label"
                    value={model.label}
                    onInputChange={onInputChange}
                />
            </Col>
        );
    }
}

interface CheckBoxProps {
    checked: boolean;
    onClick: any;
}
export class CheckBox extends React.PureComponent<CheckBoxProps> {
    render() {
        const { onClick, checked } = this.props;

        const checkedOrNot = checked ? (
            <FontAwesomeIcon size="lg" icon={faCheckSquare} color="#0073BB" />
        ) : (
            <FontAwesomeIcon size="lg" icon={faSquare} color="#adadad" />
        );

        return (
            <span className='list__properties__no-highlight' onClick={onClick}>
                {checkedOrNot}
            </span>
        );
    }
}

interface CheckBoxRowProps {
    checked: boolean;
    onCheckBoxChange: (name, checked) => void;
    name: string;
    text: string;
}

export class CheckBoxRow extends React.PureComponent<CheckBoxRowProps> {
    render() {
        const { checked, onCheckBoxChange, name, text } = this.props;

        return (
            <div className='list__properties__checkbox-row'>
                <CheckBox
                    checked={checked}
                    onClick={() => {
                        onCheckBoxChange(name, checked);
                    }}
                />
                <span className='list__properties__checkbox-text'>{text}</span>
            </div>
        );
    }
}

interface DataRowUniquenessContainerProps {
    model: DatasetModel;
    onCheckBoxChange: (name, checked) => void;
}

class DataRowUniquenessContainer extends React.PureComponent<DataRowUniquenessContainerProps> {
    render() {
        const { onCheckBoxChange } = this.props;
        // const { allowDelete, allowUpload, allowExport } = this.props.model;

        return (
            <div className='dataset_data_row_uniqueness_container'>
                <Radio
                    name="participantId"
                    checked={false}>
                    Participant ID only (demographic data)
                </Radio>
                <Radio
                    name="timepoint"
                    checked={true}>
                    Participant ID and timepoint
                </Radio>
                <Radio
                    name="additionalKeyField"
                    checked={false}>
                    Participant ID, timepoint, and additional key field
                </Radio>
            </div>
        );
    }
}

interface AllowableActionsProps {
    model: DatasetModel;
    onCheckBoxChange: (name: string, checked: boolean) => void;
}
export class AllowableActions extends React.PureComponent<AllowableActionsProps> {
    render() {
        return (
            <>
                <Col xs={12} md={4}>
                    <BasicPropertiesTitle
                        title="Data Row Uniqueness"
                    />

                    <div>
                        Choose criteria for how particpants and visits are paired with or without an additional data column
                    </div>

                    <DataRowUniquenessContainer
                        model={this.props.model}
                        onCheckBoxChange={this.props.onCheckBoxChange}
                    />

                    <SelectPropertyInput
                        label="Additional Key Field"
                        model={this.props.model}
                    />
                </Col>
            </>
        );
    }
}
