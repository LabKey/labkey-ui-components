/*
 * Copyright (c) 2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { withMarkdownNotes } from '@storybook/addon-notes'
import { withKnobs, text, boolean } from '@storybook/addon-knobs/react'

import '../app.css'

import { Grid } from '../../../grid'
import { QueryGrid } from '../../../querygrid'
import * as constants from './constants'

storiesOf('Grid', module)
    .addDecorator(withKnobs)
    .add('With basic data', withMarkdownNotes(constants.gridWithBasicDataMD)(() =>
        <Grid data={constants.gridData} />))
    .add('With columns', withMarkdownNotes(constants.gridWithColumnsMD)(() =>
        <Grid data={constants.gridData} columns={constants.gridColumns} />))
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

storiesOf('QueryGrid', module)
    .add('With basic data', withMarkdownNotes(constants.gridWithBasicDataMD)(() => <QueryGrid/>));