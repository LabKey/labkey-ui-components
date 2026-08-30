/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { QueryColumn } from '../../../../public/QueryColumn';
import { FieldLabel } from '../FieldLabel';
import { INPUT_LABEL_CLASS_NAME, INPUT_WRAPPER_CLASS_NAME, MIXED_VALUE_DISPLAY } from '../constants';
import { FormsyInput, FormsyInputProps } from './FormsyReactComponents';
import { DisableableInputProps, useDisableableInput } from './DisableableInput';
import { InternalSpacesWarning } from '../InternalSpacesWarning';

export interface TextInputProps extends DisableableInputProps, Omit<FormsyInputProps, 'onChange'> {
    addLabelAsterisk?: boolean;
    includeSpacesWarning?: boolean;
    isUpdate?: boolean;
    onChange?: (name: string, value: any) => void;
    queryColumn: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    showLabel?: boolean;
    startFocused?: boolean;
}

export const TextInput: FC<TextInputProps> = props => {
    // Extract DisableableInputProps, TextInputProps
    const {
        addLabelAsterisk,
        allowDisable,
        disabled,
        elementWrapperClassName = INPUT_WRAPPER_CLASS_NAME,
        hasMixedValue,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        initiallyDisabled,
        label,
        labelClassName = INPUT_LABEL_CLASS_NAME,
        onChange,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onToggleDisable,
        renderFieldLabel,
        queryColumn,
        showLabel = true,
        startFocused = false,
        includeSpacesWarning,
        isUpdate,
        ...formsyInputProps
    } = props;
    const [didFocus, setDidFocus] = useState(false);
    const { inputValue, isDisabled, setInputValue, toggleDisabled } = useDisableableInput<string>(props);
    const textInputRef = useRef(null);
    const isDisabled_ = isDisabled || disabled;

    useEffect(() => {
        if (startFocused && !didFocus && queryColumn.name) {
            textInputRef.current?.focus();
            setDidFocus(true);
        }
    }, [didFocus, queryColumn, startFocused]);

    const label_ = useMemo(() => {
        if (renderFieldLabel) {
            return renderFieldLabel(queryColumn);
        }

        // This is here (at least for now) because of the use of the hide-label class below
        // in place of sending showLabel=false???
        if (showLabel === false) {
            return null;
        }

        return (
            <FieldLabel
                column={queryColumn}
                isDisabled={isDisabled}
                label={label}
                labelOverlayProps={{ isFormsy: true, addLabelAsterisk }}
                showLabel={showLabel}
                showToggle={allowDisable}
                toggleProps={{ onClick: toggleDisabled }}
            />
        );
    }, [renderFieldLabel, showLabel, queryColumn, isDisabled, label, addLabelAsterisk, allowDisable, toggleDisabled]);

    const onChange_ = useCallback(
        (name, value) => {
            setInputValue(value);
            onChange?.(name, value);
        },
        [onChange, setInputValue]
    );

    let help: string;
    // Issue 52367: Do not show the message if we have a name that can be edited
    if (queryColumn.nameExpression && !isUpdate) {
        help = `A ${queryColumn.caption} will be generated if one is not given.`;
    }

    return (
        <>
            <FormsyInput
                aria-label={showLabel ? undefined : queryColumn.caption}
                id={queryColumn.fieldKey}
                name={queryColumn.fieldKey}
                placeholder={
                    hasMixedValue && isDisabled_ ? MIXED_VALUE_DISPLAY : `Enter ${queryColumn.caption.toLowerCase()}`
                }
                required={queryColumn.required}
                {...formsyInputProps}
                componentRef={textInputRef}
                disabled={isDisabled_}
                elementWrapperClassName={elementWrapperClassName}
                help={help}
                label={label_}
                labelClassName={showLabel ? labelClassName : 'hide-label'}
                onChange={onChange_}
                value={inputValue}
            />
            {includeSpacesWarning && <InternalSpacesWarning value={inputValue} />}
        </>
    );
};
TextInput.displayName = 'TextInput';
