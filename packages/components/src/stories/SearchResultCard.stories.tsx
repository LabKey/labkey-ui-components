/*
 * Copyright (c) 2019-2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { SearchResultCard } from '..';

import { ICON_URL } from './mock';

export default {
    title: 'Components/SearchResultCard',
    component: SearchResultCard,
} as Meta;

export const SearchResultCardStory: Story = props => <SearchResultCard {...(props as any)} />;
SearchResultCardStory.storyName = 'SearchResultCard';

SearchResultCardStory.args = {
    cardData: {
        title: 'Sample - 20190101.123',
        typeName: 'Sample Type 1',
        category: 'Samples',
    },
    iconURL: ICON_URL,
    summary: 'This sample is from the lineage of some important samples for sure.',
    url: '#samples',
};
