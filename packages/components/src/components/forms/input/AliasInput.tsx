import React from 'react';

import { generateId, QueryColumn, SelectInput } from '../../..';

interface AliasInputProps {
    col: QueryColumn;
    editing?: boolean;
    value?: string;
    allowDisable?: boolean;
}

export class AliasInput extends React.Component<AliasInputProps, any> {
    _id: string;

    constructor(props: AliasInputProps) {
        super(props);

        this._id = generateId();
    }

    render() {
        const { allowDisable, col, editing, value } = this.props;

        return (
            <SelectInput
                allowDisable={allowDisable}
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
            />
        );
    }
}
