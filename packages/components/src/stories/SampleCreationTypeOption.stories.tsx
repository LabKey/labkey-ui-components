import {Meta, Story} from '@storybook/react/types-6-0';
import {SampleCreationType, SampleCreationTypeOption} from "../internal/components/samples/SampleCreationTypeOption";
import React from "react";

export default {
    title: "Components/SampleCreationType",
    component: SampleCreationTypeOption,
} as Meta;

const option = {
    type: SampleCreationType.Derivatives,
    description:"Create multiple output samples per parent.",
    requiresMultipleParents: false,
    iconUrl: 'http://labkey.wpengine.com/wp-content/uploads/2015/12/cropped-LK-icon.png'
};

export const SampleCreationTypeOptionStory: Story = props => (
    <SampleCreationTypeOption {...(props as any)} />
);

SampleCreationTypeOptionStory.storyName = "SampleCreationTypeOption";
SampleCreationTypeOptionStory.args = {
    option: option,
    isSelected: false,
    onChoose: (evt) => {console.log("Choosing", evt)},
    showIcon: true
};
