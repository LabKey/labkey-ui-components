import * as React from 'react';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'

import { LabelOverlay } from "../components/forms/LabelOverlay";
import './stories.scss'

storiesOf('LabelOverlay', module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {
        return (
            <LabelOverlay
                label={text('label', 'My label')}
                placement={text('placement', 'bottom')}
                isFormsy={boolean('isFormsy', true)}
                type={text('type', 'Text (String)')}
                description={text('description', 'The description for my input field.')}
                required={boolean('required', true)}
                content={<div><b>Content:</b> this is extra content to add.</div>}
            />
        )
    });