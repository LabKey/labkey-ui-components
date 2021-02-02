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

import { SampleSetSummary, User } from '..';

import { initGlobal } from './storyUtils';

initGlobal();

export default {
    title: 'Components/SampleSetSummary',
    component: SampleSetSummary,
    argTypes: {
        navigate: {
            action: 'navigate',
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

export const SampleSetSummaryStory: Story = props => (
    <SampleSetSummary {...(props as any)} user={new User(props.user ?? {})} />
);

SampleSetSummaryStory.storyName = 'SampleSetSummary';

SampleSetSummaryStory.args = {
    location: {
        query: {
            viewAs: 'grid',
        },
    },
    user: {
        avatar: undefined,
        displayName: 'Test User',
        isSignedIn: true,
        isAdmin: true,
    },
};
