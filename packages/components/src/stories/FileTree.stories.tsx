/*
 * Copyright (c) 2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { FileTree } from '..';
import { fetchFileTestTree } from '../internal/components/files/FileTreeTest';

import './FileTree.scss';

export default {
    title: 'Components/FileTree',
    component: FileTree,
    argTypes: {
        loadData: {
            control: { disable: true },
            table: { disable: true },
        },
        onFileSelect: {
            action: 'fileSelect',
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

export const FileTreeStory: Story = props => <FileTree {...(props as any)} />;
FileTreeStory.storyName = 'FileTree';

FileTreeStory.args = {
    loadData: fetchFileTestTree,
    useFileIconCls: true,
};
