/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
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