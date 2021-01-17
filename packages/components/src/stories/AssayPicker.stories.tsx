import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';
import mock, { proxy } from 'xhr-mock';

import { AssayPicker } from '../internal/components/assay/AssayPicker';

mock.setup();
mock.use(proxy);

export default {
    title: 'Components/AssayPicker',
    component: AssayPicker,
    argTypes: {
        onChange: {
            action: 'change',
            control: { disable: true },
            table: { disable: true },
        },
        model: {
            control: { disable: true },
            table: { disable: true },
        },
    },
} as Meta;

export const AssayPickerStory: Story = props => <AssayPicker {...(props as any)} />;
AssayPickerStory.storyName = 'AssayPicker';
