/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { List, Set } from 'immutable';

import { FILES_DATA } from '../test/data/constants';
import { FilesListingProps, FilesListing } from '../internal/components/files/FilesListing';
import { IFile } from '../internal/components/files/models';

import { disableControls } from './storyUtils';

export default {
    title: 'Components/FilesListing',
    component: FilesListing,
    argTypes: {
        files: disableControls(),
        selectedFiles: disableControls(),
        onDelete: disableControls(),
        onFileSelection: disableControls(),
        getFilePropertiesEditTrigger: {
            defaultValue: () => <b>Click Me!</b>,
            ...disableControls(),
        },
    },
} as Meta;

export const FilesListingStory: Story<FilesListingProps> = props => (
    <FilesListing
        {...props}
        files={props.withFiles ? FILES_DATA : List<IFile>()}
        selectedFiles={props.withSelectedFiles ? Set<string>([FILES_DATA.first().name]) : Set<string>()}
    />
);

FilesListingStory.storyName = 'FilesListing';

FilesListingStory.args = {
    canDelete: true,
    noFilesMessage: 'No files currently available.',

    // story only props
    withFiles: true,
    withSelectedFiles: true,
};
