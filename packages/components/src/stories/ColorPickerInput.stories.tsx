/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React, { useState } from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { ColorPickerInput as ColorPickerInputComponent } from '..';

export default {
    title: 'Components/ColorPickerInput',
    component: ColorPickerInputComponent,
    argTypes: {
        onChange: {
            control: { disable: true },
            table: { disable: true },
        },
        value: {
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

export const ColorPickerInput: Story = storyProps => {
    const [selected, setSelected] = useState<string>('#009ce0');
    return (
        <ColorPickerInputComponent {...storyProps} onChange={(name, value) => setSelected(value)} value={selected} />
    );
};

ColorPickerInput.args = {
    allowRemove: true,
    showLabel: true,
    text: 'Select color',
};
