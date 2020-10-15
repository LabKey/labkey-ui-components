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
import React from 'react';
import { Textarea } from 'formsy-react-components';

import { FieldLabel } from '../FieldLabel';

import { QueryColumn } from '../../../..';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';

interface TextAreaInputProps extends DisableableInputProps {
    cols?: number;
    elementWrapperClassName?: any[] | string;
    label?: any;
    labelClassName?: any[] | string;
    name?: string;
    queryColumn: QueryColumn;
    rowClassName?: any[] | string;
    rows?: number;
    showLabel?: boolean;
    allowDisable?: boolean;
    initiallyDisabled?: boolean;
    value?: any;
    addLabelAsterisk?: boolean;
    onChange?: any;
}

export class TextAreaInput extends DisableableInput<TextAreaInputProps, DisableableInputState> {
    static defaultProps = {
        ...DisableableInput.defaultProps,
        ...{
            cols: 50,
            elementWrapperClassName: 'col-md-9 col-xs-12',
            labelClassName: 'control-label text-left col-xs-12',
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
        const { label, queryColumn, showLabel, allowDisable, addLabelAsterisk } = this.props;
        const { isDisabled } = this.state;

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

    onChange = (name, value) => {
        const { onChange } = this.props;

        if (this.props.allowDisable) this.setState({ inputValue: value });

        if (onChange) onChange(value);
    };

    render() {
        const { cols, elementWrapperClassName, labelClassName, name, queryColumn, rowClassName, rows } = this.props;

        return (
            <Textarea
                changeDebounceInterval={0}
                disabled={this.state.isDisabled}
                onChange={this.onChange}
                cols={cols}
                elementWrapperClassName={elementWrapperClassName}
                id={queryColumn.name}
                label={this.renderLabel()}
                labelClassName={labelClassName}
                placeholder={`Enter ${queryColumn.caption.toLowerCase()}`}
                name={name ? name : queryColumn.name}
                rowClassName={rowClassName}
                rows={rows}
                required={queryColumn.required}
                value={this.getInputValue()}
            />
        );
    }
}
