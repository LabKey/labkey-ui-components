/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React, { FC, useState } from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, text, boolean } from '@storybook/addon-knobs';

import { ColorIcon } from "..";
import './stories.scss';

storiesOf('ColorIcon', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        return <ColorIcon
            label={text('label', 'Color Label')}
            value={text('value', '#009ce0')}
            asSquare={boolean('asSquare', false)}
        />;
    });
