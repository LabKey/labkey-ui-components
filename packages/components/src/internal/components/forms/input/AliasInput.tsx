import React, { FC, memo, useCallback, useMemo } from 'react';
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
    const generatedId = useMemo(() => generateId(), []);

    const formatCreateLabel = useCallback(inputValue => `Create alias "${inputValue}"`, []);

    const isValidNewOption = useCallback((inputValue: string) => {
        const isEmpty = inputValue?.trim().length === 0;
        // Empty string is considered invalid. This matches default react-select behavior.
        return !!inputValue && !isEmpty;
    }, []);

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
            description={col.description}
            formatCreateLabel={formatCreateLabel}
            formsy
            id={generatedId}
            isValidNewOption={isValidNewOption}
            joinValues
            label={col.caption}
            multiple
            name={col.fieldKey}
            noResultsText="Enter alias name(s)"
            placeholder="Enter alias name(s)"
            required={col.required}
            saveOnBlur
            showLabel
            {...selectProps}
            resolveFormValue={resolveFormValue}
            value={value}
        />
    );
});

AliasSelectInput.displayName = 'AliasSelectInput';

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

AliasInput.displayName = 'AliasInput';

export const AliasGridInput: FC<InputRendererProps> = memo(props => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, values, ...aliasInputProps } = props;
    const { col } = aliasInputProps;

    const gridData = useMemo(() => {
        if (!values) return undefined;
        return { [col.fieldKey]: values.map(v => v.display).toArray() };
    }, [col.fieldKey, values]);

    return <AliasInput {...aliasInputProps} data={gridData} />;
});

AliasGridInput.displayName = 'AliasGridInput';
