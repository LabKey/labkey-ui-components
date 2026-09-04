/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useMemo } from 'react';

import { QueryColumn } from '../../../../public/QueryColumn';

import { SelectInput, SelectInputProps } from './SelectInput';

export interface TextChoiceInputProps extends Omit<
    SelectInputProps,
    'multiple' | 'name' | 'options' | 'skipJoinValues' | 'sortValues'
> {
    queryColumn: QueryColumn;
}

export const TextChoiceInput: FC<TextChoiceInputProps> = props => {
    const { queryColumn, ...selectInputProps } = props;
    const options = useMemo(
        () => queryColumn.validValues?.map(value => ({ label: value, value })) ?? [],
        [queryColumn]
    );

    return (
        <SelectInput
            label={queryColumn.caption}
            required={queryColumn.required}
            {...selectInputProps}
            multiple={queryColumn.isMultiChoice}
            name={queryColumn.fieldKey}
            options={options}
            skipJoinValues
            sortValues
        />
    );
};
TextChoiceInput.displayName = 'TextChoiceInput';
