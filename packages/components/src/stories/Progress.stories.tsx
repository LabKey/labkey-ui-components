/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { Progress } from '..';

export default {
    title: 'Components/Progress',
    component: Progress,
} as Meta;

export const ProgressStory: Story = props => <Progress {...(props as any)} />;

ProgressStory.storyName = 'Progress';
