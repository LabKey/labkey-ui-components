import React, { ChangeEventHandler, FC, PureComponent, ReactNode } from 'react';
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

interface OwnProps {
    formsy?: boolean;
    name: string;
    onValueChange?: (value) => void;
    options: RadioGroupOption[];
    showDescriptions?: boolean;
}

type RadioGroupInputProps = OwnProps & FormsyInjectedProps<any>;

interface State {
    selectedValue: string;
}

class RadioGroupInputImpl extends PureComponent<RadioGroupInputProps, State> {
    constructor(props: RadioGroupInputProps) {
        super(props);

        const selected = props.options?.find(option => option.selected);
        this.state = {
            selectedValue: selected?.value,
        };
        if (selected?.value && props.formsy) {
            props.setValue?.(selected.value);
        }
    }

    onValueChange: ChangeEventHandler<HTMLInputElement> = (evt): void => {
        const { formsy, onValueChange, setValue } = this.props;
        const { value } = evt.target;

        this.setState({ selectedValue: value });

        if (formsy) {
            setValue?.(value);
        }
        onValueChange?.(value);
    };

    render(): ReactNode {
        const { options, name, showDescriptions } = this.props;
        const { selectedValue } = this.state;
        const inputs = [];

        if (options) {
            if (options.length === 1) {
                inputs.push(
                    <div key={options[0].value}>
                        <input
                            checked
                            hidden
                            name={name}
                            onChange={this.onValueChange}
                            type="radio"
                            value={options[0].value}
                        />
                    </div>
                );
            } else {
                options.forEach(option => {
                    const selected = selectedValue === option.value;

                    inputs.push(
                        <div key={option.value} className="radio-input-wrapper">
                            <input
                                className="radioinput-input"
                                checked={selected && !option.disabled}
                                type="radio"
                                name={name}
                                value={option.value}
                                onChange={this.onValueChange}
                                disabled={option.disabled}
                            />
                            <span className={classNames('radioinput-label', { selected })}>{option.label}</span>
                            {showDescriptions && option.description && (
                                <span className="radioinput-description"> - {option.description}</span>
                            )}
                            {!showDescriptions && option.description && (
                                <LabelHelpTip>{option.description}</LabelHelpTip>
                            )}
                        </div>
                    );
                });
            }
        }
        return inputs;
    }
}

const RadioGroupInputFormsy = withFormsy<OwnProps, any>(RadioGroupInputImpl);

export const RadioGroupInput: FC<OwnProps> = props => {
    if (props.formsy) {
        return <RadioGroupInputFormsy {...props} />;
    }

    // @ts-ignore
    return <RadioGroupInputImpl {...props} />;
};

RadioGroupInput.defaultProps = {
    formsy: true,
};

RadioGroupInput.displayName = 'RadioGroupInput';
