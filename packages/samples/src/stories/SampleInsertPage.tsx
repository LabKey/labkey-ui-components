import * as React from 'react';
import { storiesOf } from "@storybook/react";
import { boolean, number, select, text, withKnobs } from '@storybook/addon-knobs';

import sampleIdCreationModel from "../test/data/sampleIdCreationModel.json";

import { SampleIdCreationModel } from '../models';
import { SampleInsertPage } from '..';

import './stories.scss'

storiesOf('SampleInsertPage', module)
    .addDecorator(withKnobs)
    .add("No target sample set", () => {
        const model = new SampleIdCreationModel(sampleIdCreationModel);

        return <SampleInsertPage
            insertModel={model}
        />;

    })
    .add("Target sample set, no parents", () => {
        const model = new SampleIdCreationModel(sampleIdCreationModel);
        // const location = new Location({
        //
        // });
        return <SampleInsertPage
            insertModel={model}
        />;
    })
;