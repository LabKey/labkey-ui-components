import * as React from 'react';
import { storiesOf } from "@storybook/react";
import { boolean, number, select, text, withKnobs } from '@storybook/addon-knobs';
import { SampleDeleteConfirmModal } from "../components/samples/SampleDeleteConfirmModal";

import './stories.scss'

storiesOf('SampleDeleteConfirmModal', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        return <SampleDeleteConfirmModal
            numSamples={number('numSamples', 1)}
            showDependenciesLink={boolean('showDependenciesLink', false)}
            onConfirm={() => console.log('confirm')}
            onCancel={() => console.log('cancel')}
        />
    });