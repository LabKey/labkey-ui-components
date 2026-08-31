/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, ReactNode, useCallback, useMemo, useState } from 'react';

import { QueryColumn } from '../../../../public/QueryColumn';
import { FieldLabel } from '../FieldLabel';
import { INPUT_LABEL_CLASS_NAME, INPUT_WRAPPER_CLASS_NAME, MIXED_VALUE_DISPLAY } from '../constants';
import { FormsyTextArea, FormsyTextAreaProps } from './FormsyReactComponents';
import { DisableableInputProps, useDisableableInput } from './DisableableInput';
import { generateId } from '../../../util/utils';

export interface TextAreaInputProps extends DisableableInputProps, Omit<FormsyTextAreaProps, 'name' | 'onChange'> {
    addLabelAsterisk?: boolean;
    onChange?: (name: string, value: any) => void;
    queryColumn: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    showLabel?: boolean;
}

export const TextAreaInput: FC<TextAreaInputProps> = props => {
    // Extract DisableableInputProps, TextAreaInputProps
    const {
        addLabelAsterisk,
        allowDisable,
        disabled,
        elementWrapperClassName = INPUT_WRAPPER_CLASS_NAME,
        hasMixedValue,
        id,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        initiallyDisabled,
        label,
        labelClassName = `${INPUT_LABEL_CLASS_NAME} textarea-control-label`,
        onChange,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onToggleDisable,
        renderFieldLabel,
        queryColumn,
        showLabel = true,
        ...formsyTextAreaProps
    } = props;
    const { inputValue, isDisabled, setInputValue, toggleDisabled } = useDisableableInput<string>(props);
    const [inputId] = useState<string>(() => id ?? generateId('textAreaInput-'));
    const isDisabled_ = isDisabled || disabled;

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

    return (
        <FormsyTextArea
            aria-label={showLabel ? undefined : queryColumn.caption}
            cols={50}
            placeholder={
                hasMixedValue && isDisabled_ ? MIXED_VALUE_DISPLAY : `Enter ${queryColumn.caption.toLowerCase()}`
            }
            required={queryColumn.required}
            rows={5}
            {...formsyTextAreaProps}
            disabled={isDisabled_}
            elementWrapperClassName={elementWrapperClassName}
            id={inputId}
            label={label_}
            labelClassName={showLabel ? labelClassName : 'hide-label'}
            name={queryColumn.fieldKey}
            onChange={onChange_}
            value={inputValue}
        />
    );
};
TextAreaInput.displayName = 'TextAreaInput';
