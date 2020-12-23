import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import { LabelOverlay } from '..';
import './stories.scss';

storiesOf('LabelOverlay', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        return (
            <LabelOverlay
                label={text('label', 'My label')}
                labelClass={text('label css class', 'col-2')}
                placement={text('placement', 'bottom')}
                isFormsy={boolean('isFormsy', true)}
                type={text('type', 'Text (String)')}
                description={text('description', 'The description for my input field.')}
                required={boolean('required', true)}
                content={
                    <div>
                        <b>Content:</b> this is extra content to add.
                    </div>
                }
            />
        );
    });
