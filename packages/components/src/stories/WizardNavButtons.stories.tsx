/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { WizardNavButtons } from '..';

import { disableControls } from './storyUtils';

export default {
    title: 'Components/WizardNavButtons',
    component: WizardNavButtons,
    argTypes: {
        cancel: { action: 'cancelled', ...disableControls() },
        nextStep: { action: 'nextStep', ...disableControls() },
        previousStep: { action: 'previousStep', ...disableControls() },
    },
} as Meta;

export const WizardNavButtonsStory: Story = props => <WizardNavButtons {...props} />;
WizardNavButtonsStory.storyName = 'WizardNavButtons';
