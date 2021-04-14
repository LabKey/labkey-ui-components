import React, { PureComponent, ReactNode } from "react";
import { withFormsy } from 'formsy-react';
import { LabelHelpTip } from "../../base/LabelHelpTip";
import { Utils } from "@labkey/api";

// export for jest test usage
export interface RadioGroupOption {
    value: string
    label: ReactNode
    description?: ReactNode
    disabled?: boolean
    selected?: boolean
}

interface Props {
    name: string
    options: Array<RadioGroupOption>
    formsy?: boolean
    onValueChange?: (value) => void

    // from formsy-react
    getErrorMessage?: Function;
    getValue?: Function;
    setValue?: Function;
    showRequired?: Function;
    validations?: any;
}

interface State {
    selectedValue: string;
}

class RadioGroupInputImpl extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);

        const selected = props.options?.find((option) => option.selected)
        this.state = {
            selectedValue: selected?.value
        }
        if (selected?.value && props.formsy && Utils.isFunction(props.setValue)) {
            this.props.setValue(selected.value);
        }
    }

    onValueChange = (evt) => {
        const { value } = evt.target;
        this.setState(() => ({
            selectedValue: value
        }));
        if (this.props.formsy && Utils.isFunction(this.props.setValue)) {
            this.props.setValue(value);
        }
        if (this.props.onValueChange)
            this.props.onValueChange(value);
    }

    render() : ReactNode {
        const { options, name } = this.props;
        const { selectedValue } = this.state;
        let inputs = [];

        if (options) {
            if (options.length === 1) {
                inputs.push(
                    <div key={options[0].value}>
                        <input
                            hidden={true}
                            checked={true}
                            type="radio"
                            name={name}
                            value={options[0].value}
                            onChange={this.onValueChange}
                        />
                    </div>
                );
            } else {
                options.forEach(option => {
                    const selected = selectedValue === option.value;

                    inputs.push((
                        <div key={option.value}>
                            <input
                                checked={selected && !option.disabled}
                                className={""}
                                type="radio"
                                name={name}
                                value={option.value}
                                onChange={this.onValueChange}
                                disabled={option.disabled}
                            /> {option.label}
                            {option.description && (
                                <LabelHelpTip key={option.value + "_help"}>
                                    {option.description}
                                </LabelHelpTip>
                            )}
                        </div>
                    ));
                });
            }
        }
        return inputs;
    }
}

const RadioGroupInputFormsy = withFormsy(RadioGroupInputImpl);

export class RadioGroupInput extends React.Component<Props> {
    static defaultProps = {
        formsy: true,
    };

    render() {
        if (this.props.formsy) {
            return (
                <RadioGroupInputFormsy
                    {...this.props}
                />
            );
        }
        return <RadioGroupInputImpl {...this.props} />;
    }
}
