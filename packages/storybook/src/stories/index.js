/*
 * Copyright (c) 2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { withMarkdownNotes } from '@storybook/addon-notes'
import { withKnobs, text, boolean } from '@storybook/addon-knobs/react'
import { fromJS, List } from 'immutable'

import '../app.css'

import { Grid, GridColumn } from '../../../grid'

const data = fromJS([{
    name: 'Dee Gordon',
    number: 9,
    position: 4
},{
    name: 'Mike Zunino',
    number: 3,
    position: 2
},{
    name: 'Kyle Seager',
    number: 15,
    position: 5
}]);

const columns = List([
    {
        index: 'name',
        caption: 'Player Name'
    },
    {
        index: 'number',
        caption: 'Number'
    },
    new GridColumn({
        index: 'position',
        title: 'Position',
        cell: (posNumber) => {
            switch (posNumber) {
                case 2: return 'C';
                case 4: return '2B';
                case 5: return '3B';
            }

            return `<${posNumber}>`;
        }
    })
]);

const withBasicDataMD = `
~~~js
<Grid data={data} />
~~~
`;

const withColumnsMD = `
An \`immutable.List\` can be provided to the \'columns\' prop to control the order, column titles, and override column rendering:

~~~js
const cols = List([{
    {
        index: 'name',
        title: 'Player Name'
    },
    {
        index: 'number',
        caption: 'Number'
    },
    new GridColumn({
        index: 'position',
        title: 'Position',
        cell: (posNumber) => {
            switch (posNumber) {
                case 2: return 'C';
                case 4: return '2B';
                case 5: return '3B';
            }

            return '<' + posNumber + '>';
        }
    })
}]);

<Grid data={data} columns={cols} />
~~~
`;

storiesOf('Grid', module)
    .addDecorator(withKnobs)
    .add('With basic data', withMarkdownNotes(withBasicDataMD)(() => <Grid data={data} />))
    .add('With columns', withMarkdownNotes(withColumnsMD)(() => <Grid data={data} columns={columns} />))
    .add('With knobs', () => {
        return (
            <Grid
                bordered={boolean('bordered', true)}
                condensed={boolean('condensed', false)}
                emptyText={text('emptyText', 'No data available')}
                data={data}
                responsive={boolean('responsive', true)}
                showHeader={boolean('showHeader', true)}
                striped={boolean('striped', true)}
                transpose={boolean('transpose', false)} />
        )
    });