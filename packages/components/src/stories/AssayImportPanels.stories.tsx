/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { AssayImportPanels } from '..';
import initGlobal from './initGlobal';
import { ASSAY_WIZARD_MODEL } from '../test/data/constants';
import { AssayUploadTabs } from '../internal/AssayDefinitionModel';

initGlobal();

export default {
    title: 'Components/AssayImportPanels',
    component: AssayImportPanels as any,
    argTypes: {
        assayDefinition: {
            control: { disable: true },
            table: { disable: true },
        },
        maxInsertRows: {
            type: 'number',
        },
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

const Template: Story = props => {
    return <AssayImportPanels {...(props as any)} assayDefinition={ASSAY_WIZARD_MODEL.assayDef} />;
};

export const AssayImportPanelsStory = Template.bind({});
AssayImportPanelsStory.storyName = 'Default Panel';

AssayImportPanelsStory.args = {
    allowBulkInsert: true,
    allowBulkRemove: true,
    allowBulkUpdate: true,
};

export const GridOnlyStory = Template.bind({});
GridOnlyStory.storyName = 'Grid upload only';

GridOnlyStory.args = {
    ...AssayImportPanelsStory.args,
    initialStep: AssayUploadTabs.Grid,
    showUploadTabs: false,
};

export const ReimportStory = Template.bind({});
ReimportStory.storyName = 'For re-import';

ReimportStory.args = {
    ...AssayImportPanelsStory.args,
    runId: 568,
};
