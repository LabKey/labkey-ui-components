import React, { FC, memo, useCallback, useMemo } from 'react';
import { Map } from 'immutable';

import { QueryColumn } from '../../../../public/QueryColumn';
import { caseInsensitive, generateId } from '../../../util/utils';

import { SelectInput } from './SelectInput';

interface Props {
    allowDisable?: boolean;
    col: QueryColumn;
    data?: any;
    initiallyDisabled?: boolean;
    isDetailInput?: boolean;
    onToggleDisable?: (disabled: boolean) => void;
}

export const AliasInput: FC<Props> = memo(props => {
    const { allowDisable, col, data, isDetailInput, initiallyDisabled, onToggleDisable } = props;
    const id = useMemo(() => generateId(), []);
    const promptTextCreator = useCallback((text: string) => `Create alias "${text}"`, []);

    // AliasInput supplies its own formValue resolution
    // - The value is mapped from the "label"
    // - When empty the server expects an empty Array and not undefined/null
    const resolveFormValue = useCallback(options => options?.map(o => o.label) ?? [], []);

    const value: string[] = useMemo(() => {
        const row = Map.isMap(data) ? data.toJS() : data;
        return caseInsensitive(row, col.fieldKey)
            ?.map(a => {
                if (!a) return a;
                if (typeof a === 'string') return a;
                if (typeof a === 'object') return a.displayValue;
                return undefined;
            })
            .filter(a => !!a);
    }, [col, data]);

    return (
        <SelectInput
            allowCreate
            allowDisable={allowDisable}
            description={col.description}
            formsy
            id={id}
            initiallyDisabled={initiallyDisabled}
            inputClass={isDetailInput ? 'col-sm-12' : undefined}
            joinValues
            label={col.caption}
            multiple
            name={col.fieldKey}
            noResultsText="Enter alias name(s)"
            onToggleDisable={onToggleDisable}
            placeholder="Enter alias name(s)"
            promptTextCreator={promptTextCreator}
            required={col.required}
            resolveFormValue={resolveFormValue}
            saveOnBlur
            showLabel
            value={value}
        />
    );
});

AliasInput.displayName = 'AliasInput';
