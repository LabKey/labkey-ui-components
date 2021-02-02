/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';
import { List } from 'immutable';

import { FilesListingForm } from '..';
import { FILES_DATA, FILES_DATA_2 } from '../test/data/constants';
import { disableControls } from './storyUtils';

export default {
    title: 'Components/FilesListingForm',
    component: FilesListingForm,
    argTypes: {
        files: disableControls(),
        readOnlyFiles: disableControls(),
        getFilePropertiesEditTrigger: {
            defaultValue: () => <b>Click Me!</b>,
            ...disableControls(),
        },
        handleDelete: disableControls(),
        handleDownload: disableControls(),
        handleFileChange: { action: 'fileChange', ...disableControls() },
        handleUpload: disableControls(),
        onPropertyUpdate: { action: 'propertyUpdate', ...disableControls() },
        onSubmit: { action: 'submit', ...disableControls() },
        onUploadFiles: { action: 'uploadFiles', ...disableControls() },
    },
} as Meta;

export const FilesListingFormStory: Story = props => (
    <FilesListingForm
        {...(props as any)}
        files={props.withFiles ? FILES_DATA : List()}
        readOnlyFiles={props.withReadOnlyFiles ? FILES_DATA_2 : undefined}
    />
);

FilesListingFormStory.storyName = 'FilesListingForm';

FilesListingFormStory.args = {
    canDelete: true,
    canInsert: true,
    noFilesMessage: 'No files currently attached.',
    useFilePropertiesEditTrigger: true,

    // story only props
    withFiles: true,
    withReadOnlyFiles: true,
};
