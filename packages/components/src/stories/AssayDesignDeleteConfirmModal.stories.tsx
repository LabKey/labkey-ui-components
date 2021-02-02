/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { AssayDesignDeleteConfirmModal } from '..';

export default {
    title: 'Components/AssayDesignDeleteConfirmModal',
    component: AssayDesignDeleteConfirmModal,
    argTypes: {
        assayDesignName: {
            label: 'Assay Design Name',
        },
        onCancel: {
            action: 'cancelled',
            control: { disable: true },
            table: { disable: true },
        },
        onConfirm: {
            action: 'confirmed',
            control: { disable: true },
            table: { disable: true },
        },
        numRuns: {
            label: 'Number of Runs',
        },
    },
} as Meta;

const Template: Story = storyProps => <AssayDesignDeleteConfirmModal {...(storyProps as any)} />;

export const WithoutName = Template.bind({});
export const WithName = Template.bind({});
WithName.args = {
    assayDesignName: 'GPAT-10',
};

export const WithRuns = Template.bind({});
WithRuns.args = {
    numRuns: 3,
};
