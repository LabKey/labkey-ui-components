/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
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
                multiple={queryColumn.isMultiChoice}
                options={options}
                skipJoinValues={true}
                sortValues={true}
            />
        );
    }
}
