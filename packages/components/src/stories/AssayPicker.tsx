import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';

import './stories.scss';
import { AssayPicker } from "../internal/components/assay/AssayPicker";

storiesOf('AssayPicker', module)
    .addDecorator(withKnobs)
    .add('assay picker', () => {

        return <AssayPicker />;
    });
