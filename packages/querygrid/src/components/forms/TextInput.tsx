/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Input } from 'formsy-react-components'
import { QueryColumn } from '@glass/base'

import { LabelOverlay } from './LabelOverlay'

export interface TextInputProps {
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
}

export class TextInput extends React.Component<TextInputProps, TextInputState> {
    static defaultProps = {
        changeDebounceInterval: 0,
        elementWrapperClassName: 'col-sm-9',
        labelClassName: 'control-label text-left',
        showLabel: true,
        startFocused: false
    };

    textInput: Input;

    constructor(props: TextInputProps) {
        super(props);
        this.state = {
            didFocus: false
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

    render() {
        const {
            changeDebounceInterval,
            elementWrapperClassName,
            label,
            labelClassName,
            name,
            onChange,
            placeholder,
            queryColumn,
            rowClassName,
            showLabel,
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
                changeDebounceInterval={changeDebounceInterval}
                elementWrapperClassName={elementWrapperClassName}
                id={queryColumn.name}
                label={showLabel ? (label ? label : <LabelOverlay column={queryColumn}/>) : null}
                labelClassName={labelClassName}
                name={name ? name : queryColumn.name}
                onChange={onChange}
                placeholder={placeholder}
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

