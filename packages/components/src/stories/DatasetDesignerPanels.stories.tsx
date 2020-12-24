/*
 * Copyright (c) 2020 LabKey Corporation
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

import { NEW_DATASET_MODEL_WITH_DATASPACE, NEW_DATASET_MODEL_WITHOUT_DATASPACE } from '../test/data/constants';
import { DatasetDesignerPanels, DatasetModel } from '..';

import getDatasetDesign from '../test/data/dataset-getDatasetDesign.json';
import getDatasetDesignSharedStudy from '../test/data/dataset-getDatasetDesignSharedStudy.json';

export default {
    title: 'Components/DatasetDesignerPanels',
    component: DatasetDesignerPanels,
    argTypes: {
        initModel: {
            control: { disable: true },
            table: { disable: true },
        },
        onCancel: {
            action: 'cancelled',
            control: { disable: true },
            table: { disable: true },
        },
        onComplete: {
            action: 'completed',
            control: { disable: true },
            table: { disable: true },
        },
    },
    args: {
        saveBtnText: 'Save',
        useTheme: false,
    },
} as Meta;

const DatasetDesignerPanelsStory: Story = storyProps => {
    return <DatasetDesignerPanels {...(storyProps as any)} />;
};

export const CreateWithoutDataspace = DatasetDesignerPanelsStory.bind({});
CreateWithoutDataspace.storyName = 'Create new dataset without dataspace';

CreateWithoutDataspace.args = {
    initModel: DatasetModel.create(NEW_DATASET_MODEL_WITHOUT_DATASPACE),
};

export const CreateWithDataspace = DatasetDesignerPanelsStory.bind({});
CreateWithDataspace.storyName = 'Create new dataset with dataspace';

CreateWithDataspace.args = {
    initModel: DatasetModel.create(NEW_DATASET_MODEL_WITH_DATASPACE),
};

export const EditWithoutDataspace = DatasetDesignerPanelsStory.bind({});
EditWithoutDataspace.storyName = 'Edit dataset without dataspace';

EditWithoutDataspace.args = {
    initModel: DatasetModel.create(null, getDatasetDesign),
};

export const EditWithDataspace = DatasetDesignerPanelsStory.bind({});
EditWithDataspace.storyName = 'Edit dataset with dataspace';

EditWithDataspace.args = {
    initModel: DatasetModel.create(null, getDatasetDesignSharedStudy),
};
