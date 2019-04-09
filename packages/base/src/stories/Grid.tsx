import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, boolean } from '@storybook/addon-knobs'

import { Grid } from '../components/Grid'
import * as constants from './constants'

import './stories.css'

storiesOf('Grid', module)
    .addDecorator(withKnobs)
    .add('With basic data', () =>
        <Grid data={constants.gridData} />,
        {
                notes: constants.gridWithBasicDataMD
        })
    .add('With columns', () =>
        <Grid data={constants.gridData} columns={constants.gridColumns} />,
        {
                notes: constants.gridWithColumnsMD
        })
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