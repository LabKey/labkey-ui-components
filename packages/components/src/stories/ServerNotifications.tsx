import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';

import { ServerNotifications } from '../internal/components/notifications/ServerNotifications';

storiesOf('ServerNotifications', module)
    .addDecorator(withKnobs)
    .add('default', () => {
        return (
            <div style={{backgroundColor: 'blue', width: '55px', lineHeight: "4"}}>
                <ServerNotifications />
            </div>
        );
    });
