/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { MenuItem } from 'react-bootstrap';
import { storiesOf } from '@storybook/react';
import { boolean, withKnobs } from '@storybook/addon-knobs';

import { ManageDropdownButton } from '..';
import './stories.scss';

storiesOf('ManageDropdownButton', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        // adding div with padding so that you can see the menu items when pullRight=true
        return (
            <div style={{ padding: '20px 0 0 100px' }}>
                <ManageDropdownButton
                    id="storybook-manage"
                    pullRight={boolean('pullRight', false)}
                    collapsed={boolean('collapsed', false)}
                >
                    <MenuItem disabled={true}>First Item</MenuItem>
                    <MenuItem disabled={true}>Second Item</MenuItem>
                </ManageDropdownButton>
            </div>
        );
    });
