/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { ExpandableContainer } from '..';

export default {
    title: 'Components/ExpandableContainer',
    component: ExpandableContainer,
    argTypes: {
        clause: {
            control: { disable: true },
            table: { disable: true },
        },
        links: {
            control: { disable: true },
            table: { disable: true },
        },
        onClick: {
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

export const ExpandableContainerStory: Story = props => (
    <ExpandableContainer {...(props as any)}>
        <div style={{ padding: '20px' }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut ea commodo
            consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
            est laborum.
        </div>
    </ExpandableContainer>
);

ExpandableContainerStory.storyName = 'ExpandableContainer';

ExpandableContainerStory.args = {
    clause: (
        <div className="container-expandable-heading--clause">
            <h4>Title for My Container</h4>
        </div>
    ),
    iconClickOnly: false,
    iconFaCls: 'users fa-3x',
    isExpandable: true,
    links: (
        <div>
            <span className="container-expandable-heading">
                <span>
                    <a>Link for the container</a>
                </span>
            </span>
        </div>
    ),
};
