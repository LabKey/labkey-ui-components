import React from 'react';
import { Meta, Story } from '@storybook/react/types-6-0';

import { Section } from '..';

export default {
    title: 'Components/Section',
    component: Section,
} as Meta;

export const SectionStory: Story = props => <Section {...(props as any)} />;

SectionStory.storyName = 'Section';

SectionStory.args = {
    context: 'Your context here',
    title: 'Title',
};
