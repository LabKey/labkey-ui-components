import * as React from "react";
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'

import { Progress } from "../components/Progress";

storiesOf("Progress", module)
    .addDecorator(withKnobs)
    .add("default properties", () => {
        return <Progress toggle={boolean("Toggle progress", false)}/>
    })
    .add("with knobs", () => {
        return <Progress
            toggle={boolean("Toggle progress", false)}
            delay={number("Delay in ms", 350)}
            estimate={number("Estimate in ms", 1000)}
            modal={boolean('Modal?', false)}
            title={text("Title", "Progress")}
            updateIncrement={number("Update increment in ms", 50)}
            />
    });