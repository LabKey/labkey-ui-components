/*
 * Copyright (c) 2019-2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { CreateUsersModal as CreateUsersModalComponent } from '../internal/components/user/CreateUsersModal';
import { SECURITY_ROLE_AUTHOR, SECURITY_ROLE_EDITOR, SECURITY_ROLE_READER } from '../test/data/constants';

const ROLE_OPTIONS = [
    { id: SECURITY_ROLE_READER, label: 'Reader (default)' },
    { id: SECURITY_ROLE_AUTHOR, label: 'Author' },
    { id: SECURITY_ROLE_EDITOR, label: 'Editor' },
];

export default {
    title: 'Components/CreateUsersModal',
    component: CreateUsersModalComponent,
    argTypes: {
        onCancel: { action: 'cancelled' },
        onComplete: { action: 'completed' },
    },
} as Meta;

export const CreateUsersModal: Story = ({ showRoleOptions, ...props }) => {
    return <CreateUsersModalComponent {...(props as any)} roleOptions={showRoleOptions ? ROLE_OPTIONS : undefined} />;
};
CreateUsersModal.args = {
    showRoleOptions: true,
    show: true,
};
