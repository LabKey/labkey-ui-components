import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import { LoadingModal } from '..';

storiesOf('LoadingModal', module)
    .addDecorator(withKnobs)
    .add('default properties', () => {
        return <LoadingModal />;
    })
    .add('with knobs', () => {
        return (
            <LoadingModal
                show={boolean('Show', true)}
                title={text('Title', 'Wait...')}
                onCancel={
                    boolean('Use onFormChange (check console log)?', true)
                        ? () => {
                              console.log('closed!');
                          }
                        : null
                }
            />
        );
    });
