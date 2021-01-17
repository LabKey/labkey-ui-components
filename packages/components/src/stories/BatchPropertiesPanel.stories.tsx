/*
 * Copyright (c) 2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { BatchPropertiesPanel } from '../internal/components/assay/BatchPropertiesPanel';
import { ASSAY_WIZARD_MODEL } from '../test/data/constants';

export default {
    title: 'Components/BatchPropertiesPanel',
    component: BatchPropertiesPanel,
    argTypes: {
        onChange: {
            action: 'complete',
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

export const BatchPropertiesPanelStory: Story = props => (
    <BatchPropertiesPanel {...(props as any)} model={ASSAY_WIZARD_MODEL} />
);
BatchPropertiesPanelStory.storyName = 'BatchPropertiesPanel';
