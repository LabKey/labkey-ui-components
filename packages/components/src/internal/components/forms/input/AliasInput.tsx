import React, { Component } from 'react';

import { generateId, QueryColumn, SelectInput } from '../../../..';

interface AliasInputProps {
    col: QueryColumn;
    editing?: boolean;
    value?: string | Array<Record<string, any>>;
    allowDisable?: boolean;
    initiallyDisabled: boolean;
    onToggleDisable?: (disabled: boolean) => void;
}

export class AliasInput extends Component<AliasInputProps> {
    _id: string;

    constructor(props: AliasInputProps) {
        super(props);

        this._id = generateId();
    }

    promptTextCreator = (text: string): string => `Create alias "${text}"`;

    render() {
        const { allowDisable, col, editing, value, initiallyDisabled, onToggleDisable } = this.props;

        return (
            <SelectInput
                allowDisable={allowDisable}
                initiallyDisabled={initiallyDisabled}
                onToggleDisable={onToggleDisable}
                showLabel={true}
                allowCreate={true}
                id={this._id}
                inputClass={editing ? 'col-sm-12' : undefined}
                joinValues={true}
                label={col.caption}
                required={col.required}
                multiple={true}
                name={col.fieldKey}
                noResultsText="Enter alias name(s)"
                placeholder="Enter alias name(s)"
                promptTextCreator={this.promptTextCreator}
                saveOnBlur={true}
                value={value}
            />
        );
    }
}
