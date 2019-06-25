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

import { LabelOverlay } from '../LabelOverlay'


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
    value?: any
}

export class TextAreaInput extends React.Component<TextAreaInputProps, any> {

    static defaultProps = {
        cols: 50,
        elementWrapperClassName: 'col-sm-9',
        labelClassName: 'control-label text-left',
        rows: 5,
        showLabel: true
    };

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
            cols={cols}
            elementWrapperClassName={elementWrapperClassName}
            id={queryColumn.name}
            label={showLabel ? (label ? label : <LabelOverlay column={queryColumn}/>) : null}
            labelClassName={labelClassName}
            name={name ? name : queryColumn.name}
            rowClassName={rowClassName}
            rows={rows}
            required={queryColumn.required}
            value={value}/>;
    }

}