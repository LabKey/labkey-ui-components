/*
 * Copyright (c) 2019 LabKey Corporation
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
import { withFormsy } from 'formsy-react';
import { Utils } from '@labkey/api';

import { FieldLabel } from '../FieldLabel';

import { QueryColumn } from '../../../..';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';

interface CheckboxInputProps extends DisableableInputProps {
    formsy?: boolean;
    label?: any;
    name?: string;
    queryColumn: QueryColumn;
    rowClassName?: any[] | string;
    showLabel?: boolean;
    value?: any;
    addLabelAsterisk?: boolean;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;

    // from formsy-react
    getErrorMessage?: Function;
    getValue?: Function;
    setValue?: Function;
    showRequired?: Function;
    validations?: any;
}

interface CheckboxInputState extends DisableableInputState {
    checked: boolean;
}

class CheckboxInputImpl extends DisableableInput<CheckboxInputProps, CheckboxInputState> {
    static defaultProps = { ...DisableableInput.defaultProps, showLabel: true };

    constructor(props: CheckboxInputProps) {
        super(props);

        this.state = {
            checked: props.value === true || props.value === 'true',
            isDisabled: props.initiallyDisabled,
        };
    }

    onChange = e => {
        const checked = e.target.checked;
        this.setState(() => {
            return {
                checked,
            };
        });
        if (this.props.formsy && Utils.isFunction(this.props.setValue)) this.props.setValue(checked);
    };

    toggleDisabled = () => {
        const { value } = this.props;
        const { checked } = this.state;

        this.setState(
            state => {
                return {
                    isDisabled: !state.isDisabled,
                    checked: state.isDisabled ? checked : value === true || value === 'true',
                };
            },
            () => {
                if (this.props.onToggleDisable) {
                    this.props.onToggleDisable(this.state.isDisabled);
                }
            }
        );
    };

    render() {
        const { allowDisable, label, name, queryColumn, showLabel, addLabelAsterisk, renderFieldLabel } = this.props;
        const { isDisabled } = this.state;

        // N.B.  We do not use the Checkbox component from Formsy because it does not support
        // React.Nodes as labels.  Using a label that is anything but a string when using Checkbox
        // produces a "Converting circular structure to JSON" error.
        return (
            <div className="form-group row">
                {renderFieldLabel
                    ? <label className="control-label col-sm-3 text-left col-xs-12">
                        {renderFieldLabel(queryColumn)}
                    </label>
                    : <FieldLabel
                        label={label}
                        labelOverlayProps={{
                            isFormsy: false,
                            inputId: queryColumn.name,
                            addLabelAsterisk,
                        }}
                        showLabel={showLabel}
                        showToggle={allowDisable}
                        column={queryColumn}
                        isDisabled={isDisabled}
                        toggleProps={{
                            onClick: this.toggleDisabled,
                        }}
                    />
                }
                <div className="col-sm-9 col-xs-12">
                    <input
                        disabled={this.state.isDisabled}
                        name={name ? name : queryColumn.name}
                        required={queryColumn.required}
                        type="checkbox"
                        value={this.props.formsy ? this.props.getValue() : this.state.checked}
                        checked={this.state.checked}
                        onChange={this.onChange}
                    />
                </div>
            </div>
        );
    }
}

/**
 * This class is a wrapper around ReactSelect to be able to bind formsy-react. It uses
 * the Formsy.Decorator to bind formsy-react so the element can be validated, submitted, etc.
 */
const CheckboxInputFormsy = withFormsy(CheckboxInputImpl);

export class CheckboxInput extends React.Component<CheckboxInputProps, any> {
    static defaultProps = {
        formsy: true,
    };

    constructor(props: CheckboxInputProps) {
        super(props);
    }

    render() {
        if (this.props.formsy) {
            return (
                <CheckboxInputFormsy
                    name={this.props.name ? this.props.name : this.props.queryColumn.name}
                    {...this.props}
                />
            );
        }
        return <CheckboxInputImpl {...this.props} />;
    }
}
