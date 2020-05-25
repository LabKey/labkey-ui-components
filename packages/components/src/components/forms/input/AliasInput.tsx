import React from 'react';

import { generateId, QueryColumn, SelectInput } from '../../..';

interface AliasInputProps {
    col: QueryColumn;
    editing?: boolean;
    value?: string | Array<Object>;
    allowDisable?: boolean;
    initiallyDisabled: boolean;
    onToggleDisable?: (boolean) => void;
}

interface AliasInputState {
    labelKey?: string
}

export class AliasInput extends React.Component<AliasInputProps, AliasInputState> {
    _id: string;

    constructor(props: AliasInputProps) {
        super(props);

        this._id = generateId();

        // Alias fields could use label or displayValue
        let labelKey = 'label';
        if (typeof props.value !== 'string') {
            if (props.value[0] && 'displayValue' in props.value[0]) {
                labelKey = 'displayValue';
            }
        }

        this.state = { labelKey };
    }

    onChange = () => {

    }

    render() {
        const { allowDisable, col, editing, value, initiallyDisabled, onToggleDisable } = this.props;
        const { labelKey } = this.state;

        return (
            <SelectInput
                allowDisable={allowDisable}
                initiallyDisabled={initiallyDisabled}
                onToggleDisable={onToggleDisable}
                showLabel={true}
                addLabelText="Press enter to add '{label}'"
                allowCreate={true}
                id={this._id}
                inputClass={editing ? 'col-sm-12' : undefined}
                joinValues={true}
                label={col.caption}
                required={col.required}
                multiple={true}
                name={col.name}
                noResultsText="Enter alias name(s)"
                placeholder="Enter alias name(s)"
                promptTextCreator={(text: string) => `Create alias "${text}"`}
                saveOnBlur={true}
                value={value}
                labelKey={labelKey}
            />
        );
    }
}
