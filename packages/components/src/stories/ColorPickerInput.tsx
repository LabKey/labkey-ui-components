/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React, { FC, useState } from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs, text, boolean } from '@storybook/addon-knobs';

import { ColorPickerInput } from "..";
import './stories.scss';

const WrappedColorPickerInput: FC<any> = (props) => {
    const [selected, setSelected] = useState<string>('#009ce0');
    const showLabel = boolean('showLabel', true);

    return (
        <ColorPickerInput
            name={'color-input-value'}
            text={showLabel ? text('text', 'Select color') : undefined}
            value={selected}
            onChange={(name, value) => setSelected(value)}
        />
    );
};

storiesOf('ColorPickerInput', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        return <WrappedColorPickerInput/>;
    });
