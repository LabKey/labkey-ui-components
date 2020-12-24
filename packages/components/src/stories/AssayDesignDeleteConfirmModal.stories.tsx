/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
