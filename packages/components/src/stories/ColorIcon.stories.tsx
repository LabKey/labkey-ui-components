/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { ColorIcon } from '..';

export default {
    title: 'Components/ColorIcon',
    component: ColorIcon,
    argTypes: {
        value: { control: 'color' },
    },
} as Meta;

export const ColorIconStory: Story = storyProps => <ColorIcon {...storyProps as any} />;

ColorIconStory.storyName = 'ColorIcon';

ColorIconStory.args = {
    asSquare: false,
    label: 'Color Label',
    useSmall: false,
    value: '#009ce0',
};
