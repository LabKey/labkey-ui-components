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

import produce, { Draft } from 'immer';

import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';
import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';
import { HelpTopicURL } from '../HelpTopicURL';
import { DEFINE_DATASET_TOPIC } from '../../../util/helpLinks';

import { DomainDesign } from '../models';

import { DatasetAdvancedSettingsForm, DatasetModel } from './models';
import { AdvancedSettings } from './DatasetPropertiesAdvancedSettings';
import { BasicPropertiesFields, DataRowUniquenessContainer } from './DatasetPropertiesPanelFormElements';
import { TIME_KEY_FIELD_KEY } from './constants';
import { allowAsManagedField } from './actions';

interface OwnProps {
    model: DatasetModel;
    onChange: (model: DatasetModel) => void;
    successBsStyle?: string;
}

type Props = OwnProps & BasePropertiesPanelProps;

interface State {
    isValid?: boolean;
    keyPropertyIndex?: number;
}

export class DatasetPropertiesPanelImpl extends React.PureComponent<
    Props & InjectedDomainPropertiesPanelCollapseProps,
    State
> {
    constructor(props: Props & InjectedDomainPropertiesPanelCollapseProps) {
        super(props);

        this.state = {
            isValid: true,
        };
    }

    updateValidStatus = (newModel?: DatasetModel) => {
        const { model, onChange } = this.props;
        const updatedModel = newModel || model;

        const isValid = updatedModel && updatedModel.hasValidProperties();
        this.setState(
            () => ({ isValid }),
            () => {
                // Issue 39918: only consider the model changed if there is a newModel param
                if (newModel) {
                    onChange(updatedModel);
                }
            }
        );
    };

    onChange = (identifier, value): void => {
        const { model } = this.props;

        const newModel = produce(model, (draft: Draft<DatasetModel>) => {
            draft[identifier] = value;
        });

        this.updateValidStatus(newModel);
    };

    onInputChange = (evt: any) => {
        const id = evt.target.id;
        let value = evt.target.value;

        if (evt.target.type === 'checkbox') {
            value = evt.target.checked;
        }

        this.onChange(id, value);
    };

    onCategoryChange = category => {
        const { model } = this.props;
        const newModel = produce(model, (draft: Draft<DatasetModel>) => {
            if (category && category.value) {
                draft.category = category.value;
            } else {
                draft.category = undefined;
            }
        });

        this.updateValidStatus(newModel);
    };

    onDataRowRadioChange = e => {
        const { model } = this.props;

        const value = e.target.value;
        const newModel = produce(model, (draft: Draft<DatasetModel>) => {
            if (value == 0) {
                draft.keyPropertyName = undefined;
                draft.demographicData = true;
                draft.keyPropertyManaged = false;
            } else if (value == 1) {
                draft.keyPropertyName = undefined;
                draft.demographicData = false;
                draft.keyPropertyManaged = false;
                draft.dataSharing = 'NONE';
            } else {
                draft.keyPropertyName = ''; // resetting key property name
                draft.demographicData = false;
                draft.keyPropertyManaged = false;
                draft.dataSharing = 'NONE';
            }
        });
        this.updateValidStatus(newModel);
    };

    onAdditionalKeyFieldChange = (name, formValue, selected): void => {
        const { model } = this.props;

        let keyPropIndex;
        const updatedDomain = model.domain.merge({
            fields: model.domain.fields
                .map((field, index) => {
                    if (field.name === formValue) {
                        keyPropIndex = index;
                        return field.set('disablePhiLevel', true);
                    } else {
                        return field.set('disablePhiLevel', false);
                    }
                })
                .toList(),
        }) as DomainDesign;

        const newModel = produce(model, (draft: Draft<DatasetModel>) => {
            draft.useTimeKeyField = formValue === TIME_KEY_FIELD_KEY;
            draft.domain = updatedDomain;
            draft[name] = formValue;

            // if we are switching to a field type that is not allowed to be managed, set keyPropertyManaged as false
            if (!allowAsManagedField(draft.domain.fields.get(keyPropIndex))) {
                draft.keyPropertyManaged = false;
            }
        });

        this.setState(
            () => ({ keyPropertyIndex: keyPropIndex }),
            () => this.updateValidStatus(newModel)
        );
    };

    applyAdvancedProperties = (advancedSettingsForm: DatasetAdvancedSettingsForm) => {
        const { model } = this.props;

        this.updateValidStatus(
            produce(model, (draft: Draft<DatasetModel>) => {
                draft.cohortId = advancedSettingsForm.cohortId;
                draft.visitDatePropertyName = advancedSettingsForm.visitDatePropertyName;
                draft.datasetId = advancedSettingsForm.datasetId;
                draft.showByDefault = advancedSettingsForm.showByDefault;
                draft.tag = advancedSettingsForm.tag;
            })
        );
    };

    render() {
        const { model } = this.props;

        const { isValid, keyPropertyIndex } = this.state;

        return (
            <BasePropertiesPanel
                {...this.props}
                headerId="dataset-header-id"
                title="Dataset Properties"
                titlePrefix={model.name}
                isValid={isValid}
                updateValidStatus={this.updateValidStatus}
            >
                <Row className="margin-bottom">
                    <Col xs={12}>
                        <HelpTopicURL helpTopic={DEFINE_DATASET_TOPIC} nounPlural="datasets" />
                    </Col>
                </Row>
                <Row>
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
                            keyPropertyIndex={keyPropertyIndex}
                        />
                    </Col>

                    <Col xs={12} md={2}>
                        <AdvancedSettings
                            title="Advanced Settings"
                            model={model}
                            applyAdvancedProperties={this.applyAdvancedProperties}
                        />
                    </Col>
                </Row>
            </BasePropertiesPanel>
        );
    }
}

export const DatasetPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(DatasetPropertiesPanelImpl);
