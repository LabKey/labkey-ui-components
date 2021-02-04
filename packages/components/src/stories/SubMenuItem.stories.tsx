/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { ISubItem, SubMenuItem } from '..';

import { disableControls } from './storyUtils';

const allItems: ISubItem[] = [
    {
        text: 'first item',
    },
    {
        text: 'second item',
    },
    {
        text: 'third item',
    },
    {
        text: 'fourth item',
    },
    {
        text: 'fifth item',
    },
    {
        text: 'sixth item',
    },
];

export default {
    title: 'Components/SubMenuItem',
    component: SubMenuItem,
    argTypes: {
        items: disableControls(),
        onMouseOut: disableControls(),
        onMouseOver: disableControls(),
    },
} as Meta;

export const SubMenuItemStory: Story = props => {
    const { disableItem, disabledItemMsg, numItems, ...subMenuProps } = props;

    if (numItems > 1) {
        if (disableItem) {
            allItems[1].disabled = true;
            if (disabledItemMsg) {
                allItems[1].disabledMsg = disabledItemMsg;
            }
        }
    }

    return (
        <ul style={{ listStyle: 'none', width: '40%' }}>
            <SubMenuItem {...(subMenuProps as any)} items={allItems.slice(0, numItems)} />
        </ul>
    );
};

SubMenuItemStory.storyName = 'SubMenuItem';

SubMenuItemStory.args = {
    allowFilter: true,
    context: 'Your context here',
    disabled: false,
    text: 'Item text',
    title: 'Title',

    // Story props
    disableItem: false,
    disabledItemMsg: '',
    numItems: 2,
};
