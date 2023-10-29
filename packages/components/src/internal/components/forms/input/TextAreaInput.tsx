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

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';
import { TextArea, TextAreaProps } from './FormsyReactComponents';

interface TextAreaInputProps extends DisableableInputProps, Omit<TextAreaProps, 'onChange'> {
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            addLabelAsterisk,
            labelClassName,
            name,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            onChange,
            queryColumn,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            renderFieldLabel,
            required,
            showLabel,
            ...textAreaProps
        } = this.props;

        return (
            <TextArea
                id={queryColumn.fieldKey}
                placeholder={`Enter ${queryColumn.caption.toLowerCase()}`}
                {...textAreaProps}
                disabled={this.state.isDisabled}
                onChange={this.onChange}
                label={this.renderLabel()}
                labelClassName={showLabel ? labelClassName : 'hide-label'}
                name={name ?? queryColumn.fieldKey}
                required={required ?? queryColumn.required}
                value={this.getInputValue()}
            />
        );
    }
}
