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
import * as React from 'react'
import { Textarea } from 'formsy-react-components'
import { QueryColumn } from '@glass/base'

import { FieldLabel } from '../FieldLabel'
import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';


interface TextAreaInputProps extends DisableableInputProps {
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
    initiallyDisabled?: boolean
    value?: any
    addLabelAsterisk?: boolean
}


export class TextAreaInput extends DisableableInput<TextAreaInputProps, DisableableInputState> {

    static defaultProps = {...DisableableInput.defaultProps, ...{
        cols: 50,
        elementWrapperClassName: 'col-md-9 col-xs-12',
        labelClassName: 'control-label text-left col-xs-12',
        rows: 5,
        showLabel: true,
    }};

    constructor(props: TextAreaInputProps) {
        super(props);

        this.toggleDisabled = this.toggleDisabled.bind(this);

        this.state = {
            isDisabled: props.initiallyDisabled
        }
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