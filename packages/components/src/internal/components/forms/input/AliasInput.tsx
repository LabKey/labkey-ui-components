import React, { FC, memo, useCallback, useMemo } from 'react';
import { Map } from 'immutable';

import { QueryColumn } from '../../../../public/QueryColumn';
import { caseInsensitive, generateId } from '../../../util/utils';

import { SelectInput, SelectInputProps } from './SelectInput';

interface Props extends Omit<SelectInputProps, 'loadOptions' | 'options' | 'resolveFormValue' | 'value'> {
    col: QueryColumn;
    data?: any;
}

export const AliasInput: FC<Props> = memo(props => {
    const { col, data, ...selectProps } = props;
    const generatedId = useMemo(() => generateId(), []);

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
            description={col.description}
            id={props.id ?? generatedId}
            label={col.caption}
            name={col.fieldKey}
            required={col.required}
            {...selectProps}
            resolveFormValue={resolveFormValue}
            value={value}
        />
    );
});

AliasInput.defaultProps = {
    allowCreate: true,
    formsy: true,
    joinValues: true,
    multiple: true,
    noResultsText: 'Enter alias name(s)',
    placeholder: 'Enter alias name(s)',
    promptTextCreator: (text: string) => `Create alias "${text}"`,
    saveOnBlur: true,
    showLabel: true,
};

AliasInput.displayName = 'AliasInput';
