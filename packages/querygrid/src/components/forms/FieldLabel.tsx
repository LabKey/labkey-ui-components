/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { QueryColumn } from '@glass/base'
import { ToggleWithInputField, ToggleWithInputFieldProps } from './input/ToggleWithInputField';
import { getFieldEnabledFieldName } from './QueryFormInputs';
import { LabelOverlay, LabelOverlayProps } from './LabelOverlay';

interface FieldLabelProps  {
    id?: any  // required if column is not provided
    fieldName?: string // required if column is not provided
    label?: React.ReactNode
    column?: QueryColumn,
    showToggle?: boolean
    isDisabled?: boolean
    labelOverlayProps?: LabelOverlayProps
    showLabel?: boolean
    style?: any
    withLabelOverlay?: boolean,
    toggleProps?: Partial<ToggleWithInputFieldProps>
}

export class FieldLabel extends React.Component<FieldLabelProps, any> {

    static defaultProps : Partial<FieldLabelProps> = {
        showLabel: true,
        withLabelOverlay: true
    };


    render() {
        const {
            label,
            column,
            fieldName,
            id,
            showLabel,
            showToggle,
            isDisabled,
            style,
            toggleProps,
            withLabelOverlay } = this.props;
        let labelOverlayProps = this.props.labelOverlayProps;

        if (!showLabel)
            return null;


        // when not displaying with Formsy and we are displaying the field toggle, we adjust
        // the columns since the toggle appears outside the label.
        let toggleClassName;
        if (showToggle && labelOverlayProps && !labelOverlayProps.isFormsy && !labelOverlayProps.labelClass) {
            labelOverlayProps.labelClass = "control-label col-sm-2 col-xs-11 text-left";
            toggleClassName = "col-xs-1";
        }

        let labelBody;
        if (withLabelOverlay)
            labelBody = <LabelOverlay column={column} {...labelOverlayProps}/>;
        else
            labelBody = label ? label : (column ? column.caption : null);


        return (
            <>
                {labelBody}
                {showToggle && <ToggleWithInputField
                        active = {!isDisabled}
                        onClick = {toggleProps && toggleProps.onClick}
                        id = { id ? id : (column ? column.fieldKey : undefined)}
                        inputFieldName = {getFieldEnabledFieldName(fieldName ? fieldName : (column ? column.fieldKey : undefined))}
                        on = {toggleProps && toggleProps.on ? toggleProps.on : "Enabled"}
                        off = {toggleProps && toggleProps.off ? toggleProps.off : "Disabled"}
                        style = {style ? style : {float: "right"}}
                        containerClassName={toggleClassName}
                />}
            </>
        );
    }
}