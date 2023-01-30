import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { Map } from 'immutable';

import { QueryColumn } from '../../../../public/QueryColumn';
import { caseInsensitive, generateId } from '../../../util/utils';

import { InputRendererProps } from './types';

import { SelectInput, SelectInputProps } from './SelectInput';

interface Props extends Omit<SelectInputProps, 'loadOptions' | 'options' | 'resolveFormValue' | 'value'> {
    col: QueryColumn;
    data?: any;
}

export const AliasSelectInput: FC<Props> = memo(props => {
    const { col, data, ...selectProps } = props;
    const [containsCommas, setContainsComma] = useState<boolean>();
    const generatedId = useMemo(() => generateId(), []);

    // Issue 45729: Inform user that commas are not supported for values in the alias field.
    const isValidNewOption = useCallback((inputValue: string) => {
        const isEmpty = inputValue?.trim().length === 0;
        const _containsComma = inputValue?.indexOf(',') > -1;
        setContainsComma(_containsComma);

        // Empty string is considered invalid. This matches default react-select behavior.
        return !!inputValue && !isEmpty && !_containsComma;
    }, []);

    // Here we utilize the noResultsText to display a validation message.
    const noResultsText = useMemo(() => {
        if (containsCommas) {
            return <span className="has-error">Aliases cannot include the "," character</span>;
        }
        return 'Enter alias name(s)';
    }, [containsCommas]);

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
            id={generatedId}
            isValidNewOption={isValidNewOption}
            label={col.caption}
            name={col.fieldKey}
            noResultsText={noResultsText}
            required={col.required}
            {...selectProps}
            resolveFormValue={resolveFormValue}
            value={value}
        />
    );
});

AliasSelectInput.defaultProps = {
    allowCreate: true,
    formatCreateLabel: inputValue => `Create alias "${inputValue}"`,
    formsy: true,
    joinValues: true,
    multiple: true,
    placeholder: 'Enter alias name(s)',
    saveOnBlur: true,
    showLabel: true,
};

AliasSelectInput.displayName = 'AliasInput';

export const AliasInput: FC<InputRendererProps> = memo(props => {
    const {
        allowFieldDisable,
        col,
        data,
        formsy,
        initiallyDisabled,
        onSelectChange,
        onToggleDisable,
        selectInputProps,
    } = props;

    return (
        <AliasSelectInput
            {...selectInputProps}
            allowDisable={allowFieldDisable}
            col={col}
            data={data}
            formsy={formsy}
            initiallyDisabled={initiallyDisabled}
            onChange={onSelectChange}
            onToggleDisable={onToggleDisable}
        />
    );
});
