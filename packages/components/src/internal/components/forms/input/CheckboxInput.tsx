/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ChangeEventHandler, FC, ReactNode, useEffect, useRef } from 'react';

import { FormsyInjectedProps, withFormsy } from '../formsy';
import { FieldLabel } from '../FieldLabel';

import { QueryColumn } from '../../../../public/QueryColumn';

import {
    INPUT_CONTAINER_CLASS_NAME,
    INPUT_LABEL_CLASS_NAME,
    INPUT_WRAPPER_CLASS_NAME,
    MIXED_VALUE_DISPLAY,
} from '../constants';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';
import { RequiredSymbol } from './RequiredSymbol';

interface CheckboxInputProps extends DisableableInputProps {
    addLabelAsterisk?: boolean;
    containerClassName?: string;
    formsy?: boolean;
    label?: any;
    labelClassName?: string;
    queryColumn: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    rowClassName?: any[] | string;
    showLabel?: boolean;
    value?: any;
    wrapperClassName?: string;
}

type CheckboxInputImplProps = CheckboxInputProps & FormsyInjectedProps<boolean>;

interface CheckboxInputState extends DisableableInputState {
    checked: boolean;
}

class CheckboxInputImpl extends DisableableInput<CheckboxInputImplProps, CheckboxInputState> {
    static defaultProps = {
        ...DisableableInput.defaultProps,
        containerClassName: INPUT_CONTAINER_CLASS_NAME,
        labelClassName: INPUT_LABEL_CLASS_NAME,
        showLabel: true,
        wrapperClassName: INPUT_WRAPPER_CLASS_NAME,
    };

    constructor(props: CheckboxInputImplProps) {
        super(props);

        this.state = {
            checked: props.value === true || props.value === 'true',
            isDisabled: props.initiallyDisabled,
        };
    }

    onChange: ChangeEventHandler<HTMLInputElement> = evt => {
        const checked = evt.target.checked;
        this.setState({ checked });
        if (this.props.formsy) {
            this.props.setValue?.(checked);
        }
    };

    toggleDisabled = (): void => {
        const { value } = this.props;

        this.setState(
            state => ({
                isDisabled: !state.isDisabled,
                checked: state.isDisabled ? state.checked : value === true || value === 'true',
            }),
            () => {
                this.props.onToggleDisable?.(this.state.isDisabled);
            }
        );
    };

    render() {
        const {
            addLabelAsterisk,
            allowDisable,
            containerClassName,
            formsy,
            label,
            labelClassName,
            queryColumn,
            showLabel,
            renderFieldLabel,
            value,
            wrapperClassName,
            hasMixedValue,
        } = this.props;
        const { checked, isDisabled } = this.state;

        // N.B.  We do not use the Checkbox component from Formsy because it does not support
        // React.Nodes as labels.  Using a label that is anything but a string when using Checkbox
        // produces a "Converting circular structure to JSON" error.
        // TODO: This label generation is inconsistent and does not align with other input elements.
        // This should not be responsible for rendering the RequiredSymbol and should allow for component prop
        // to define label wrapper classes.
        return (
            <div className={`${containerClassName} checkbox-input-form-row`}>
                {renderFieldLabel ? (
                    <label className={labelClassName} htmlFor={queryColumn.fieldKey}>
                        {renderFieldLabel(queryColumn)}
                        <RequiredSymbol required={queryColumn.required || addLabelAsterisk} />
                    </label>
                ) : (
                    <FieldLabel
                        column={queryColumn}
                        isDisabled={isDisabled}
                        label={label}
                        labelOverlayProps={{
                            isFormsy: false,
                            inputId: queryColumn.fieldKey,
                            required: queryColumn?.required,
                            addLabelAsterisk,
                        }}
                        showLabel={showLabel}
                        showToggle={allowDisable}
                        toggleProps={{
                            onClick: this.toggleDisabled,
                        }}
                    />
                )}
                <div className={wrapperClassName}>
                    {hasMixedValue && isDisabled ? (
                        <IndeterminateCheckbox
                            disabled={isDisabled}
                            queryColumn={queryColumn}
                            title={MIXED_VALUE_DISPLAY}
                        />
                    ) : (
                        <input
                            aria-label={label || undefined}
                            aria-labelledby={label ? undefined : queryColumn.labelId}
                            checked={checked}
                            disabled={isDisabled}
                            id={queryColumn.fieldKey}
                            name={queryColumn.fieldKey}
                            onChange={this.onChange}
                            // Issue 43299: Ignore "required" property for boolean columns as this will
                            // cause any false value (i.e. unchecked) to prevent submission.
                            // required={queryColumn.required}
                            type="checkbox"
                            value={formsy ? value : checked}
                        />
                    )}
                </div>
            </div>
        );
    }
}

/**
 * This class is a wrapper around ReactSelect to be able to bind formsy-react. It uses
 * the Formsy.Decorator to bind formsy-react so the element can be validated, submitted, etc.
 */
const CheckboxInputFormsy = withFormsy<CheckboxInputProps, boolean>(CheckboxInputImpl);

export const CheckboxInput: FC<CheckboxInputProps> = props => {
    const { formsy = true } = props;
    if (formsy) {
        return <CheckboxInputFormsy name={props.queryColumn.fieldKey} {...props} formsy />;
    }
    return <CheckboxInputImpl {...(props as CheckboxInputImplProps)} formsy={false} />;
};

CheckboxInput.displayName = 'CheckboxInput';

interface IndeterminateCheckboxProps extends CheckboxInputProps {
    disabled: boolean;
    title: string;
}

export const IndeterminateCheckbox: FC<IndeterminateCheckboxProps> = props => {
    const { queryColumn, ...rest } = props;
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (ref?.current)
            ref.current.indeterminate = true;
    }, [ref?.current]);

    return <input id={queryColumn.fieldKey} ref={ref} type="checkbox" {...rest} />;
};

IndeterminateCheckbox.displayName = 'IndeterminateCheckbox';
