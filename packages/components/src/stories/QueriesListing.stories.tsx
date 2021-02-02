/*
 * Copyright (c) 2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { QueriesListing } from '..';

import { initGlobal } from './storyUtils';

initGlobal();

export default {
    title: 'Components/QueriesListing',
    component: QueriesListing,
    argTypes: {
        schemaName: {
            defaultValue: 'assay',
        },
    },
} as Meta;

export const QueriesListingStory: Story = props => <QueriesListing {...(props as any)} />;

QueriesListingStory.storyName = 'QueriesListing';
