/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ChangeEvent, FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';

import { FormsyInjectedProps, withFormsy } from '../formsy';
import { LabelHelpTip } from '../../base/LabelHelpTip';

// export for jest test usage
export interface RadioGroupOption {
    description?: ReactNode;
    disabled?: boolean;
    label: ReactNode;
    selected?: boolean;
    value: string;
}

interface RadioGroupOptionImplProps {
    isSelected: boolean;
    name: string;
    onSetValue: (value: string) => void;
    option: RadioGroupOption;
    showDescriptions: boolean;
}

const RadioGroupOption: FC<RadioGroupOptionImplProps> = memo(props => {
    const { isSelected, name, option, showDescriptions, onSetValue } = props;

    const onLabelClick = useCallback(() => {
        if (!option.disabled) onSetValue(option.value);
    }, [onSetValue, option.value, option.disabled]);

    const onRadioChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            if (!option.disabled) onSetValue(evt.target.value);
        },
        [onSetValue, option.disabled]
    );

    return (
        <div className="radio-input-wrapper">
            <input
                aria-label={option.value ?? 'null'}
                checked={isSelected && !option.disabled}
                className="radioinput-input"
                disabled={option.disabled}
                name={name}
                onChange={onRadioChange}
                type="radio"
                value={option.value}
            />
            <span
                className={classNames('radioinput-label', { selected: isSelected, disabled: option.disabled })}
                onClick={onLabelClick}
            >
                {option.label}
            </span>
            {showDescriptions && option.description && (
                <span className="radioinput-description"> - {option.description}</span>
            )}
            {!showDescriptions && option.description && <LabelHelpTip>{option.description}</LabelHelpTip>}
        </div>
    );
});

RadioGroupOption.displayName = 'RadioGroupOption';

interface OwnProps {
    formsy?: boolean;
    name: string;
    onValueChange?: (value) => void;
    options: RadioGroupOption[];
    showDescriptions?: boolean;
}

type RadioGroupInputProps = FormsyInjectedProps<any> & OwnProps;

const RadioGroupInputImpl: FC<RadioGroupInputProps> = memo(props => {
    const { options, name, showDescriptions, formsy, setValue, onValueChange } = props;
    const selected = useMemo(() => options?.find(option => option.selected), [options]);
    const [selectedValue, setSelectedValue] = useState<string>(selected?.value);

    useEffect(() => {
        if (selectedValue && formsy) {
            setValue?.(selectedValue);
        }
    }, [formsy, selectedValue, setValue]);

    const onSetValue = useCallback(
        (value: string): void => {
            setSelectedValue(value);
            onValueChange?.(value);
        },
        [onValueChange]
    );

    const onValueChange_ = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            onSetValue(evt.target.value);
        },
        [onSetValue]
    );

    if (options?.length === 1) {
        return (
            <div className="radio-input-wrapper" key={options[0].value}>
                <input
                    aria-label={options[0].value ?? 'null'}
                    checked
                    hidden
                    name={name}
                    onChange={onValueChange_}
                    type="radio"
                    value={options[0].value}
                />
            </div>
        );
    }

    return (
        <>
            {options?.map(option => (
                <RadioGroupOption
                    isSelected={selectedValue === option.value}
                    key={option.value ?? `radio-${option.label}`}
                    name={name}
                    onSetValue={onSetValue}
                    option={option}
                    showDescriptions={showDescriptions}
                />
            ))}
        </>
    );
});

RadioGroupInputImpl.displayName = 'RadioGroupInputImpl';

const RadioGroupInputFormsy = withFormsy<OwnProps, any>(RadioGroupInputImpl);

export const RadioGroupInput: FC<OwnProps> = props => {
    const { formsy = true } = props;
    if (formsy) {
        return <RadioGroupInputFormsy {...props} formsy />;
    }
    return <RadioGroupInputImpl {...(props as any)} formsy={false} />;
};

RadioGroupInput.displayName = 'RadioGroupInput';
