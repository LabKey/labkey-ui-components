/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { PageDetailHeader, PageDetailHeaderProps } from '../internal/components/forms/PageDetailHeader';
import { CreatedModified } from '../internal/components/base/CreatedModified';

import { disableControls } from './storyUtils';
import { ICON_URL } from './mock';

const CREATED_ROW = {
    Created: {
        formattedValue: '2019-05-15 19:45',
        value: '2019-05-15 19:45:40.593',
    },
    CreatedBy: {
        displayValue: 'username',
        url: '#/q/core/siteusers/1001',
        value: 1001,
    },
    Modified: {
        formattedValue: '2019-05-16 19:45',
        value: '2019-05-16 19:45:40.593',
    },
    ModifiedBy: {
        displayValue: 'username2',
        url: '#/q/core/siteusers/1002',
        value: 1002,
    },
};

export default {
    title: 'Components/PageDetailHeader',
    component: PageDetailHeader,
    argTypes: {
        fieldTriggerProps: disableControls(),
        user: disableControls(),
    },
} as Meta;

export const PageDetailHeaderStory: Story<PageDetailHeaderProps> = props => (
    <PageDetailHeader {...props}>
        <CreatedModified row={CREATED_ROW} />
    </PageDetailHeader>
);

PageDetailHeaderStory.storyName = 'PageDetailHeader';

PageDetailHeaderStory.args = {
    title: 'Page Detail Header',
    subTitle: 'With a subtitle',
    description: 'With a description\nThat has a newline in it\nwhich extends below the image.',
    iconUrl: ICON_URL,
    user: null,
};
