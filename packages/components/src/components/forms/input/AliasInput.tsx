import React from 'react';

import { generateId, QueryColumn, SelectInput } from '../../..';

interface AliasInputProps {
    col: QueryColumn;
    editing?: boolean;
    value?: string | Array<Record<string, any>>;
    allowDisable?: boolean;
    initiallyDisabled: boolean;
    onToggleDisable?: (boolean) => void;
}

export class AliasInput extends React.Component<AliasInputProps> {
    _id: string;
    _labelKey: string;

    constructor(props: AliasInputProps) {
        super(props);

        this._id = generateId();

        // Alias fields could use label or displayValue
        this._labelKey = 'label';
        if (
            Array.isArray(props.value) &&
            props.value.length > 0 &&
            typeof props.value[0] === 'object' &&
            'displayValue' in props.value[0]
        ) {
            this._labelKey = 'displayValue';
        }
    }

    render() {
        const { allowDisable, col, editing, value, initiallyDisabled, onToggleDisable } = this.props;

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
                labelKey={this._labelKey}
            />
        );
    }
}
