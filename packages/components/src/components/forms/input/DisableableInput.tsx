import React from 'react'

export interface DisableableInputProps {
    allowDisable?: boolean
    initiallyDisabled?: boolean
}

export interface DisableableInputState {
    isDisabled?: boolean
}

export class DisableableInput<P extends DisableableInputProps, S extends DisableableInputState> extends React.Component<P, S> {
    static defaultProps = {
        allowDisable: false,
        initiallyDisabled: false
    };

    toggleDisabled = () => {
        this.setState(() => {
            return {
                isDisabled: !this.state.isDisabled
            }
        });
    }
}
