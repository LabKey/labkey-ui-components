/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React, { useMemo } from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { EditableGridModal, EditableGridLoader, getStateQueryGridModel, SchemaQuery } from '..';

import { disableControls } from './storyUtils';

export default {
    title: 'Components/EditableGridModal',
    component: EditableGridModal,
    argTypes: {
        addControlProps: disableControls(),
        bulkAddProps: disableControls(),
        bulkUpdateProps: disableControls(),
        model: disableControls(),
        onCancel: { action: 'cancel', ...disableControls() },
        onCellModify: { action: 'cellModify', ...disableControls() },
        onRowCountChange: { action: 'rowCountChange', ...disableControls() },
        onSave: { action: 'save', ...disableControls() },
    },
} as Meta;

export const EditableGridModalStory: Story = props => {
    const model = useMemo(() => {
        const schemaQuery = SchemaQuery.create('exp.data', 'mixtures');
        return getStateQueryGridModel('editableModal', schemaQuery, () => ({
            editable: true,
            loader: new EditableGridLoader(),
        }));
    }, []);

    return <EditableGridModal {...(props as any)} model={model} />;
};

EditableGridModalStory.storyName = 'EditableGridModal';

EditableGridModalStory.args = {
    allowRemove: false,
    show: true,
    title: 'Editable modal',
};
