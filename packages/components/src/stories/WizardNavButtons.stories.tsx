/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { WizardNavButtons } from '..';

export default {
    title: 'Components/WizardNavButtons',
    component: WizardNavButtons,
    argTypes: {
        cancel: {
            action: 'cancelled',
            control: { disable: true },
            table: { disable: true },
        },
        nextStep: {
            action: 'nextStep',
            control: { disable: true },
            table: { disable: true },
        },
        previousStep: {
            action: 'previousStep',
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

export const WizardNavButtonsStory: Story = storyProps => <WizardNavButtons {...storyProps as any} />;
WizardNavButtonsStory.storyName = 'WizardNavButtons';
