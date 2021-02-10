import React, { PureComponent } from "react";
import { Input } from 'formsy-react-components';
import { SampleCreationType, SampleCreationTypeModel } from "../samples/SampleCreationTypeOption";
import { RadioGroupInput } from "./input/RadioGroupInput";
import { addValidationRule } from 'formsy-react';

interface Props {
    creationTypeOptions: Array<SampleCreationTypeModel>
    includeCountField: boolean;
    maxCount: number;
    countText: string;
    defaultCreationType?: SampleCreationType
    onCountChange?: (count: number) => void
}

interface State {
    count: number
    selectedCreationType: SampleCreationType
}

addValidationRule('isPositiveLt', (vs, v, smax) => {
    if (v === '' || v === undefined || isNaN(v)) {
        return true;
    }

    const max = parseInt(smax);
    const i = parseInt(v);

    if (!isNaN(i) && i >= 1 && i <= max) return true;
    return max == 1 ? 'Only 1 allowed' : `Value must be between 1 and ${max}.`;
});

export class QueryInfoQuantity extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            count: undefined,
            selectedCreationType: props.defaultCreationType
        }
    }

    onCountChange = (field, value): void => {
        this.setState(() => ({ count: value }));

        if (this.props.onCountChange) {
            this.props.onCountChange(value);
        }
    };

    onOptionChange = (value)  => {
        this.setState(() => ({selectedCreationType: value}));
    }

    render() {
        const { creationTypeOptions, includeCountField, maxCount } = this.props;
        const { count, selectedCreationType } = this.state;
        let text = this.props.countText;

        let options = [];

        if (creationTypeOptions)
        {
            creationTypeOptions.forEach(option => {
                const selected = selectedCreationType === option.type;
                if (selected && option.minParentsPerSample === 1)
                    text = option.type + ' per parent';
                options.push({
                    value: option.type,
                    description: option.description,
                    label: option.type
                });
            });
        }
        return (
            <>
                {options.length > 0 && (
                    <RadioGroupInput
                        name={"creationType"}
                        options={options}
                        formsy={true}
                        onValueChange={this.onOptionChange}
                    />
                )}
                {(options.length > 0 || includeCountField) && (
                    <Input
                        id="numItems"
                        label={text}
                        labelClassName="control-label text-left"
                        name="numItems"
                        max={maxCount}
                        min={1}
                        onChange={this.onCountChange}
                        required={true}
                        step="1"
                        style={{ width: '125px' }}
                        type="number"
                        validations={`isPositiveLt:${maxCount}`}
                        value={count ? count.toString() : "1"}
                    />
                )}
            </>
        );
    }
}
