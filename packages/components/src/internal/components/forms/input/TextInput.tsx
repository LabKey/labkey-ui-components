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
import React, { ReactNode, RefObject } from 'react';

import { FieldLabel } from '../FieldLabel';

import { QueryColumn } from '../../../../public/QueryColumn';

import { Input } from './FormsyReactComponents';
import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';

export interface TextInputProps extends DisableableInputProps {
    addLabelAsterisk?: boolean;
    addonAfter?: ReactNode;
    elementWrapperClassName?: string;
    label?: any;
    labelClassName?: string;
    name?: string;
    onChange?: any;
    placeholder?: string;
    queryColumn: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    required?: boolean;
    rowClassName?: string;
    showLabel?: boolean;
    startFocused?: boolean;
    validatePristine?: boolean;
    validationError?: string;
    validations?: string;
    value?: any;
}

interface TextInputState extends DisableableInputState {
    didFocus?: boolean;
}

export class TextInput extends DisableableInput<TextInputProps, TextInputState> {
    static defaultProps = {
        ...DisableableInput.defaultProps,
        ...{
            elementWrapperClassName: 'col-md-9 col-xs-12',
            labelClassName: 'control-label text-left col-xs-12',
            showLabel: true,
            startFocused: false,
        },
    };

    textInput: RefObject<any>;

    constructor(props: TextInputProps) {
        super(props);

        this.toggleDisabled = this.toggleDisabled.bind(this);

        this.state = {
            didFocus: false,
            isDisabled: props.initiallyDisabled,
        };

        this.textInput = React.createRef();
    }

    componentDidMount(): void {
        const { queryColumn, startFocused } = this.props;
        const { didFocus } = this.state;

        if (startFocused && !didFocus && queryColumn && queryColumn.name) {
            this.textInput.current?.focus();
            this.setState({ didFocus: true });
        }
    }

    shouldComponentUpdate(nextProps: TextInputProps, nextState: TextInputState): boolean {
        return this.state.didFocus === nextState.didFocus;
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

    onChange = (name: string, value: any): void => {
        if (this.props.allowDisable) {
            this.setState({ inputValue: value });
        }

        this.props.onChange?.(value);
    };

    render() {
        const {
            addonAfter,
            elementWrapperClassName,
            labelClassName,
            name,
            placeholder,
            queryColumn,
            required,
            rowClassName,
            showLabel,
            validatePristine,
            validationError,
        } = this.props;
        let { validations } = this.props;

        let type = 'text';
        let step: string;

        if (queryColumn && !validations) {
            if (queryColumn.jsonType === 'int') {
                step = '1';
                type = 'number';
                validations = 'isInt';
            } else if (queryColumn.jsonType === 'float') {
                step = 'any';
                type = 'number';
                validations = 'isFloat';
            }
        }

        let help: string;
        if (queryColumn.nameExpression) {
            help = `A ${queryColumn.caption} will be generated if one is not given.`;
        }

        return (
            <Input
                addonAfter={addonAfter}
                disabled={this.state.isDisabled}
                elementWrapperClassName={elementWrapperClassName}
                help={help}
                id={queryColumn.fieldKey}
                label={this.renderLabel()}
                labelClassName={showLabel ? labelClassName : 'hide-label'}
                name={name ?? queryColumn.fieldKey}
                onChange={this.onChange}
                placeholder={placeholder ?? `Enter ${queryColumn.caption.toLowerCase()}`}
                required={required ?? queryColumn.required}
                rowClassName={rowClassName}
                step={step}
                type={type}
                validatePristine={validatePristine}
                validationError={validationError}
                validations={validations}
                value={this.getInputValue()}
                componentRef={this.textInput}
            />
        );
    }
}
