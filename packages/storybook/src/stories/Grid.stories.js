import React from 'react';
import { storiesOf } from '@storybook/react';
import { Grid } from "../../../grid";
import * as constants from "./constants";
import { withKnobs, text, boolean } from "@storybook/addon-knobs";

import '../app.css'

storiesOf('Grid', module)
    .addDecorator(withKnobs)
    .add('With basic data', () =>
        <Grid data={constants.gridData} />)
    .add('With columns', () =>
        <Grid data={constants.gridData} columns={constants.gridColumns} />)
    .add('With knobs', () =>
        <Grid
            bordered={boolean('bordered', true)}
            condensed={boolean('condensed', false)}
            emptyText={text('emptyText', 'No data available')}
            responsive={boolean('responsive', true)}
            showHeader={boolean('showHeader', true)}
            striped={boolean('striped', true)}
            transpose={boolean('transpose', false)}
            data={constants.gridData}
            columns={constants.gridColumns}
        />);