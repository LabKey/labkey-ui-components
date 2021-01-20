/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { EntityDeleteConfirmModal, SampleTypeDataType } from '..';

import initGlobal from './initGlobal';
import { disableControls } from './storyUtils';

initGlobal();

export default {
    title: 'Components/EntityDeleteConfirmModal',
    component: EntityDeleteConfirmModal,
    argTypes: {
        entityDataType: disableControls(),
        onCancel: { action: 'cancel', ...disableControls() },
        onConfirm: { action: 'confirm', ...disableControls() },
        selectionKey: {
            control: {
                type: 'select',
                options: ['nonesuch', 'deleteNone', 'deleteOne', 'deleteAll', 'deleteSome'],
            },
        },
    },
} as Meta;

export const EntityDeleteConfirmModalStory: Story = props => (
    <EntityDeleteConfirmModal {...(props as any)} entityDataType={SampleTypeDataType} />
);

EntityDeleteConfirmModalStory.storyName = 'EntityDeleteConfirmModal';

EntityDeleteConfirmModalStory.args = {
    selectionKey: 'nonesuch',
};
