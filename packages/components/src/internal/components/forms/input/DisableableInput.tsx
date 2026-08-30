/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { useCallback, useState } from 'react';

export interface DisableableInputProps<V = any> {
    allowDisable?: boolean;
    hasMixedValue?: boolean;
    initiallyDisabled?: boolean;
    onToggleDisable?: (disabled: boolean) => void;
    value?: V;
}

export interface DisableableInputState {
    inputValue?: any;
    isDisabled?: boolean;
}

/**
 * @deprecated use the useDisableableInput() hook from a function component instead of inheriting from this class.
 */
export class DisableableInput<P extends DisableableInputProps, S extends DisableableInputState> extends React.Component<
    P,
    S
> {
    static defaultProps = {
        allowDisable: false,
        initiallyDisabled: false,
    };

    getInputValue() {
        if (!this.props.allowDisable || this.state.inputValue === undefined) return this.props.value;

        return this.state.inputValue;
    }

    toggleDisabled = (): void => {
        const { value } = this.props;
        const { inputValue } = this.state;

        this.setState(
            state => ({
                isDisabled: !state.isDisabled,
                inputValue: state.isDisabled ? inputValue : value,
            }),
            () => {
                this.props.onToggleDisable?.(this.state.isDisabled);
            }
        );
    };
}

export interface UseDisableableInput<V> {
    /**
     * The value the input should render. This accounts for the disabled state, falling back to the value from props
     * when the input is not disableable or when the user has not yet edited it. Equivalent to the
     * DisableableInput class's getInputValue().
     */
    inputValue: V;
    isDisabled: boolean;
    /**
     * The locally tracked value. Unlike inputValue this never falls back to props, so it still reflects what the user
     * has typed into an input whose parent does not echo edits back through value.
     */
    localValue: V;
    /**
     * Records the value as the user edits it so it can be reverted when the input is subsequently disabled.
     * Call this from the input's onChange handler.
     */
    setInputValue: (value: V) => void;
    /** Toggles the disabled state, notifying onToggleDisable with the new state. */
    toggleDisabled: () => void;
}

/**
 * React hook that provides the "disableable input" behavior offered by the DisableableInput class to function
 * components. Field labels render a toggle when allowDisable is true (see FieldLabel's showToggle/toggleProps);
 * wiring that toggle to toggleDisabled lets the user turn the field off, which reverts any local edits back to the
 * value from props.
 *
 * Example:
 * ```tsx
 * const MyInput: FC<MyInputProps> = props => {
 *     const { onChange, queryColumn } = props;
 *     const { inputValue, isDisabled, setInputValue, toggleDisabled } = useDisableableInput<string | undefined>(props);
 *
 *     const onInputChange = useCallback<ChangeEventHandler<HTMLInputElement>>(event => {
 *         setInputValue(event.target.value);
 *         onChange?.(event.target.value);
 *     }, [onChange, setInputValue]);
 *
 *     return (
 *         <>
 *             <FieldLabel
 *                 column={queryColumn}
 *                 isDisabled={isDisabled}
 *                 showToggle={props.allowDisable}
 *                 toggleProps={{ onClick: toggleDisabled }}
 *             />
 *             <input disabled={isDisabled} onChange={onInputChange} type="text" value={inputValue} />
 *         </>
 *     );
 * };
 * ```
 */
export function useDisableableInput<V>(props: DisableableInputProps<V>): UseDisableableInput<V> {
    const { allowDisable = false, initiallyDisabled = false, onToggleDisable, value } = props;
    const [isDisabled, setIsDisabled] = useState<boolean>(initiallyDisabled);
    const [inputValue, setInputValue] = useState<V>(value);

    const toggleDisabled = useCallback(() => {
        const disabled = !isDisabled;

        // When disabling, discard any local edits so the value from props is restored
        if (disabled) setInputValue(value);

        setIsDisabled(disabled);
        onToggleDisable?.(disabled);
    }, [isDisabled, onToggleDisable, value]);

    return {
        inputValue: !allowDisable || inputValue === undefined ? value : inputValue,
        isDisabled,
        localValue: inputValue,
        setInputValue,
        toggleDisabled,
    };
}
