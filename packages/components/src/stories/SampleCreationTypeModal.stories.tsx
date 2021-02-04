import React from "react";
import {Meta, Story} from '@storybook/react/types-6-0';

import { SampleCreationTypeModal } from "../internal/components/samples/SampleCreationTypeModal";

export default {
    title: 'Components/SampleCreationType',
    component: SampleCreationTypeModal,
} as Meta;

export const SampleCreationTypeModalStory: Story = props => <SampleCreationTypeModal {...(props as any)} />;
SampleCreationTypeModalStory.storyName = 'SampleCreationTypeModal';

SampleCreationTypeModalStory.args = {
    parentCount: 1,
    onSubmit: (choice, numPerParent) => {
        console.log("choice ", choice, "numPerParent", numPerParent)
    },
    show: true,
    onCancel: () => {console.log("Cancel.")},
    allowAliquots: true,
    showIcons: false,
};
