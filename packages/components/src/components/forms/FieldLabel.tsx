/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { QueryColumn } from '../base/models/model';

import { ToggleWithInputField, ToggleWithInputFieldProps } from './input/ToggleWithInputField';
import { getFieldEnabledFieldName } from './QueryFormInputs';
import { LabelOverlay, LabelOverlayProps } from './LabelOverlay';

interface FieldLabelProps {
    id?: any; // required if column is not provided and showToggle is true
    fieldName?: string; // required if column is not provided and showToggle is true
    label?: React.ReactNode;
    column?: QueryColumn;
    showToggle?: boolean;
    isDisabled?: boolean;
    labelOverlayProps?: LabelOverlayProps;
    showLabel?: boolean;
    style?: any;
    withLabelOverlay?: boolean;
    toggleProps?: Partial<ToggleWithInputFieldProps>;
}

export class FieldLabel extends React.Component<FieldLabelProps, any> {
    static defaultProps: Partial<FieldLabelProps> = {
        showLabel: true,
        withLabelOverlay: true,
    };

    constructor(props: FieldLabelProps) {
        super(props);

        if (props.showToggle && !props.column && (!props.id || !props.fieldName)) {
            throw new Error(
                'FieldLabel: when showing the toggle, either a column or an id and fieldName must be provided.'
            );
        }
    }

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
            withLabelOverlay,
        } = this.props;
        const labelOverlayProps = this.props.labelOverlayProps;

        if (!showLabel) return null;

        // when not displaying with Formsy and we are displaying the field toggle, we adjust
        // the columns since the toggle appears outside the label.
        let toggleClassName;
        if (showToggle && labelOverlayProps && !labelOverlayProps.isFormsy && !labelOverlayProps.labelClass) {
            labelOverlayProps.labelClass = 'control-label col-sm-2 col-xs-11 text-left';
            toggleClassName = 'col-xs-1';
        }

        let labelBody;
        if (withLabelOverlay) {
            labelBody = <LabelOverlay column={column} {...labelOverlayProps} />;
        } else {
            labelBody = label ? label : column ? column.caption : null;
        }

        return (
            <>
                {labelBody}
                {showToggle && (
                    <ToggleWithInputField
                        active={!isDisabled}
                        onClick={toggleProps && toggleProps.onClick}
                        id={id ? id : column ? column.fieldKey : undefined}
                        inputFieldName={getFieldEnabledFieldName(column, fieldName)}
                        on={toggleProps && toggleProps.on ? toggleProps.on : 'Enabled'}
                        off={toggleProps && toggleProps.off ? toggleProps.off : 'Disabled'}
                        style={style ? style : { float: 'right' }}
                        containerClassName={toggleClassName}
                    />
                )}
            </>
        );
    }
}
