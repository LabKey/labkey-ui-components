import React, { ReactNode } from 'react';

import { QueryColumn } from '../../../../public/QueryColumn';

import { SelectInput, SelectInputProps } from './SelectInput';
import { DisableableInput, DisableableInputState } from './DisableableInput';

interface Props extends SelectInputProps {
    queryColumn: QueryColumn;
}

export class TextChoiceInput extends DisableableInput<Props, DisableableInputState> {
    render(): ReactNode {
        const { queryColumn, placeholder, ...inputProps } = this.props;
        const inputOptions =
            queryColumn.validValues?.map(val => {
                return { label: val, value: val };
            }) ?? [];

        return (
            <SelectInput
                {...inputProps}
                label={queryColumn.caption}
                name={queryColumn.fieldKey}
                options={inputOptions}
                placeholder={placeholder}
                required={queryColumn.required}
            />
        );
    }
}
