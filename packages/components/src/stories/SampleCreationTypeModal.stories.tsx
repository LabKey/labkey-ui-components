import React from "react";
import {Meta, Story} from '@storybook/react/types-6-0';

import {ALIQUOT_CREATION, DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION, SampleCreationTypeModal } from "../index";

export default {
    title: 'Components/SampleCreationType',
    component: SampleCreationTypeModal,
    argTypes: {
        onSubmit: {
            control: { disable: true },
            table: { disable: true },
        },
        onCancel: {
            control: { disable: true },
            table: { disable: true },
        }
    },
} as Meta;

export const SampleCreationTypeModalStory: Story = props => <SampleCreationTypeModal {...(props as any)} />;
SampleCreationTypeModalStory.storyName = 'SampleCreationTypeModal';

SampleCreationTypeModalStory.args = {
    parentCount: 1,
    onSubmit: (choice, numPerParent) => {
        console.log("choice ", choice, "numPerParent", numPerParent)
    },
    options: [ DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION, ALIQUOT_CREATION ],
    show: true,
    onCancel: () => {console.log("Cancel.")},
    showIcons: false,
};
