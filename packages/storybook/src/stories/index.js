/*
 * Copyright (c) 2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import  React from 'reactn'
import { storiesOf } from '@storybook/react'
import { withMarkdownNotes } from '@storybook/addon-notes'
import { withKnobs, text, boolean } from '@storybook/addon-knobs/react'

import '../app.css'

import { Grid } from '../../../grid'
import { initBrowserHistoryState, QueryGrid } from '../../../querygrid'
// import { NavigationBar } from '../../../navigation'
// import { SchemaQuery, User } from '../../../models'

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
//
// As it stands, the QueryGrid story will produce this error: Must call initBrowserHistoryState before you can access the global.QueryGrid_browserHistory object
// Just calling initBrowserHistoryState() here does not help.  Perhaps doing this with a decorator would help.
// initBrowserHistoryState();

storiesOf('QueryGrid', module)
    .add('With basic data', withMarkdownNotes(constants.gridWithBasicDataMD)(() => <QueryGrid schemaQuery={SchemaQuery.create("test", "query")}/>));

// storiesOf('NavigationBar', module)
//     .add('With logo', () => <NavigationBar brand={constants.brand}/> )
//     .add('With product id', () => <NavigationBar productId="testProduct"/> )
//     .add('With search box', () => <NavigationBar showSearchBox={true}/>)
//     .add('With user menu', () => <NavigationBar showUserMenu={true} user={new User()}/>);