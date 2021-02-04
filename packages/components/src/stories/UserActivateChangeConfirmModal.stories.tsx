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
import { List } from 'immutable';
import { Meta, Story } from '@storybook/react/types-6-0';

import { UserActivateChangeConfirmModal } from '../internal/components/user/UserActivateChangeConfirmModal';

export default {
    title: 'Components/UserActivateChangeConfirmModal',
    component: UserActivateChangeConfirmModal,
    argTypes: {
        onCancel: {
            action: 'cancel',
            control: { disable: true },
            table: { disable: true },
        },
        onComplete: {
            action: 'complete',
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

export const UserActivateChangeConfirmModalStory: Story = storyProps => {
    return <UserActivateChangeConfirmModal {...(storyProps as any)} userIds={List(storyProps.userIds ?? [])} />;
};

UserActivateChangeConfirmModalStory.storyName = 'UserActivateChangeConfirmModal';

UserActivateChangeConfirmModalStory.args = {
    reactivate: true,
    userIds: [1, 2],
};
