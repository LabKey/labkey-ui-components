/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react';
import { datePlaceholder, QueryColumn } from '@glass/base'

import { TextInput, TextInputProps } from './TextInput'
import { DisableableInput, DisableableInputProps } from './DisableableInput';

interface DateInputProps extends DisableableInputProps {
    changeDebounceInterval?: number
    elementWrapperClassName?: Array<any> | string
    label?: any
    labelClassName?: Array<any> | string
    name?: string
    onChange?: any
    queryColumn: QueryColumn
    rowClassName?: Array<any> | string
    showLabel?: boolean
    validatePristine?: boolean
    value?: string
}

export class DateInput extends DisableableInput<DateInputProps, any> {

    static defaultProps = {
        allowDisable: false,
        initiallyDisabled: false,
        changeDebounceInterval: 0,
        elementWrapperClassName: 'col-md-9 col-xs-12',
        labelClassName: 'control-label text-left col-xs-12',
        showLabel: true,
        validatePristine: false
    };

    render() {
        const {
            allowDisable,
            initiallyDisabled,
            changeDebounceInterval,
            elementWrapperClassName,
            labelClassName,
            name,
            onChange,
            queryColumn,
            rowClassName,
            showLabel,
            validatePristine,
            value
        } = this.props;

        const props: TextInputProps = {
            allowDisable,
            initiallyDisabled,
            changeDebounceInterval,
            elementWrapperClassName,
            labelClassName,
            name: name ? name : queryColumn.name,
            onChange,
            placeholder: datePlaceholder(queryColumn),
            queryColumn,
            rowClassName,
            showLabel,
            validatePristine,
            value: value ? value : '' // to avoid uncontrolled -> controlled warnings
        };

        return <TextInput {...props}/>
    }
}
