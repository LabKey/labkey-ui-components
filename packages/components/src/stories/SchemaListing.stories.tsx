/*
 * Copyright (c) 2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { SchemaListing } from '..';

import { initGlobal } from './storyUtils';

initGlobal();

export default {
    title: 'Components/SchemaListing',
    component: SchemaListing,
} as Meta;

export const SchemaListingStory: Story = props => <SchemaListing {...props} />;

SchemaListingStory.storyName = 'SchemaListing';
