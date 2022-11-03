import React, { ReactNode } from 'react';

import { QueryColumn } from '../../../../public/QueryColumn';

import { SelectInput, SelectInputProps } from './SelectInput';
import { DisableableInput, DisableableInputState } from './DisableableInput';

interface Props extends Omit<SelectInputProps, 'options'> {
    queryColumn: QueryColumn;
}

export class TextChoiceInput extends DisableableInput<Props, DisableableInputState> {
    render(): ReactNode {
        const { queryColumn, ...selectInputProps } = this.props;
        const options = queryColumn.validValues?.map(val => ({ label: val, value: val })) ?? [];

        return (
            <SelectInput
                label={queryColumn.caption}
                name={queryColumn.fieldKey}
                required={queryColumn.required}
                {...selectInputProps}
                options={options}
            />
        );
    }
}
