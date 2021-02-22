/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { EntityTypeDeleteConfirmModal } from '..';

export default {
    title: 'Components/EntityTypeDeleteConfirmModal',
    component: EntityTypeDeleteConfirmModal,
    argTypes: {
        onCancel: {
            action: 'cancel',
            control: { disable: true },
            table: { disable: true },
        },
        onConfirm: {
            action: 'confirm',
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

export const EntityTypeDeleteConfirmModalStory: Story = props => <EntityTypeDeleteConfirmModal {...(props as any)} />;

EntityTypeDeleteConfirmModalStory.storyName = 'EntityTypeDeleteConfirmModal';

EntityTypeDeleteConfirmModalStory.args = {
    deleteConfirmationActionName: 'deleteSampleTypes',
    noun: 'sample',
    rowId: 0,
    showDependenciesLink: false,
};
