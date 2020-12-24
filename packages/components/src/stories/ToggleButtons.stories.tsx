/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React, { useCallback, useState } from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { ToggleButtons } from '..';

export default {
    title: 'Components/ToggleButtons',
    component: ToggleButtons,
    argTypes: {
        active: {
            control: { disable: true },
            table: { disable: true },
        },
        onClick: {
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

export const ToggleButtonsStory: Story = storyProps => {
    const [selected, setSelected] = useState<string>(undefined);

    const onClick = useCallback((newSelected: string) => {
        setSelected(newSelected);
    }, []);

    return <ToggleButtons {...(storyProps as any)} active={selected} onClick={onClick} />;
};

ToggleButtonsStory.storyName = 'ToggleButtons';

ToggleButtonsStory.args = {
    first: 'TSV',
    second: 'CSV',
};
