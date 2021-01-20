/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React, { useState } from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { ToggleButtons } from '..';
import { disableControls } from './storyUtils';

export default {
    title: 'Components/ToggleButtons',
    component: ToggleButtons,
    argTypes: {
        active: disableControls(),
        onClick: disableControls(),
    },
} as Meta;

export const ToggleButtonsStory: Story = storyProps => {
    const [selected, setSelected] = useState<string>(undefined);
    return <ToggleButtons {...(storyProps as any)} active={selected} onClick={setSelected} />;
};

ToggleButtonsStory.storyName = 'ToggleButtons';

ToggleButtonsStory.args = {
    first: 'TSV',
    second: 'CSV',
};
