/*
 * Copyright (c) 2019-2021 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { ProductNavigationMenu } from '../internal/components/navigation/ProductNavigationMenu';

export default {
    title: 'Components/ProductNavigationMenu',
    component: ProductNavigationMenu,
} as Meta;

export const ProductNavigationMenuStory: Story = props => {
    return (
        <ProductNavigationMenu
            {...props}
        />
    );
};

ProductNavigationMenuStory.storyName = 'ProductNavigationMenu';

ProductNavigationMenuStory.args = {};
