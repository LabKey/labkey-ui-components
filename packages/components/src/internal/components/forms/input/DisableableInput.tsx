import React from 'react';

export interface DisableableInputProps {
    allowDisable?: boolean;
    initiallyDisabled?: boolean;
    value?: any;
    onToggleDisable?: (disabled: boolean) => void;
}

export interface DisableableInputState {
    isDisabled?: boolean;
    inputValue?: any;
}

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

    toggleDisabled = () => {
        const { value } = this.props;
        const { inputValue } = this.state;

        this.setState(state => {
            return {
                isDisabled: !state.isDisabled,
                inputValue: state.isDisabled ? inputValue : value,
            };
        }, () => {
            if (this.props.onToggleDisable) {
                this.props.onToggleDisable(this.state.isDisabled);
            }
        });
    };
}
