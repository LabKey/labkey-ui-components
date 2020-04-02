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
import { Form, Row, Col } from 'react-bootstrap';
import { Utils } from '@labkey/api';
import {DomainDesign, DomainPanelStatus} from "../models";
import { DataRowUniquenessContainer, BasicPropertiesFields } from "./DatasetPropertiesPanelFormElements";
import { AdvancedSettings } from "./DatasetPropertiesAdvancedSettings";
import {DatasetAdvancedSettingsForm, DatasetModel} from "./models";
import { InjectedDomainPropertiesPanelCollapseProps, withDomainPropertiesPanelCollapse } from "../DomainPropertiesPanelCollapse";
import { BasePropertiesPanel, BasePropertiesPanelProps } from "../BasePropertiesPanel";
import {COHORT_TIP, DATASET_ID_TIP, DATASPACE_TIP, TAG_TIP, VISIT_DATE_TIP} from "./constants";
import {ListModel} from "../../..";
import {AdvancedSettingsForm} from "../list/models";

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
}

export class DatasetPropertiesPanelImpl extends React.PureComponent<Props & InjectedDomainPropertiesPanelCollapseProps, State> {

    constructor(props: Props & InjectedDomainPropertiesPanelCollapseProps) {
        super(props);

        this.state = {
            isValid: true
        };
    }

    updateValidStatus = (newModel?: DatasetModel) => {
        const { model, onChange } = this.props;
        const updatedModel = newModel || model;

        const isValid = updatedModel && updatedModel.hasValidProperties();
        this.setState(() => ({isValid}),
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

    onCheckBoxChange = (name, checked): void => {
        this.onChange(name, !checked);
    };

    onInputChange = (evt: any) => {
        const id = evt.target.id;
        const value = evt.target.value;
        this.onChange(id, value);
    };

    onCategoryChange = (category) => {
        this.onChange('category', category.label);
    };

    onRadioChange = e => {
        const name = e.currentTarget.name;
        const value = e.target.value;

        this.setState(() => ({ [name]: value }));
    };

    applyAdvancedProperties = (advancedSettingsForm: DatasetAdvancedSettingsForm) => {
        const { model } = this.props;
        const newModel = model.merge(advancedSettingsForm) as ListModel;
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
                    <Col md={11}/>
                    <Col md={1}>
                        <AdvancedSettings
                            title={"Advanced Settings"}
                            model={model}
                            showDataspace={showDataspace}
                            applyAdvancedProperties={this.applyAdvancedProperties}
                        />
                    </Col>
                </Row>
                <Form>
                    <Col md={6}>
                        <BasicPropertiesFields
                            model={model}
                            onInputChange={this.onInputChange}
                            onCategoryChange={this.onCategoryChange}
                        />
                    </Col>

                    <Col md={6}>
                        <DataRowUniquenessContainer
                            model={model}
                            onRadioChange={this.onRadioChange}
                        />
                    </Col>
                </Form>
            </BasePropertiesPanel>
        )
    }
}

export const DatasetPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(DatasetPropertiesPanelImpl);
