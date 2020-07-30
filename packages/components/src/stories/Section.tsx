import { storiesOf } from '@storybook/react';
import { text, withKnobs } from '@storybook/addon-knobs';
import { Section } from '..';
import React from 'react';

storiesOf('Section', module)
    .addDecorator(withKnobs)
    .add('default', () => {
        return (
            <Section
                caption={text("Caption", undefined)}
                context={text("Context", "Your context here")}
                title={text("Title", "Title")}
                titleSize={text("Title size", undefined)}
            />
        )
    })
;
