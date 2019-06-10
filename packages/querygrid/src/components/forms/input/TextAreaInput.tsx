/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Textarea } from 'formsy-react-components'
import { QueryColumn } from '@glass/base'

import { QueryColumnFieldLabel } from '../LabelOverlay'


interface TextAreaInputProps {
    cols?: number
    elementWrapperClassName?: Array<any> | string
    label?: any
    labelClassName?: Array<any> | string
    name?: string
    queryColumn: QueryColumn
    rowClassName?: Array<any> | string
    rows?: number
    showLabel?: boolean
    allowDisable?: boolean
    value?: any
}

interface TextAreaInputState {
    isDisabled: boolean
}

export class TextAreaInput extends React.Component<TextAreaInputProps, TextAreaInputState> {

    static defaultProps : Partial<TextAreaInputProps> = {
        cols: 50,
        elementWrapperClassName: 'col-sm-9',
        labelClassName: 'control-label text-left',
        rows: 5,
        showLabel: true,
        allowDisable: true
    };

    constructor(props: TextAreaInputProps) {
        super(props);

        this.toggleDisabled = this.toggleDisabled.bind(this);

        this.state = {
            isDisabled: false
        }
    }

    toggleDisabled() {
        this.setState(() => {
            return {
                isDisabled: !this.state.isDisabled
            }
        });
    }

    renderLabel() {
        const { label, queryColumn, showLabel, allowDisable } = this.props;
        const { isDisabled } = this.state;

        return <QueryColumnFieldLabel
            label={label}
            showLabel={showLabel}
            allowDisable={allowDisable}
            column={queryColumn}
            isDisabled = {isDisabled}
            onClick = {this.toggleDisabled}/>
    }

    render() {
        const {
            cols,
            elementWrapperClassName,
            label,
            labelClassName,
            name,
            queryColumn,
            rowClassName,
            rows,
            showLabel,
            value
        } = this.props;



        return <Textarea
            changeDebounceInterval={0}
            disabled={this.state.isDisabled}
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
            value={value}/>;
    }

}