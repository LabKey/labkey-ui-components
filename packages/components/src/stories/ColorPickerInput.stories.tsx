/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React, { useCallback, useState } from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { ColorPickerInput } from '..';

export default {
    title: 'Components/ColorPickerInput',
    component: ColorPickerInput,
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

export const ColorPickerInputStory: Story = storyProps => {
    const [selected, setSelected] = useState<string>('#009ce0');
    const onChange = useCallback((name, value) => { setSelected(value); }, []);

    return <ColorPickerInput {...storyProps} onChange={onChange} value={selected} />;
};

ColorPickerInputStory.storyName = 'ColorPickerInput';

ColorPickerInputStory.args = {
    allowRemove: true,
    showLabel: true,
    text: 'Select color',
};
