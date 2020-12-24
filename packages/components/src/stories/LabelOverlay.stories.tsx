import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { LabelOverlay } from '..';

export default {
    title: 'Components/LabelOverlay',
    component: LabelOverlay,
    argTypes: {
        content: {
            control: { disable: true },
            table: { disable: true },
        },
        label: {
            label: 'label (modal only)',
        },
        placement: {
            description: 'Where the overlay appears relative to the icon',
            control: {
                type: 'select',
                options: [
                    'top',
                    'bottom',
                    'left',
                    'right',
                ],
            },
        },
    },
    parameters: {
        controls: {
            expanded: true,
        },
    },
} as Meta;

export const LabelOverlayStory: Story = props => <LabelOverlay {...(props as any)} />;

LabelOverlayStory.storyName = 'LabelOverlay';

LabelOverlayStory.args = {
    content: (
        <div>
            <b>Content:</b> this is extra content to add.
        </div>
    ),
    description: 'The description for my input field.',
    label: 'My label',
    placement: 'bottom',
    required: true,
    type: 'Text (String)',
};
