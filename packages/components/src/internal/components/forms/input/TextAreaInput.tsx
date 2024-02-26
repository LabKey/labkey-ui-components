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

import { FieldLabel } from '../FieldLabel';

import { QueryColumn } from '../../../../public/QueryColumn';

import { INPUT_LABEL_CLASS_NAME, INPUT_WRAPPER_CLASS_NAME } from '../constants';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';
import { FormsyTextArea, FormsyTextAreaProps } from './FormsyReactComponents';

interface TextAreaInputProps extends DisableableInputProps, Omit<FormsyTextAreaProps, 'onChange'> {
    addLabelAsterisk?: boolean;
    onChange?: (value: any) => void;
    queryColumn: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    showLabel?: boolean;
}

export class TextAreaInput extends DisableableInput<TextAreaInputProps, DisableableInputState> {
    static defaultProps = {
        ...DisableableInput.defaultProps,
        ...{
            cols: 50,
            elementWrapperClassName: INPUT_WRAPPER_CLASS_NAME,
            labelClassName: `${INPUT_LABEL_CLASS_NAME} textarea-control-label`,
            rows: 5,
            showLabel: true,
        },
    };

    constructor(props: TextAreaInputProps) {
        super(props);

        this.toggleDisabled = this.toggleDisabled.bind(this);

        this.state = {
            isDisabled: props.initiallyDisabled,
        };
    }

    renderLabel() {
        const { label, queryColumn, showLabel, allowDisable, addLabelAsterisk, renderFieldLabel } = this.props;
        const { isDisabled } = this.state;

        if (renderFieldLabel) {
            return renderFieldLabel(queryColumn);
        }

        return (
            <FieldLabel
                label={label}
                showLabel={showLabel}
                labelOverlayProps={{ isFormsy: true, addLabelAsterisk }}
                showToggle={allowDisable}
                column={queryColumn}
                isDisabled={isDisabled}
                toggleProps={{
                    onClick: this.toggleDisabled,
                }}
            />
        );
    }

    onChange = (name, value): void => {
        if (this.props.allowDisable) {
            this.setState({ inputValue: value });
        }

        this.props.onChange?.(value);
    };

    render() {
        // Extract DisableableInputProps
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { allowDisable, initiallyDisabled, onToggleDisable, ...rest } = this.props;
        // Extract TextAreaInputProps
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { addLabelAsterisk, onChange, queryColumn, renderFieldLabel, showLabel, ...textAreaProps } = rest;
        const { labelClassName } = textAreaProps;

        return (
            <FormsyTextArea
                id={queryColumn.fieldKey}
                name={queryColumn.fieldKey}
                placeholder={`Enter ${queryColumn.caption.toLowerCase()}`}
                required={queryColumn.required}
                {...textAreaProps}
                disabled={this.state.isDisabled}
                onChange={this.onChange}
                label={this.renderLabel()}
                labelClassName={showLabel ? labelClassName : 'hide-label'}
                value={this.getInputValue()}
            />
        );
    }
}
