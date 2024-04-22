/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { Component, CSSProperties, ReactNode } from 'react';

import classNames from 'classnames';

import { QueryColumn } from '../../../public/QueryColumn';

import { ToggleIcon } from '../buttons/ToggleButtons';

import { getFieldEnabledFieldName } from './utils';
import { LabelOverlay, LabelOverlayProps } from './LabelOverlay';

interface ToggleProps {
    onClick: () => void;
    toolTip?: string;
}

export interface FieldLabelProps {
    column?: QueryColumn;
    fieldName?: string; // required if column is not provided and showToggle is true
    id?: any; // required if column is not provided and showToggle is true
    isDisabled?: boolean;
    label?: ReactNode;
    labelOverlayProps?: LabelOverlayProps;
    showLabel?: boolean;
    showToggle?: boolean;
    style?: CSSProperties;
    toggleClassName?: string;
    toggleProps?: Partial<ToggleProps>;
    withLabelOverlay?: boolean;
}

export class FieldLabel extends Component<FieldLabelProps> {
    static defaultProps = {
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
            labelOverlayProps,
            showLabel,
            showToggle,
            isDisabled,
            toggleProps,
            withLabelOverlay,
            toggleClassName,
        } = this.props;

        if (!showLabel) return null;

        // when not displaying with Formsy and we are displaying the field toggle, we adjust
        // the columns since the toggle appears outside the label.
        let toggleContainerClassName,
            toggleWrapperClassName = 'control-label-toggle-input';
        if (showToggle && labelOverlayProps && !labelOverlayProps.isFormsy && !labelOverlayProps.labelClass) {
            labelOverlayProps.labelClass = 'control-label col-sm-2 col-xs-11 text-left';
            toggleContainerClassName = 'col-xs-1';
            toggleWrapperClassName += ' control-label-toggle-input-size-fixed';
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
                    <span className={classNames(toggleContainerClassName)}>
                        <div className={classNames(toggleClassName, toggleWrapperClassName)}>
                            <ToggleIcon
                                id={id ?? column?.fieldKey}
                                inputFieldName={getFieldEnabledFieldName(column, fieldName)}
                                active={!isDisabled ? 'on' : 'off'}
                                onClick={toggleProps?.onClick}
                                disabled={!toggleProps?.onClick}
                                toolTip={toggleProps?.toolTip}
                            />
                        </div>
                    </span>
                )}
            </>
        );
    }
}
