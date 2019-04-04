/*
 * Copyright (c) 2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import { fromJS, List } from 'immutable'
import { GridColumn } from '../../../grid'

export const gridData = fromJS([{
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

export const gridColumns = List([
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

export const gridWithBasicDataMD = `
~~~js
<Grid data={data} />
~~~
`;

export const gridWithColumnsMD = `
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