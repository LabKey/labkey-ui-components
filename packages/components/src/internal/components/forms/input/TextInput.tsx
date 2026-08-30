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
import { stringToHtmlId } from '../../../util/utils';

export interface TextInputProps extends DisableableInputProps, Omit<FormsyInputProps, 'name' | 'onChange'> {
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
        id,
        includeSpacesWarning,
        isUpdate,
        ...formsyInputProps
    } = props;
    const [didFocus, setDidFocus] = useState(false);
    const { inputValue, isDisabled, localValue, setInputValue, toggleDisabled } = useDisableableInput<string>(props);
    const textInputRef = useRef(null);
    const isDisabled_ = isDisabled || disabled;

    useEffect(() => {
        if (startFocused && !didFocus && queryColumn.name) {
            textInputRef.current?.focus();
            setDidFocus(true);
        }
    }, [didFocus, queryColumn, startFocused]);

    const id_ = useMemo(() => id ?? stringToHtmlId(queryColumn.fieldKey), [id, queryColumn]);

    const label_ = useMemo(() => {
        if (renderFieldLabel) {
            return renderFieldLabel(queryColumn);
        }

        // Control emits a <label> unless this is null, so FieldLabel's showLabel guard is too late
        if (showLabel === false) {
            return null;
        }

        return (
            <FieldLabel
                column={queryColumn}
                isDisabled={isDisabled}
                label={label}
                labelOverlayProps={{ addLabelAsterisk, isFormsy: true }}
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
                placeholder={
                    hasMixedValue && isDisabled_ ? MIXED_VALUE_DISPLAY : `Enter ${queryColumn.caption.toLowerCase()}`
                }
                required={queryColumn.required}
                {...formsyInputProps}
                componentRef={textInputRef}
                disabled={isDisabled_}
                elementWrapperClassName={elementWrapperClassName}
                help={help}
                id={id_}
                label={label_}
                labelClassName={showLabel ? labelClassName : 'hide-label'}
                name={queryColumn.fieldKey}
                onChange={onChange_}
                value={inputValue}
            />
            {includeSpacesWarning && <InternalSpacesWarning value={localValue} />}
        </>
    );
};
TextInput.displayName = 'TextInput';
