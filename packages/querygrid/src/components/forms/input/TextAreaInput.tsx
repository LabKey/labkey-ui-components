/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
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