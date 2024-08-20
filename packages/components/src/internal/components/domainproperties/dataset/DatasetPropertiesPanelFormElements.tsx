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
import React, { ReactNode } from 'react';

import { DomainDesignerCheckbox } from '../DomainDesignerCheckbox';

import { DomainDesignerRadio } from '../DomainDesignerRadio';

import { SelectInput } from '../../forms/input/SelectInput';

import { DomainFieldLabel } from '../DomainFieldLabel';

import { SectionHeading } from '../SectionHeading';

import { DatasetModel } from './models';
import { fetchCategories, getAdditionalKeyFields, getHelpTip } from './actions';
import { getStudyTimepointLabel, StudyProperties } from './utils';
import { DatasetSettingsInput, DatasetSettingsSelect } from './DatasetPropertiesAdvancedSettings';

import { TIME_KEY_FIELD_KEY } from './constants';

type Option = any;

interface BasicPropertiesInputsProps {
    model: DatasetModel;
    onCategoryChange?: any;
    onInputChange: (any) => void;
    studyProperties: StudyProperties;
}

interface BasicPropertiesInputsState {
    availableCategories: Option[];
}

export class DescriptionInput extends React.PureComponent<BasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.description === null ? '' : model.description;

        return (
            <div className="row margin-top">
                <div className="col-xs-4">
                    <DomainFieldLabel label="Description" />
                </div>

                <div className="col-xs-7">
                    <textarea className="form-control" id="description" value={value} onChange={onInputChange} />
                </div>
            </div>
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

    componentDidMount(): void {
        fetchCategories()
            .then(data => {
                this.setState({
                    availableCategories: data.toArray(),
                });
            })
            .catch(error => {
                console.error('Failed to retrieve available categories.', error);
            });
    }

    getHelpTipElement = (field: string): ReactNode => {
        return <> {getHelpTip(field, this.props.studyProperties)} </>;
    };

    render() {
        const { model, onInputChange, onCategoryChange, studyProperties } = this.props;
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
                    disabled={model.isFromLinkedSource()}
                    onValueChange={onInputChange}
                    showInAdvancedSettings={false}
                    required={true}
                />

                <DatasetSettingsInput
                    name="label"
                    label="Label"
                    helpTip={this.getHelpTipElement('label')}
                    value={model.label}
                    disabled={false}
                    onValueChange={onInputChange}
                    showInAdvancedSettings={false}
                    required={!model.isNew()}
                />

                <DescriptionInput model={model} onInputChange={onInputChange} studyProperties={studyProperties} />

                <div className="row margin-top">
                    <div className="col-xs-4">
                        <DomainFieldLabel
                            label="Category"
                            required={false}
                            helpTipBody={this.getHelpTipElement('category')}
                        />
                    </div>

                    <div className="col-xs-7">
                        <SelectInput
                            allowCreate
                            containerClass=""
                            inputClass=""
                            name="category"
                            noResultsText="No categories exist yet"
                            onChange={onCategoryChange}
                            options={availableCategories}
                            placeholder="Select dataset category"
                            value={model.category}
                        />
                    </div>

                    <div className="col-xs-1" />
                </div>
            </>
        );
    }
}

interface DataRowUniquenessElementsProps {
    dataRowSetting: number;
    isFromAssay: boolean;
    onRadioChange: (evt: any) => any;
    studyProperties: StudyProperties;
}

class DataRowUniquenessElements extends React.PureComponent<DataRowUniquenessElementsProps> {
    render() {
        const { onRadioChange, dataRowSetting, isFromAssay, studyProperties } = this.props;
        const radioName = 'dataRowSetting';
        const participantIdTxt = studyProperties.SubjectNounPlural;
        const timepointTxt = getStudyTimepointLabel(studyProperties.TimepointType);

        return (
            <div className="dataset_data_row_uniqueness_container">
                <DomainDesignerRadio
                    name={radioName}
                    value={0}
                    checked={dataRowSetting === 0}
                    onChange={onRadioChange}
                    disabled={isFromAssay}
                >
                    {participantIdTxt} only (demographic data)
                </DomainDesignerRadio>

                <DomainDesignerRadio
                    name={radioName}
                    value={1}
                    checked={dataRowSetting === 1}
                    onChange={onRadioChange}
                    disabled={isFromAssay}
                >
                    {participantIdTxt} and {timepointTxt.toLowerCase()}
                </DomainDesignerRadio>

                <DomainDesignerRadio
                    name={radioName}
                    value={2}
                    checked={dataRowSetting === 2}
                    onChange={onRadioChange}
                    disabled={isFromAssay}
                >
                    {participantIdTxt}, {timepointTxt.toLowerCase()}, and additional key field
                </DomainDesignerRadio>
            </div>
        );
    }
}

interface DataRowUniquenessContainerProps {
    keyPropertyIndex?: number;
    model: DatasetModel;
    onCheckBoxChange: (any) => void;
    onRadioChange: (e: any) => any;
    onSelectChange: (name, formValue, selected) => void;
    studyProperties: StudyProperties;
}

export class DataRowUniquenessContainer extends React.PureComponent<DataRowUniquenessContainerProps> {
    getHelpTipForAdditionalField(): JSX.Element {
        const { studyProperties } = this.props;
        const ptidSingularTxt = studyProperties.SubjectNounPlural;
        const timepointTxt = getStudyTimepointLabel(studyProperties.TimepointType);

        return (
            <>
                <p>
                    If the dataset has more than one row per {ptidSingularTxt.toLowerCase()}/
                    {timepointTxt.toLowerCase()}, an additional key field must be provided.
                </p>
                <p>
                    There can be at most one row in the dataset for each combination of {ptidSingularTxt.toLowerCase()},
                    {timepointTxt.toLowerCase()} and key.
                </p>
                The dataset additional key field can be one of the following two types:
                <ul>
                    <li>Data Field: A user-managed key field.</li>
                    <li>
                        Managed Field: A numeric or string field that will be managed by the server to make each new
                        entry unique. Numbers will be assigned auto-incrementing integer values, strings will be
                        assigned globally unique identifiers (GUIDs).
                    </li>
                </ul>
            </>
        ) as JSX.Element;
    }

    getHelpTipElement(field: string): JSX.Element {
        return (<> {getHelpTip(field, this.props.studyProperties)} </>) as JSX.Element;
    }

    render() {
        const { model, onRadioChange, onCheckBoxChange, onSelectChange, keyPropertyIndex, studyProperties } = this.props;
        const domain = model.domain;
        const additionalKeyFields = getAdditionalKeyFields(domain, studyProperties.TimepointType);
        const dataRowSetting = model.getDataRowSetting();
        const showAdditionalKeyField = dataRowSetting === 2 || model.isFromLinkedSource();

        let keyPropertyName = model.keyPropertyName;
        if (model.useTimeKeyField) {
            keyPropertyName = TIME_KEY_FIELD_KEY;
        } else if (keyPropertyIndex !== undefined) {
            keyPropertyName = model.domain.fields.get(keyPropertyIndex).name;
        }

        const validKeyField = model.validManagedKeyField(keyPropertyName);

        const showAdditionalKeyFieldCls = showAdditionalKeyField
            ? 'dataset_data_row_element_show'
            : 'dataset_data_row_element_hide';
        const keyPropertyManagedCls =
            showAdditionalKeyField && validKeyField ? 'dataset_data_row_element_show' : 'dataset_data_row_element_hide';

        const managedKeyDisabled = !showAdditionalKeyField || !validKeyField || model.isFromLinkedSource();

        return (
            <>
                <SectionHeading title="Data Row Uniqueness" helpTipBody={this.getHelpTipElement('dataRowUniqueness')} />

                <DataRowUniquenessElements
                    onRadioChange={onRadioChange}
                    dataRowSetting={dataRowSetting}
                    isFromAssay={model.isFromLinkedSource()}
                    studyProperties={studyProperties}
                />

                <div className={showAdditionalKeyFieldCls}>
                    <DatasetSettingsSelect
                        name="keyPropertyName"
                        label="Additional Key Field"
                        selectOptions={additionalKeyFields.toArray()}
                        onSelectChange={onSelectChange}
                        selectedValue={keyPropertyName}
                        disabled={!showAdditionalKeyField || model.isFromLinkedSource()}
                        helpTip={this.getHelpTipForAdditionalField()}
                        clearable={false}
                    />
                </div>

                <div className={keyPropertyManagedCls}>
                    <DomainDesignerCheckbox
                        checked={model.keyPropertyManaged && !managedKeyDisabled}
                        onChange={onCheckBoxChange}
                        id="keyPropertyManaged"
                        disabled={managedKeyDisabled}
                    >
                        Let server manage fields to make entries unique
                    </DomainDesignerCheckbox>
                </div>
            </>
        );
    }
}
