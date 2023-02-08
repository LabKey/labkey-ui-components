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
import { Textarea as OldTextarea } from 'formsy-react-components';

import { FieldLabel } from '../FieldLabel';

import { QueryColumn } from '../../../../public/QueryColumn';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';
import { Textarea, TextareaProps } from './FormsyReactComponents';

interface TextAreaInputProps extends DisableableInputProps, Omit<TextareaProps, 'onChange'> {
    addLabelAsterisk?: boolean;
    onChange?: (value: any) => void;
    queryColumn: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    showLabel?: boolean;
    validatePristine?: boolean;
}

export class TextAreaInput extends DisableableInput<TextAreaInputProps, DisableableInputState> {
    static defaultProps = {
        ...DisableableInput.defaultProps,
        ...{
            cols: 50,
            elementWrapperClassName: 'col-md-9 col-xs-12',
            labelClassName: 'control-label textarea-control-label text-left col-xs-12',
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
        const {
            cols,
            elementWrapperClassName,
            labelClassName,
            name,
            queryColumn,
            required,
            rowClassName,
            rows,
            showLabel,
            validatePristine,
        } = this.props;

        return (
            <>
                <OldTextarea
                    disabled={this.state.isDisabled}
                    onChange={this.onChange}
                    cols={cols}
                    elementWrapperClassName={elementWrapperClassName}
                    id={queryColumn.fieldKey}
                    label={this.renderLabel()}
                    labelClassName={showLabel ? labelClassName : 'hide-label'}
                    placeholder={`Enter ${queryColumn.caption.toLowerCase()}`}
                    name={name ?? queryColumn.fieldKey}
                    rowClassName={rowClassName}
                    rows={rows}
                    required
                    // required={required ?? queryColumn.required}
                    validatePristine={validatePristine}
                    value={this.getInputValue()}
                />
                <Textarea
                    disabled={this.state.isDisabled}
                    onChange={this.onChange}
                    cols={cols}
                    elementWrapperClassName={elementWrapperClassName}
                    id={queryColumn.fieldKey}
                    label={this.renderLabel()}
                    labelClassName={showLabel ? labelClassName : 'hide-label'}
                    placeholder={`Enter ${queryColumn.caption.toLowerCase()}`}
                    name={name ?? queryColumn.fieldKey}
                    rowClassName={rowClassName}
                    rows={rows}
                    required
                    // required={required ?? queryColumn.required}
                    validatePristine={validatePristine}
                    value={this.getInputValue()}
                />
            </>
        );
    }
}
