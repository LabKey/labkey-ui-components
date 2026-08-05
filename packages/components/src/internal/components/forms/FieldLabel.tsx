/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode } from 'react';

import classNames from 'classnames';

import { QueryColumn } from '../../../public/QueryColumn';

import { ToggleIcon } from '../buttons/ToggleButtons';

import { getFieldEnabledFieldName } from './utils';
import { LabelOverlay, LabelOverlayProps } from './LabelOverlay';
import { INPUT_LABEL_CLASS_NAME_WITH_TOGGLE } from './constants';

export interface ToggleProps {
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
    toggleClassName?: string;
    toggleProps?: Partial<ToggleProps>;
    withLabelOverlay?: boolean;
}

export const FieldLabel: FC<FieldLabelProps> = memo(props => {
    const {
        column,
        fieldName,
        id,
        isDisabled,
        label,
        labelOverlayProps,
        showLabel = true,
        showToggle,
        toggleClassName,
        toggleProps,
        withLabelOverlay = true,
    } = props;

    if (showToggle && !column && (!id || !fieldName)) {
        throw new Error(
            'FieldLabel: when showing the toggle, either a column or an id and fieldName must be provided.'
        );
    }

    if (!showLabel) return null;

    // When not displaying with Formsy and we are displaying the field toggle, we adjust
    // the columns since the toggle appears outside the label. A label class supplied by the
    // caller always takes precedence.
    const adjustColumnsForToggle = !!(
        showToggle &&
        labelOverlayProps &&
        !labelOverlayProps.isFormsy &&
        !labelOverlayProps.labelClass
    );

    const labelClass = adjustColumnsForToggle ? INPUT_LABEL_CLASS_NAME_WITH_TOGGLE : labelOverlayProps?.labelClass;
    const toggleWrapperClassName = classNames(toggleClassName, 'control-label-toggle-input', {
        'control-label-toggle-input-size-fixed': adjustColumnsForToggle,
    });

    return (
        <>
            {withLabelOverlay && <LabelOverlay column={column} {...labelOverlayProps} labelClass={labelClass} />}
            {!withLabelOverlay && (label ? label : column ? column.caption : null)}
            {showToggle && (
                <span className={classNames({ 'col-xs-1': adjustColumnsForToggle })}>
                    <div className={toggleWrapperClassName}>
                        <ToggleIcon
                            active={!isDisabled ? 'on' : 'off'}
                            disabled={!toggleProps?.onClick}
                            id={(id ?? column?.fieldKey) + '::toggle'}
                            inputFieldName={getFieldEnabledFieldName(column, fieldName)}
                            onClick={toggleProps?.onClick}
                            toolTip={toggleProps?.toolTip}
                        />
                    </div>
                </span>
            )}
        </>
    );
});
FieldLabel.displayName = 'FieldLabel';
