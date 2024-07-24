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
import { produce } from 'immer';
import { List } from 'immutable';

import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';
import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';
import { HelpTopicURL } from '../HelpTopicURL';
import { DEFINE_DATASET_TOPIC } from '../../../util/helpLinks';

import { DomainDesign, DomainField } from '../models';

import { PHILEVEL_NOT_PHI } from '../constants';

import { DatasetAdvancedSettingsForm, DatasetModel } from './models';
import { AdvancedSettings } from './DatasetPropertiesAdvancedSettings';
import { BasicPropertiesFields, DataRowUniquenessContainer } from './DatasetPropertiesPanelFormElements';
import { TIME_KEY_FIELD_KEY } from './constants';
import { allowAsManagedField } from './utils';

interface OwnProps {
    keyPropertyIndex?: number;
    model: DatasetModel;
    onChange: (model: DatasetModel) => void;
    onIndexChange?: (keyPropertyIndex?: number, visitDatePropertyIndex?: number) => void;
    visitDatePropertyIndex?: number;
}

type Props = OwnProps & BasePropertiesPanelProps;

interface State {
    isValid?: boolean;
}

export class DatasetPropertiesPanelImpl extends React.PureComponent<
    Props & InjectedDomainPropertiesPanelCollapseProps,
    State
> {
    state: Readonly<State> = { isValid: true };

    updateValidStatus = (newModel?: DatasetModel): void => {
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

        const newModel = produce<DatasetModel>(model, draft => {
            draft[identifier] = value;
        });

        this.updateValidStatus(newModel);
    };

    onInputChange = (evt: any): void => {
        const id = evt.target.id;
        let value = evt.target.value;

        if (evt.target.type === 'checkbox') {
            value = evt.target.checked;
        }

        this.onChange(id, value);
    };

    onCategoryChange = (_, category): void => {
        const { model } = this.props;
        const newModel = produce<DatasetModel>(model, draft => {
            draft.category = category ?? undefined;
        });

        this.updateValidStatus(newModel);
    };

    onDataRowRadioChange = (e): void => {
        const { model, onIndexChange, visitDatePropertyIndex } = this.props;
        const value = e.target.value;

        // set all of the field's disablePhiLevel back to false, since there isn't a selected additional key anymore
        const updatedDomain = model.domain.merge({
            fields: this.getUpdatedFieldsWithoutDisablePhi(),
        }) as DomainDesign;

        const newModel = produce<DatasetModel>(model, draft => {
            draft.domain = updatedDomain;
            draft.useTimeKeyField = false;
            draft.keyPropertyManaged = false;
            draft.dataSharing = 'NONE';
            draft.demographicData = value == 0;
            draft.keyPropertyName = value != 2 ? undefined : ''; // resetting key property name
        });

        onIndexChange(undefined, visitDatePropertyIndex);
        this.updateValidStatus(newModel);
    };

    getUpdatedFieldsWithoutDisablePhi(): List<DomainField> {
        return this.props.model.domain.fields
            .map((field: DomainField) => {
                return field.set('disablePhiLevel', false) as DomainField;
            })
            .toList();
    }

    onAdditionalKeyFieldChange = (name, formValue, selected): void => {
        const { model, onIndexChange, visitDatePropertyIndex } = this.props;

        // first set all of the field's disablePhiLevel back to false
        const updatedFields = this.getUpdatedFieldsWithoutDisablePhi();

        let keyPropIndex;
        const updatedDomain = model.domain.merge({
            fields: updatedFields
                .map((field: DomainField, index) => {
                    if (field.name === formValue) {
                        keyPropIndex = index;

                        // for the selected field, set its PHI level back to none and disable it
                        return field.merge({
                            disablePhiLevel: true,
                            PHI: PHILEVEL_NOT_PHI,
                        });
                    }

                    return field;
                })
                .toList(),
        }) as DomainDesign;

        const newModel = produce<DatasetModel>(model, draft => {
            draft.domain = updatedDomain;
            draft.useTimeKeyField = formValue === TIME_KEY_FIELD_KEY;
            draft.keyPropertyName = formValue;

            // if we are switching to a field type that is not allowed to be managed, set keyPropertyManaged as false
            if (!allowAsManagedField(draft.domain.fields.get(keyPropIndex))) {
                draft.keyPropertyManaged = false;
            }
        });

        onIndexChange(keyPropIndex, visitDatePropertyIndex);
        this.updateValidStatus(newModel);
    };

    applyAdvancedProperties = (advancedSettingsForm: DatasetAdvancedSettingsForm): void => {
        const { model, onIndexChange, keyPropertyIndex } = this.props;

        let visitDatePropIndex;
        const newModel = produce<DatasetModel>(model, draft => {
            Object.assign(draft, model, advancedSettingsForm);
        });

        newModel.domain.fields.map((field, index) => {
            if (field.name === newModel.visitDatePropertyName) {
                visitDatePropIndex = index;
            }
        });

        onIndexChange(keyPropertyIndex, visitDatePropIndex);
        this.updateValidStatus(newModel);
    };

    render() {
        // Extract OwnProps
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { keyPropertyIndex, model, onChange, onIndexChange, visitDatePropertyIndex, ...baseProps } = this.props;

        return (
            <BasePropertiesPanel
                {...baseProps}
                headerId="dataset-header-id"
                isValid={this.state.isValid}
                title="Dataset Properties"
                titlePrefix={model.name}
                updateValidStatus={this.updateValidStatus}
            >
                <div className="row margin-bottom">
                    <div className="col-xs-12">
                        <HelpTopicURL helpTopic={DEFINE_DATASET_TOPIC} nounPlural="datasets" />
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-12 col-md-5">
                        <BasicPropertiesFields
                            model={model}
                            onInputChange={this.onInputChange}
                            onCategoryChange={this.onCategoryChange}
                        />
                    </div>

                    <div className="col-xs-12 col-md-5">
                        <DataRowUniquenessContainer
                            model={model}
                            onRadioChange={this.onDataRowRadioChange}
                            onCheckBoxChange={this.onInputChange}
                            onSelectChange={this.onAdditionalKeyFieldChange}
                            keyPropertyIndex={keyPropertyIndex}
                        />
                    </div>

                    <div className="col-xs-12 col-md-2">
                        <AdvancedSettings
                            title="Advanced Settings"
                            model={model}
                            applyAdvancedProperties={this.applyAdvancedProperties}
                            visitDatePropertyIndex={visitDatePropertyIndex}
                        />
                    </div>
                </div>
            </BasePropertiesPanel>
        );
    }
}

export const DatasetPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(DatasetPropertiesPanelImpl);
