/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Input } from 'formsy-react-components'
import { QueryColumn } from '@glass/base'

import { FieldLabel } from '../FieldLabel'

export interface TextInputProps {
    allowDisable?: boolean
    initiallyDisabled?: boolean
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
}

interface TextInputState {
    didFocus?: boolean
    isDisabled: boolean
}

export class TextInput extends React.Component<TextInputProps, TextInputState> {
    static defaultProps : Partial<TextInputProps> = {
        changeDebounceInterval: 0,
        elementWrapperClassName: 'col-sm-9 col-xs-12',
        labelClassName: 'control-label text-left col-xs-12',
        showLabel: true,
        startFocused: false,
        allowDisable: false,
        initiallyDisabled: false
    };

    textInput: Input;

    constructor(props: TextInputProps) {
        super(props);

        this.toggleDisabled = this.toggleDisabled.bind(this);

        this.state = {
            didFocus: false,
            isDisabled: props.allowDisable && props.initiallyDisabled
        }
    }

    toggleDisabled() {
        this.setState(() => {
            return {
                isDisabled: !this.state.isDisabled
            }
        });
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
        const { label, queryColumn, showLabel, allowDisable } = this.props;
        const { isDisabled } = this.state;

        return <FieldLabel
            label={label}
            showLabel={showLabel}
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

