import React, { FC, memo, useCallback, useMemo } from 'react';

import { generateId, QueryColumn, SelectInput } from '../../../..';

interface Props {
    allowDisable?: boolean;
    col: QueryColumn;
    editing?: boolean;
    initiallyDisabled: boolean;
    onToggleDisable?: (disabled: boolean) => void;
    value?: string | Array<Record<string, any>>;
}

export const AliasInput: FC<Props> = memo(props => {
    const { allowDisable, col, editing, initiallyDisabled, onToggleDisable, value } = props;
    const id = useMemo(() => generateId(), []);
    const promptTextCreator = useCallback((text: string) => `Create alias "${text}"`, []);

    return (
        <SelectInput
            allowCreate
            allowDisable={allowDisable}
            id={id}
            initiallyDisabled={initiallyDisabled}
            inputClass={editing ? 'col-sm-12' : undefined}
            joinValues
            label={col.caption}
            multiple
            name={col.fieldKey}
            noResultsText="Enter alias name(s)"
            onToggleDisable={onToggleDisable}
            placeholder="Enter alias name(s)"
            promptTextCreator={promptTextCreator}
            required={col.required}
            saveOnBlur
            showLabel
            value={value}
        />
    );
});

AliasInput.displayName = 'AliasInput';
