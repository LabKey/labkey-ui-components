import {storiesOf} from "@storybook/react";
import {boolean, number, text, withKnobs} from "@storybook/addon-knobs";
import React from "react";
import {
    CreationType,
    SampleCreationTypeModal,
    SampleCreationTypeOption
} from "../internal/components/samples/SampleCreationType";

storiesOf('SampleCreationType', module)
    .addDecorator(withKnobs)
    .add("single option", () => {
        const option = {
            type: CreationType.Derivatives,
            description: text("Description", "Create multiple output samples per parent."),
            requiresMultipleParents: false,
            iconUrl: 'http://labkey.wpengine.com/wp-content/uploads/2015/12/cropped-LK-icon.png'
        }
        return (
            <SampleCreationTypeOption
                option={option}
                isSelected={boolean("isSelected?", false)}
                onChoose={(evt) => {console.log("Choosing", evt)}}
                showIcon={boolean("showIcon?", true)}
            />
        )
    })
    .add('modal', () => {
        return (
            <SampleCreationTypeModal
                parentCount={number("Number of parents", 1)}
                onSubmit={(choice, numPerParent) => {
                    console.log("choice ", choice, "numPerParent", numPerParent)}
                }
                show={true}
                onCancel={() => {console.log("Cancel.")}}
                allowAliquots={boolean("Allow aliquots?", true)}
                showIcons={boolean("Show icons?", false)}
            />
        );
    })
