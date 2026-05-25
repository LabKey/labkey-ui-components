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

import { INPUT_LABEL_CLASS_NAME, INPUT_WRAPPER_CLASS_NAME, MIXED_VALUE_DISPLAY } from '../constants';

import { FormsyInput, FormsyInputProps } from './FormsyReactComponents';
import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';
import { InternalSpacesWarning } from '../InternalSpacesWarning';

export interface TextInputProps extends DisableableInputProps, Omit<FormsyInputProps, 'onChange'> {
    addLabelAsterisk?: boolean;
    disableInput?: boolean;
    includeSpacesWarning?: boolean;
    isUpdate?: boolean;
    onChange?: (name: string, value: any) => void;
    queryColumn: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    showLabel?: boolean;
    startFocused?: boolean;
}

interface TextInputState extends DisableableInputState {
    didFocus?: boolean;
}

export class TextInput extends DisableableInput<TextInputProps, TextInputState> {
    static defaultProps = {
        ...DisableableInput.defaultProps,
        ...{
            elementWrapperClassName: INPUT_WRAPPER_CLASS_NAME,
            labelClassName: INPUT_LABEL_CLASS_NAME,
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
            inputValue: props.value,
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

        // FIXME: This is here (at least for now) because of the use of the hide-label class below
        // in place of sending showLabel=false???
        if (showLabel === false) {
            return null;
        }

        return (
            <FieldLabel
                column={queryColumn}
                isDisabled={isDisabled}
                label={label}
                labelOverlayProps={{ isFormsy: true, addLabelAsterisk }}
                showLabel={showLabel}
                showToggle={allowDisable}
                toggleProps={{
                    onClick: this.toggleDisabled,
                }}
            />
        );
    }

    onChange = (name: string, value: any): void => {
        this.setState({ inputValue: value });
        this.props.onChange?.(name, value);
    };

    render() {
        // Extract DisableableInputProps
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { allowDisable, initiallyDisabled, onToggleDisable, ...rest } = this.props;
        // Extract TextInputProps
        const {
            addLabelAsterisk,
            disableInput,
            labelClassName,
            renderFieldLabel,
            queryColumn,
            showLabel,
            startFocused,
            includeSpacesWarning,
            isUpdate,
            hasMixedValue,
            ...inputProps
        } = rest;

        let help: string;
        // Issue 52367: Don't show the message if we have a name that can be edited
        if (queryColumn.nameExpression && !isUpdate) {
            help = `A ${queryColumn.caption} will be generated if one is not given.`;
        }

        const isDisabled = this.state.isDisabled || disableInput;
        return (
            <>
                <FormsyInput
                    aria-label={showLabel ? undefined : queryColumn.caption}
                    id={queryColumn.fieldKey}
                    name={queryColumn.fieldKey}
                    placeholder={
                        hasMixedValue && isDisabled ? MIXED_VALUE_DISPLAY : `Enter ${queryColumn.caption.toLowerCase()}`
                    }
                    required={queryColumn.required}
                    {...inputProps}
                    componentRef={this.textInput}
                    disabled={isDisabled}
                    help={help}
                    label={this.renderLabel()}
                    labelClassName={showLabel ? labelClassName : 'hide-label'}
                    onChange={this.onChange}
                    type="text"
                    value={this.getInputValue()}
                />
                {includeSpacesWarning && <InternalSpacesWarning value={this.state.inputValue} />}
            </>
        );
    }
}
