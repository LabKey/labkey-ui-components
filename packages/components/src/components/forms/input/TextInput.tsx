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
import { Input } from 'formsy-react-components';

import { FieldLabel } from '../FieldLabel';
import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';
import { QueryColumn } from '../../base/models/model';

export interface TextInputProps extends DisableableInputProps {
    changeDebounceInterval?: number
    elementWrapperClassName?: Array<any> | string
    label?: any
    labelClassName?: Array<any> | string
    name?: string
    onChange?: any
    placeholder?: string
    queryColumn: QueryColumn
    rowClassName?: Array<any> | string
    showLabel?: boolean
    startFocused?: boolean
    validatePristine?: boolean
    value?: string
    addLabelAsterisk?: boolean
}

interface TextInputState extends DisableableInputState {
    didFocus?: boolean
}

export class TextInput extends DisableableInput<TextInputProps, TextInputState> {
    static defaultProps = {...DisableableInput.defaultProps, ...{
        changeDebounceInterval: 0,
        elementWrapperClassName: 'col-md-9 col-xs-12',
        labelClassName: 'control-label text-left col-xs-12',
        showLabel: true,
        startFocused: false,
    }};

    textInput: Input;

    constructor(props: TextInputProps) {
        super(props);

        this.toggleDisabled = this.toggleDisabled.bind(this);

        this.state = {
            didFocus: false,
            isDisabled: props.initiallyDisabled
        }
    }

    componentDidMount() {
        const { queryColumn, startFocused } = this.props;
        const { didFocus } = this.state;

        if (startFocused && !didFocus && queryColumn && queryColumn.name) {
            // https://github.com/twisty/formsy-react-components/blob/master/docs/refs.md
            this.textInput.element.focus();
            this.setState({didFocus: true});
        }
    }

    shouldComponentUpdate(nextProps: TextInputProps, nextState: TextInputState) {
        return this.state.didFocus === nextState.didFocus;
    }

    renderLabel() {
        const { label, queryColumn, showLabel, allowDisable, addLabelAsterisk } = this.props;
        const { isDisabled } = this.state;

        return <FieldLabel
            label={label}
            showLabel={showLabel}
            labelOverlayProps={{isFormsy: true, addLabelAsterisk: addLabelAsterisk}}
            showToggle={allowDisable}
            column={queryColumn}
            isDisabled = {isDisabled}
            toggleProps = {{
                onClick: this.toggleDisabled
            }}
        />
    }

    render() {
        const {
            changeDebounceInterval,
            elementWrapperClassName,
            labelClassName,
            name,
            onChange,
            placeholder,
            queryColumn,
            rowClassName,
            validatePristine,
            value
        } = this.props;

        let type = 'text',
            step,
            validations;

        if (queryColumn) {
            if (queryColumn.jsonType === 'int') {
                step = "1";
                type = 'number';
                validations = 'isInt';
            }
            else if (queryColumn.jsonType === 'float') {
                step = "any";
                type = 'number';
                validations = 'isFloat';
            }
        }

        return (
            <Input
                disabled={this.state.isDisabled}
                changeDebounceInterval={changeDebounceInterval}
                elementWrapperClassName={elementWrapperClassName}
                id={queryColumn.name}
                label={this.renderLabel()}
                labelClassName={labelClassName}
                name={name ? name : queryColumn.name}
                onChange={onChange}
                placeholder={placeholder || `Enter ${queryColumn.caption.toLowerCase()}`}
                required={queryColumn.required}
                rowClassName={rowClassName}
                step={step}
                type={type}
                validatePristine={validatePristine}
                validations={validations}
                value={value}
                componentRef={node => this.textInput = node}
            />
        );
    }

}

