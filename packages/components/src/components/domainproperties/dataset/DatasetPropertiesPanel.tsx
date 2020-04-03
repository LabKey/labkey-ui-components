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
import {Form, Row, Col} from 'react-bootstrap';
import {DataRowUniquenessContainer, BasicPropertiesFields} from "./DatasetPropertiesPanelFormElements";
import {AdvancedSettings} from "./DatasetPropertiesAdvancedSettings";
import {DatasetAdvancedSettingsForm, DatasetModel} from "./models";
import {InjectedDomainPropertiesPanelCollapseProps, withDomainPropertiesPanelCollapse} from "../DomainPropertiesPanelCollapse";
import {BasePropertiesPanel, BasePropertiesPanelProps} from "../BasePropertiesPanel";
import {HelpTopicURL} from "../HelpTopicURL";
import {DEFINE_DATASET_TOPIC} from "../../../util/helpLinks";

interface OwnProps {
    model: DatasetModel;
    onChange: (model: DatasetModel) => void;
    onToggle?: (collapsed: boolean, callback: () => any) => any;
    successBsStyle?: string;
    showDataspace: boolean;
}

type Props = OwnProps & BasePropertiesPanelProps;

interface State {
    isValid?: boolean;
    additionalKeyField?: number;
}

export class DatasetPropertiesPanelImpl extends React.PureComponent<Props & InjectedDomainPropertiesPanelCollapseProps, State> {

    constructor(props: Props & InjectedDomainPropertiesPanelCollapseProps) {
        super(props);

        this.state = {
            isValid: true,
            additionalKeyField: this.props.model.keyPropertyId // to store the keyField if present in edit case so that it can be retrieved if data row settings are changed
        };
    }

    updateValidStatus = (newModel?: DatasetModel) => {
        const { model, onChange } = this.props;
        const updatedModel = newModel || model;

        const isValid = updatedModel && updatedModel.hasValidProperties();
        this.setState(() => ({isValid: isValid, additionalKeyField: model.keyPropertyId}),
            () => {
                // Issue 39918: only consider the model changed if there is a newModel param
                if (newModel) {
                    onChange(updatedModel)
                }
            });
    };

    onChange = (identifier, value): void => {
        const { model } = this.props;

        const newModel = model.merge({
            [identifier]: value
        }) as DatasetModel;

        this.updateValidStatus(newModel);
    };

    onInputChange = (evt: any) => {
        const id = evt.target.id;
        let value = evt.target.value;

        if (evt.target.type === "checkbox") {
            value = evt.target.checked;
        }

        this.onChange(id, value);
    };

    onCategoryChange = (category) => {
        this.onChange('categoryId', category.value);
    };

    onDataRowRadioChange = e => {
        const { model } = this.props;

        const { additionalKeyField } = this.state;

        let value = e.target.value;
        let newModel;

        if (value == 0) {
            newModel = model.merge({
                keyPropertyId: undefined,
                isDemographicData: true
            }) as DatasetModel;
        }
        else if (value == 1) {
            newModel = model.merge({
                keyPropertyId: undefined,
                isDemographicData: false
            }) as DatasetModel;
        }
        else {
            newModel = model.merge({
                keyPropertyId: additionalKeyField,
                isDemographicData: false
            }) as DatasetModel;
        }
        this.updateValidStatus(newModel);
    };

    onAdditionalKeyFieldChange = (name, formValue, selected): void => {
        this.onChange(name, selected.propertyId);
    };


    applyAdvancedProperties = (advancedSettingsForm: DatasetAdvancedSettingsForm) => {
        const { model } = this.props;
        const newModel = model.merge(advancedSettingsForm) as DatasetModel;
        this.updateValidStatus(newModel);
    };


    render() {
        const {
            model,
            showDataspace,
        } = this.props;

        const {
            isValid
        } = this.state;

        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={'dataset-header-id'}
                title={'Dataset Properties'}
                titlePrefix={model.name}
                isValid={isValid}
                updateValidStatus={this.updateValidStatus}
            >
                <Row className={'margin-bottom'}>
                    <Col xs={12}>
                        <HelpTopicURL helpTopic={DEFINE_DATASET_TOPIC} nounPlural={'datasets'}/>
                    </Col>
                </Row>
                <Form>

                    <Col xs={12} md={5}>
                        <BasicPropertiesFields
                            model={model}
                            onInputChange={this.onInputChange}
                            onCategoryChange={this.onCategoryChange}
                        />
                    </Col>

                    <Col xs={12} md={5}>
                        <DataRowUniquenessContainer
                            model={model}
                            onRadioChange={this.onDataRowRadioChange}
                            onCheckBoxChange={this.onInputChange}
                            onSelectChange={this.onAdditionalKeyFieldChange}
                        />
                    </Col>

                    <AdvancedSettings
                        title={"Advanced Settings"}
                        model={model}
                        showDataspace={showDataspace}
                        applyAdvancedProperties={this.applyAdvancedProperties}
                    />

                </Form>
            </BasePropertiesPanel>
        )
    }
}

export const DatasetPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(DatasetPropertiesPanelImpl);
