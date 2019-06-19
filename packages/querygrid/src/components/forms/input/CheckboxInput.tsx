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
import { Checkbox } from 'formsy-react-components'
import { QueryColumn } from '@glass/base'

interface CheckboxInputProps {
    elementWrapperClassName?: Array<any> | string
    label?: any
    labelClassName?: Array<any> | string
    name?: string
    queryColumn: QueryColumn
    rowClassName?: Array<any> | string
    showLabel?: boolean
    value?: any
}

export class CheckboxInput extends React.Component<CheckboxInputProps, any> {

    static defaultProps = {
        elementWrapperClassName: 'col-sm-9',
        labelClassName: 'control-label text-left',
        showLabel: true
    };

    render() {
        const {
            elementWrapperClassName,
            label,
            labelClassName,
            name,
            queryColumn,
            rowClassName,
            showLabel,
            value
        } = this.props;

        return (
            <Checkbox
                elementWrapperClassName={elementWrapperClassName}
                label={showLabel ? (label ? label : queryColumn.caption) : null}
                labelClassName={labelClassName}
                name={name ? name : queryColumn.name}
                required={queryColumn.required}
                rowClassName={rowClassName}
                // rowLabel has been disabled due to construction warnings -- doesn't seem to do anything
                // rowLabel={queryColumn.caption}
                value={value === true}/>
        );
    }
}